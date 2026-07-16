import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb, currentUser } from '../db'
import type {
  Hook,
  HookCreateInput,
  HookListParams,
  HookUpdateInput,
  TestHooksSetInput
} from '../../shared/types'
import { normalizeStep } from './testCases'

// steps는 JSON 문자열, enabled는 INTEGER(0/1)로 저장된다
type HookRow = Omit<Hook, 'steps' | 'enabled'> & {
  steps: string
  enabled: number
}

function parseRow(row: HookRow): Hook {
  const parsedSteps = JSON.parse(row.steps) as unknown[]
  return {
    ...row,
    enabled: row.enabled === 1,
    steps: parsedSteps.map(normalizeStep)
  }
}

export function registerHookHandlers(): void {
  ipcMain.handle('hooks:list', (_event, params: HookListParams): Hook[] => {
    const db = getDb()
    // projectId가 없으면 전역 훅(project_id IS NULL)만 조회한다
    const conditions: string[] = [params.projectId ? 'project_id = @projectId' : 'project_id IS NULL']
    const args: Record<string, string> = {}
    if (params.projectId) args.projectId = params.projectId

    if (params.type && params.type !== 'all') {
      conditions.push('type = @type')
      args.type = params.type
    }
    if (params.timing && params.timing !== 'all') {
      conditions.push('timing = @timing')
      args.timing = params.timing
    }
    if (params.search && params.search.trim() !== '') {
      conditions.push("name LIKE @search ESCAPE '\\'")
      args.search = `%${params.search.trim().replace(/[\\%_]/g, '\\$&')}%`
    }

    const rows = db
      .prepare(
        `
          SELECT * FROM hooks
          WHERE ${conditions.join(' AND ')}
          ORDER BY
            CASE timing
              WHEN 'beforeAll' THEN 0
              WHEN 'beforeEach' THEN 1
              WHEN 'afterEach' THEN 2
              WHEN 'afterAll' THEN 3
              WHEN 'onFailure' THEN 4
            END ASC,
            order_index ASC
        `
      )
      .all(args) as HookRow[]

    return rows.map(parseRow)
  })

  ipcMain.handle('hooks:create', (_event, input: HookCreateInput): Hook => {
    const db = getDb()
    const user = currentUser()
    const id = randomUUID()

    const { maxOrder } = (
      input.project_id
        ? db
            .prepare('SELECT COALESCE(MAX(order_index), -1) AS maxOrder FROM hooks WHERE project_id = ?')
            .get(input.project_id)
        : db.prepare('SELECT COALESCE(MAX(order_index), -1) AS maxOrder FROM hooks WHERE project_id IS NULL').get()
    ) as { maxOrder: number }

    db.prepare(
      `
        INSERT INTO hooks (id, project_id, name, description, type, timing, enabled, steps, start_url, order_index, created_by, updated_by)
        VALUES (@id, @projectId, @name, @description, @type, @timing, @enabled, @steps, @startUrl, @orderIndex, @user, @user)
      `
    ).run({
      id,
      projectId: input.project_id ?? null,
      name: input.name.trim(),
      description: input.description,
      type: input.type,
      timing: input.timing,
      enabled: input.enabled ? 1 : 0,
      steps: JSON.stringify(input.steps),
      startUrl: input.start_url ?? null,
      orderIndex: maxOrder + 1,
      user
    })

    return parseRow(db.prepare('SELECT * FROM hooks WHERE id = ?').get(id) as HookRow)
  })

  ipcMain.handle('hooks:update', (_event, input: HookUpdateInput): Hook => {
    const db = getDb()
    const user = currentUser()

    db.prepare(
      `
        UPDATE hooks
        SET name = @name, description = @description, type = @type, timing = @timing, enabled = @enabled,
            steps = @steps, start_url = @startUrl,
            updated_dt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_by = @user
        WHERE id = @id
      `
    ).run({
      id: input.id,
      name: input.name.trim(),
      description: input.description,
      type: input.type,
      timing: input.timing,
      enabled: input.enabled ? 1 : 0,
      steps: JSON.stringify(input.steps),
      startUrl: input.start_url ?? null,
      user
    })

    return parseRow(db.prepare('SELECT * FROM hooks WHERE id = ?').get(input.id) as HookRow)
  })

  ipcMain.handle('hooks:remove', (_event, id: string): void => {
    const db = getDb()
    db.prepare('DELETE FROM hooks WHERE id = ?').run(id)
  })

  // 테스트에 불러와 연결한 전역 훅 목록 조회 (연결 순서 유지)
  ipcMain.handle('hooks:listForTest', (_event, testId: string): Hook[] => {
    const db = getDb()
    const rows = db
      .prepare(
        `
          SELECT h.* FROM hooks h
          JOIN test_hooks th ON th.hook_id = h.id
          WHERE th.test_id = ?
          ORDER BY th.order_index ASC
        `
      )
      .all(testId) as HookRow[]
    return rows.map(parseRow)
  })

  // 테스트의 전역 훅 연결을 통째로 교체한다 (선택 모달에서 저장 시)
  ipcMain.handle('hooks:setForTest', (_event, input: TestHooksSetInput): void => {
    const db = getDb()
    const insert = db.prepare(
      'INSERT INTO test_hooks (test_id, hook_id, order_index) VALUES (@testId, @hookId, @orderIndex)'
    )
    const replace = db.transaction((hookIds: string[]) => {
      db.prepare('DELETE FROM test_hooks WHERE test_id = ?').run(input.test_id)
      hookIds.forEach((hookId, index) => {
        insert.run({ testId: input.test_id, hookId, orderIndex: index })
      })
    })
    replace(input.hook_ids)
  })
}
