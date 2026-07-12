import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb, currentUser } from '../db'
import type { Test, TestCreateInput, TestListParams, TestUpdateInput } from '../../shared/types'

export function registerTestHandlers(): void {
  ipcMain.handle('tests:list', (_event, params: TestListParams): Test[] => {
    const db = getDb()
    const conditions: string[] = ['project_id = @projectId']
    const args: Record<string, string> = { projectId: params.projectId }

    if (params.type && params.type !== 'all') {
      conditions.push('type = @type')
      args.type = params.type
    }
    if (params.search && params.search.trim() !== '') {
      conditions.push("name LIKE @search ESCAPE '\\'")
      args.search = `%${params.search.trim().replace(/[\\%_]/g, '\\$&')}%`
    }

    return db
      .prepare(
        `
          SELECT * FROM tests
          WHERE ${conditions.join(' AND ')}
          ORDER BY created_dt DESC
        `
      )
      .all(args) as Test[]
  })

  ipcMain.handle('tests:create', (_event, input: TestCreateInput): Test => {
    const db = getDb()
    const user = currentUser()
    const id = randomUUID()

    db.prepare(
      `
        INSERT INTO tests (id, project_id, name, type, created_by, updated_by)
        VALUES (@id, @projectId, @name, @type, @user, @user)
      `
    ).run({ id, projectId: input.project_id, name: input.name.trim(), type: input.type, user })

    return db.prepare('SELECT * FROM tests WHERE id = ?').get(id) as Test
  })

  ipcMain.handle('tests:update', (_event, input: TestUpdateInput): Test => {
    const db = getDb()
    const user = currentUser()

    db.prepare(
      `
        UPDATE tests
        SET name = @name, type = @type, updated_dt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_by = @user
        WHERE id = @id
      `
    ).run({ id: input.id, name: input.name.trim(), type: input.type, user })

    return db.prepare('SELECT * FROM tests WHERE id = ?').get(input.id) as Test
  })

  ipcMain.handle('tests:remove', (_event, id: string): void => {
    const db = getDb()
    db.prepare('DELETE FROM tests WHERE id = ?').run(id)
  })
}
