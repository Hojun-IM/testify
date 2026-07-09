import { app } from 'electron'
import { join } from 'path'
import { userInfo } from 'os'
import Database from 'better-sqlite3'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'testify.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.exec(SCHEMA_SQL)
  }
  return db
}

export function currentUser(): string {
  return userInfo().username
}
