import { app } from 'electron'
import { join } from 'path'
import { userInfo } from 'os'
import Database from 'better-sqlite3'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

// test_cases 테이블이 신설 컬럼 없이 이미 생성되어 있는 기존 DB 파일을 위한 보정 (CREATE TABLE IF NOT EXISTS는 컬럼을 추가해주지 않음)
function ensureTestCaseColumns(database: Database.Database): void {
  const columns = database.prepare('PRAGMA table_info(test_cases)').all() as { name: string }[]
  const columnNames = new Set(columns.map((column) => column.name))
  const migrations: [string, string][] = [
    ['status', "ALTER TABLE test_cases ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'"],
    ['precondition', 'ALTER TABLE test_cases ADD COLUMN precondition TEXT'],
    ['steps', "ALTER TABLE test_cases ADD COLUMN steps TEXT NOT NULL DEFAULT '[]'"],
    ['tags', "ALTER TABLE test_cases ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'"],
    ['policy', "ALTER TABLE test_cases ADD COLUMN policy TEXT NOT NULL DEFAULT '{}'"]
  ]

  for (const [name, sql] of migrations) {
    if (!columnNames.has(name)) database.exec(sql)
  }
}

// 초기 버전의 hooks 테이블은 project_id가 NOT NULL이었다. 전역 훅(project_id = NULL)을
// 지원하도록 컬럼 제약을 완화한다. SQLite는 컬럼 제약을 직접 바꿀 수 없어 테이블을 재생성한다
function ensureHooksProjectNullable(database: Database.Database): void {
  const columns = database.prepare('PRAGMA table_info(hooks)').all() as {
    name: string
    notnull: number
  }[]
  const projectIdColumn = columns.find((column) => column.name === 'project_id')
  if (!projectIdColumn || projectIdColumn.notnull === 0) return

  // 주의: 원본을 RENAME하면 (legacy_alter_table 기본값에서) 참조하는 테이블(test_hooks)의
  // FK 절까지 임시 이름으로 따라가 버린다. 그래서 "새 테이블 생성 → 복사 → 원본 DROP →
  // 새 테이블 RENAME" 순서를 쓴다 — hooks_new를 참조하는 테이블은 없으므로 안전하다
  database.pragma('foreign_keys = OFF')
  const rebuild = database.transaction(() => {
    database.exec(`
      CREATE TABLE hooks_new (
        id            TEXT PRIMARY KEY,
        project_id    TEXT REFERENCES projects(id) ON DELETE CASCADE,
        name          TEXT NOT NULL,
        description   TEXT,
        type          TEXT NOT NULL
                      CHECK (type IN ('api', 'e2e')),
        timing        TEXT NOT NULL
                      CHECK (timing IN ('beforeAll', 'beforeEach', 'afterEach', 'afterAll', 'onFailure')),
        enabled       INTEGER NOT NULL DEFAULT 1,
        steps         TEXT NOT NULL DEFAULT '[]',
        start_url     TEXT,
        order_index   INTEGER NOT NULL,
        created_dt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_dt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        created_by    TEXT NOT NULL,
        updated_by    TEXT NOT NULL
      );

      INSERT INTO hooks_new SELECT * FROM hooks;
      DROP TABLE hooks;
      ALTER TABLE hooks_new RENAME TO hooks;
      CREATE INDEX IF NOT EXISTS idx_hooks_project_id ON hooks(project_id);
    `)
  })
  rebuild()
  database.pragma('foreign_keys = ON')
}

// 초기 마이그레이션 버그로 test_hooks의 FK가 임시 테이블(hooks_old)을 참조하게 된 DB를 복구한다
function ensureTestHooksReferences(database: Database.Database): void {
  const row = database
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'test_hooks'")
    .get() as { sql: string } | undefined
  if (!row || !row.sql.includes('hooks_old')) return

  database.pragma('foreign_keys = OFF')
  const rebuild = database.transaction(() => {
    database.exec(`
      CREATE TABLE test_hooks_new (
        test_id       TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        hook_id       TEXT NOT NULL REFERENCES hooks(id) ON DELETE CASCADE,
        order_index   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (test_id, hook_id)
      );

      INSERT INTO test_hooks_new SELECT * FROM test_hooks;
      DROP TABLE test_hooks;
      ALTER TABLE test_hooks_new RENAME TO test_hooks;
      CREATE INDEX IF NOT EXISTS idx_test_hooks_test_id ON test_hooks(test_id);
    `)
  })
  rebuild()
  database.pragma('foreign_keys = ON')
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'testify.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.exec(SCHEMA_SQL)
    ensureTestCaseColumns(db)
    ensureHooksProjectNullable(db)
    ensureTestHooksReferences(db)
  }
  return db
}

export function currentUser(): string {
  return userInfo().username
}
