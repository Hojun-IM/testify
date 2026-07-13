import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb, currentUser } from '../db'
import type {
  TestCase,
  TestCaseCreateInput,
  TestCaseListParams,
  TestCasePolicy,
  TestCaseReorderInput,
  TestCaseUpdateInput
} from '../../shared/types'

type TestCaseRow = Omit<TestCase, 'steps' | 'tags' | 'policy'> & {
  steps: string
  tags: string
  policy: string
}

function parseRow(row: TestCaseRow): TestCase {
  return {
    ...row,
    steps: JSON.parse(row.steps),
    tags: JSON.parse(row.tags),
    policy: JSON.parse(row.policy) as TestCasePolicy
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
