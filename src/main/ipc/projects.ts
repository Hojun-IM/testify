import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb, currentUser } from '../db'
import type {
  Project,
  ProjectCreateInput,
  ProjectEnvironment,
  ProjectExecutionHistoryEntry,
  ProjectExecutionHistoryParams,
  ProjectListParams,
  ProjectStatus,
  ProjectSummary,
  ProjectUpdateInput
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

  ipcMain.handle('projects:update', (_event, input: ProjectUpdateInput): Project => {
    const db = getDb()
    const user = currentUser()

    const updateProject = db.prepare(
      `
        UPDATE projects
        SET name = @name, updated_dt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_by = @user
        WHERE id = @id
      `
    )
    const deleteEnvironments = db.prepare('DELETE FROM project_environments WHERE project_id = ?')
    const insertEnvironment = db.prepare(
      `
        INSERT INTO project_environments (id, project_id, name, url)
        VALUES (@id, @projectId, @name, @url)
      `
    )

    db.transaction(() => {
      updateProject.run({ id: input.id, name: input.name.trim(), user })
      deleteEnvironments.run(input.id)
      for (const env of input.environments ?? []) {
        const name = env.name.trim()
        const url = env.url.trim()
        if (!name || !url) continue
        insertEnvironment.run({ id: randomUUID(), projectId: input.id, name, url })
      }
    })()

    return db.prepare('SELECT * FROM projects WHERE id = ?').get(input.id) as Project
  })

  ipcMain.handle(
    'projects:setStatus',
    (_event, { id, status }: { id: string; status: ProjectStatus }): Project => {
      const db = getDb()
      const user = currentUser()

      db.prepare(
        `
          UPDATE projects
          SET status = @status, updated_dt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_by = @user
          WHERE id = @id
        `
      ).run({ id, status, user })

      return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project
    }
  )

  ipcMain.handle('projects:remove', (_event, id: string): void => {
    const db = getDb()
    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  })

  // 프로젝트 상세의 실행 횟수 히트맵이 쓰는, 연도 내 날짜별 실제 케이스 실행 횟수.
  // started_at은 UTC로 저장되어 있어 'localtime'으로 변환한 뒤 날짜를 잘라야
  // 자정 근처(예: 한국 시간 오전 9시 이전) 실행이 하루 전 날짜로 집계되지 않는다.
  ipcMain.handle(
    'projects:executionHistory',
    (_event, params: ProjectExecutionHistoryParams): ProjectExecutionHistoryEntry[] => {
      const db = getDb()
      return db
        .prepare(
          `
            SELECT date(tcr.started_at, 'localtime') AS date, COUNT(*) AS count
            FROM test_case_runs tcr
            JOIN test_cases tc ON tc.id = tcr.test_case_id
            JOIN tests t ON t.id = tc.test_id
            WHERE t.project_id = @projectId
              AND strftime('%Y', tcr.started_at, 'localtime') = @year
            GROUP BY date(tcr.started_at, 'localtime')
          `
        )
        .all({ projectId: params.projectId, year: String(params.year) }) as ProjectExecutionHistoryEntry[]
    }
  )
}
