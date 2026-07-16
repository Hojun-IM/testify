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

-- 프로젝트에 등록된 환경
CREATE TABLE IF NOT EXISTS project_environments (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_dt  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_project_environments_project_id ON project_environments(project_id);

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
  status        TEXT NOT NULL DEFAULT 'draft',
  precondition  TEXT,
  steps         TEXT NOT NULL DEFAULT '[]',
  tags          TEXT NOT NULL DEFAULT '[]',
  policy        TEXT NOT NULL DEFAULT '{}',
  order_index   INTEGER NOT NULL,
  last_run_at   TEXT,
  created_dt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_dt    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by    TEXT NOT NULL,
  updated_by    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_test_cases_test_id ON test_cases(test_id);

-- 훅 — 여러 케이스에서 재사용하는 공통 시나리오
-- project_id가 NULL이면 전역 훅(사이드바 훅 탭에서 관리, 테스트에 불러와 사용),
-- 값이 있으면 해당 프로젝트 전용 훅
CREATE TABLE IF NOT EXISTS hooks (
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
CREATE INDEX IF NOT EXISTS idx_hooks_project_id ON hooks(project_id);

-- 테스트가 불러와 사용하는 전역 훅 연결
CREATE TABLE IF NOT EXISTS test_hooks (
  test_id       TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  hook_id       TEXT NOT NULL REFERENCES hooks(id) ON DELETE CASCADE,
  order_index   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (test_id, hook_id)
);
CREATE INDEX IF NOT EXISTS idx_test_hooks_test_id ON test_hooks(test_id);

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
