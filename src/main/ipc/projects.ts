import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb, currentUser } from '../db'
import type { Project, ProjectCreateInput, ProjectListParams } from '../../shared/types'

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:list', (_event, params: ProjectListParams = {}): Project[] => {
    const db = getDb()
    const conditions: string[] = []
    const args: Record<string, string> = {}

    if (params.status && params.status !== 'all') {
      conditions.push('status = @status')
      args.status = params.status
    }
    if (params.search && params.search.trim() !== '') {
      conditions.push('name LIKE @search ESCAPE \'\\\'')
      args.search = `%${params.search.trim().replace(/[\\%_]/g, '\\$&')}%`
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return db.prepare(`SELECT * FROM projects ${where} ORDER BY created_dt DESC`).all(args) as Project[]
  })

  ipcMain.handle('projects:create', (_event, input: ProjectCreateInput): Project => {
    const db = getDb()
    const user = currentUser()
    const id = randomUUID()

    db.prepare(
      `
        INSERT INTO projects (id, name, status, created_by, updated_by)
        VALUES (@id, @name, 'active', @user, @user)
      `
    ).run({ id, name: input.name.trim(), user })

    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project
  })
}
