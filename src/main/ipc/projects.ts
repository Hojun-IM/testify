import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb, currentUser } from '../db'
import type {
  Project,
  ProjectCreateInput,
  ProjectEnvironment,
  ProjectListParams,
  ProjectSummary
} from '../../shared/types'

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:list', (_event, params: ProjectListParams = {}): ProjectSummary[] => {
    const db = getDb()
    const conditions: string[] = []
    const args: Record<string, string> = {}

    if (params.status && params.status !== 'all') {
      conditions.push('p.status = @status')
      args.status = params.status
    }
    if (params.search && params.search.trim() !== '') {
      conditions.push("p.name LIKE @search ESCAPE '\\'")
      args.search = `%${params.search.trim().replace(/[\\%_]/g, '\\$&')}%`
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return db
      .prepare(
        `
          SELECT
            p.*,
            (SELECT COUNT(*) FROM tests t WHERE t.project_id = p.id) AS test_count,
            (SELECT COUNT(*) FROM test_cases tc
               JOIN tests t ON tc.test_id = t.id
              WHERE t.project_id = p.id) AS test_case_count
          FROM projects p
          ${where}
          ORDER BY p.created_dt DESC
        `
      )
      .all(args) as ProjectSummary[]
  })

  ipcMain.handle('projects:create', (_event, input: ProjectCreateInput): Project => {
    const db = getDb()
    const user = currentUser()
    const id = randomUUID()

    const insertProject = db.prepare(
      `
        INSERT INTO projects (id, name, status, created_by, updated_by)
        VALUES (@id, @name, 'active', @user, @user)
      `
    )
    const insertEnvironment = db.prepare(
      `
        INSERT INTO project_environments (id, project_id, name, url)
        VALUES (@id, @projectId, @name, @url)
      `
    )

    db.transaction(() => {
      insertProject.run({ id, name: input.name.trim(), user })
      for (const env of input.environments ?? []) {
        const name = env.name.trim()
        const url = env.url.trim()
        if (!name || !url) continue
        insertEnvironment.run({ id: randomUUID(), projectId: id, name, url })
      }
    })()

    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project
  })

  ipcMain.handle('projects:environments', (_event, projectId: string): ProjectEnvironment[] => {
    const db = getDb()
    return db
      .prepare('SELECT * FROM project_environments WHERE project_id = ? ORDER BY created_dt ASC')
      .all(projectId) as ProjectEnvironment[]
  })
}
