export const SCHEMA_SQL = `
-- 프로젝트
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'archived')),
  created_dt  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_dt  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by  TEXT NOT NULL,
  updated_by  TEXT NOT NULL
);

-- 테스트 (프로젝트에 속함)
CREATE TABLE IF NOT EXISTS tests (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL,
  last_run_at   TEXT,
  created_dt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_dt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by    TEXT NOT NULL,
  updated_by    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tests_project_id ON tests(project_id);

-- 테스트 케이스 (테스트에 속함)
CREATE TABLE IF NOT EXISTS test_cases (
  id            TEXT PRIMARY KEY,
  test_id       TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  order_index   INTEGER NOT NULL,
  last_run_at   TEXT,
  created_dt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_dt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by    TEXT NOT NULL,
  updated_by    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_test_cases_test_id ON test_cases(test_id);

-- 테스트 실행 세션 (테스트 단위 실행)
CREATE TABLE IF NOT EXISTS test_runs (
  id            TEXT PRIMARY KEY,
  test_id       TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  status        TEXT NOT NULL
                CHECK (status IN ('running', 'success', 'failure', 'error', 'partial')),
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  created_by    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_test_runs_test_id ON test_runs(test_id);

-- 테스트 케이스 실행 로그 (개별 실행 및 test_runs에 속한 실행 모두 기록)
CREATE TABLE IF NOT EXISTS test_case_runs (
  id            TEXT PRIMARY KEY,
  test_case_id  TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  test_run_id   TEXT REFERENCES test_runs(id) ON DELETE CASCADE,
  status        TEXT NOT NULL
                CHECK (status IN ('success', 'failure', 'error', 'skipped')),
  message       TEXT,
  duration_ms   INTEGER,
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  created_by    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_test_case_runs_test_case_id ON test_case_runs(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_case_runs_test_run_id ON test_case_runs(test_run_id);
`
