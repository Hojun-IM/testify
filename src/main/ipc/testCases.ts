import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb, currentUser } from '../db'
import type {
  TestCase,
  TestCaseCreateInput,
  TestCaseListParams,
  TestCasePolicy,
  TestCaseReorderInput,
  TestCaseStep,
  TestCaseStepAutomation,
  TestCaseUpdateInput
} from '../../shared/types'

type TestCaseRow = Omit<TestCase, 'steps' | 'tags' | 'policy'> & {
  steps: string
  tags: string
  policy: string
}

const DEFAULT_POLICY: TestCasePolicy = {
  targetEnvs: [],
  trigger: 'manual',
  retryCount: 0,
  timeoutSec: 30,
  notifyOnFailure: false
}

// 앱을 거치지 않고 직접 삽입되었거나 이전 스키마로 저장된 행은 policy/steps가 불완전할 수 있어
// 항상 완전한 형태로 정규화해서 내려준다 (그렇지 않으면 프론트에서 예: policy.targetEnvs가
// undefined가 되어 렌더링이 깨진다)
function normalizeAutomation(raw: unknown): TestCaseStepAutomation | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const partial = raw as Partial<TestCaseStepAutomation>
  if (typeof partial.actionType !== 'string' || typeof partial.selector !== 'string') return undefined
  return {
    actionType: partial.actionType,
    selector: partial.selector,
    ...(typeof partial.value === 'string' ? { value: partial.value } : {})
  }
}

function normalizeStep(step: unknown): TestCaseStep {
  if (step && typeof step === 'object') {
    const partial = step as Partial<TestCaseStep>
    const automation = normalizeAutomation(partial.automation)
    return {
      action: partial.action ?? '',
      expected: partial.expected ?? '',
      outcome: partial.outcome ?? '',
      ...(automation ? { automation } : {})
    }
  }
  return { action: typeof step === 'string' ? step : '', expected: '', outcome: '' }
}

function parseRow(row: TestCaseRow): TestCase {
  const parsedSteps = JSON.parse(row.steps) as unknown[]
  const parsedPolicy = JSON.parse(row.policy) as Partial<TestCasePolicy>

  return {
    ...row,
    steps: parsedSteps.map(normalizeStep),
    tags: JSON.parse(row.tags),
    policy: { ...DEFAULT_POLICY, ...parsedPolicy }
  }
}

export function registerTestCaseHandlers(): void {
  ipcMain.handle('testCases:list', (_event, params: TestCaseListParams): TestCase[] => {
    const db = getDb()
    const conditions: string[] = ['test_id = @testId']
    const args: Record<string, string> = { testId: params.testId }

    if (params.search && params.search.trim() !== '') {
      conditions.push("name LIKE @search ESCAPE '\\'")
      args.search = `%${params.search.trim().replace(/[\\%_]/g, '\\$&')}%`
    }

    const rows = db
      .prepare(
        `
          SELECT * FROM test_cases
          WHERE ${conditions.join(' AND ')}
          ORDER BY order_index ASC
        `
      )
      .all(args) as TestCaseRow[]

    return rows.map(parseRow)
  })

  ipcMain.handle('testCases:create', (_event, input: TestCaseCreateInput): TestCase => {
    const db = getDb()
    const user = currentUser()
    const id = randomUUID()

    const { maxOrder } = db
      .prepare('SELECT COALESCE(MAX(order_index), -1) AS maxOrder FROM test_cases WHERE test_id = ?')
      .get(input.test_id) as { maxOrder: number }

    db.prepare(
      `
        INSERT INTO test_cases (id, test_id, name, status, precondition, steps, tags, policy, order_index, created_by, updated_by)
        VALUES (@id, @testId, @name, @status, @precondition, @steps, @tags, @policy, @orderIndex, @user, @user)
      `
    ).run({
      id,
      testId: input.test_id,
      name: input.name.trim(),
      status: input.status,
      precondition: input.precondition,
      steps: JSON.stringify(input.steps),
      tags: JSON.stringify(input.tags),
      policy: JSON.stringify(input.policy),
      orderIndex: maxOrder + 1,
      user
    })

    return parseRow(db.prepare('SELECT * FROM test_cases WHERE id = ?').get(id) as TestCaseRow)
  })

  ipcMain.handle('testCases:update', (_event, input: TestCaseUpdateInput): TestCase => {
    const db = getDb()
    const user = currentUser()

    db.prepare(
      `
        UPDATE test_cases
        SET name = @name, status = @status, precondition = @precondition, steps = @steps, tags = @tags,
            policy = @policy, updated_dt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_by = @user
        WHERE id = @id
      `
    ).run({
      id: input.id,
      name: input.name.trim(),
      status: input.status,
      precondition: input.precondition,
      steps: JSON.stringify(input.steps),
      tags: JSON.stringify(input.tags),
      policy: JSON.stringify(input.policy),
      user
    })

    return parseRow(db.prepare('SELECT * FROM test_cases WHERE id = ?').get(input.id) as TestCaseRow)
  })

  ipcMain.handle('testCases:remove', (_event, id: string): void => {
    const db = getDb()
    db.prepare('DELETE FROM test_cases WHERE id = ?').run(id)
  })

  ipcMain.handle('testCases:reorder', (_event, input: TestCaseReorderInput): void => {
    const db = getDb()
    const update = db.prepare(
      'UPDATE test_cases SET order_index = @orderIndex WHERE id = @id AND test_id = @testId'
    )
    const applyReorder = db.transaction((orderedIds: string[]) => {
      orderedIds.forEach((id, index) => {
        update.run({ id, orderIndex: index, testId: input.test_id })
      })
    })
    applyReorder(input.ordered_ids)
  })
}
