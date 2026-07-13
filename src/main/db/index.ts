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

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'testify.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.exec(SCHEMA_SQL)
    ensureTestCaseColumns(db)
  }
  return db
}

export function currentUser(): string {
  return userInfo().username
}
