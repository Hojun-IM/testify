import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb, currentUser } from '../db'
import type { TestCaseRunRecordInput, TestRun, TestRunFinishInput, TestRunStartInput } from '../../shared/types'

// 대시보드에서 케이스를 실제로 재생할 때 남기는 실행 기록. 프로젝트 상세의 실행 횟수
// 히트맵과 케이스/테스트 목록의 "마지막 실행" 표시가 이 데이터를 근거로 삼는다
export function registerTestRunHandlers(): void {
  // 재생을 시작할 때 실행 세션(test_run) 하나를 연다. 대시보드의 한 번의 재생 요청은
  // 항상 단일 테스트에 속한 케이스들이므로 test_id 하나로 세션을 특정할 수 있다
  ipcMain.handle('testRuns:start', (_event, input: TestRunStartInput): TestRun => {
    const db = getDb()
    const user = currentUser()
    const id = randomUUID()

    db.prepare(
      `
        INSERT INTO test_runs (id, test_id, status, started_at, created_by)
        VALUES (@id, @testId, 'running', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), @user)
      `
    ).run({ id, testId: input.test_id, user })

    return db.prepare('SELECT * FROM test_runs WHERE id = ?').get(id) as TestRun
  })

  // 케이스 하나의 재생이 끝날 때마다 실행 로그 한 줄을 남기고, 그 케이스의 마지막
  // 실행 시각을 갱신한다
  ipcMain.handle('testRuns:recordCase', (_event, input: TestCaseRunRecordInput): void => {
    const db = getDb()
    const user = currentUser()
    const id = randomUUID()

    db.transaction(() => {
      db.prepare(
        `
          INSERT INTO test_case_runs
            (id, test_case_id, test_run_id, status, message, duration_ms, started_at, finished_at, created_by)
          VALUES
            (@id, @testCaseId, @testRunId, @status, @message, @durationMs,
             strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), @user)
        `
      ).run({
        id,
        testCaseId: input.test_case_id,
        testRunId: input.test_run_id,
        status: input.status,
        message: input.message ?? null,
        durationMs: input.duration_ms ?? null,
        user
      })

      db.prepare(
        "UPDATE test_cases SET last_run_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = @id"
      ).run({ id: input.test_case_id })
    })()
  })

  // 실행 세션 전체가 끝나면(정상 종료든 중단이든) 상태를 확정하고, 소속 테스트의
  // 마지막 실행 시각도 함께 갱신한다
  ipcMain.handle('testRuns:finish', (_event, input: TestRunFinishInput): void => {
    const db = getDb()

    db.transaction(() => {
      const run = db.prepare('SELECT test_id FROM test_runs WHERE id = ?').get(input.id) as
        | { test_id: string }
        | undefined

      db.prepare(
        `
          UPDATE test_runs
          SET status = @status, finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = @id
        `
      ).run({ id: input.id, status: input.status })

      if (run) {
        db.prepare(
          "UPDATE tests SET last_run_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = @id"
        ).run({ id: run.test_id })
      }
    })()
  })
}
