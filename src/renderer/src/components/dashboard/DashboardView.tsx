import { useState } from 'react'
import { Button } from '../ui/Button'
import { RunStatsRow } from './RunStatsRow'
import { LiveBrowserPane } from './LiveBrowserPane'
import { CaseResultsPanel, type ResultFilter } from './CaseResultsPanel'
import { RunLogPane } from './RunLogPane'
import { useSimulatedRun } from './useSimulatedRun'
import styles from './DashboardView.module.css'

export function DashboardView({ sidebarCollapsed }: { sidebarCollapsed?: boolean }): JSX.Element {
  const run = useSimulatedRun()
  const [resultsFilter, setResultsFilter] = useState<ResultFilter | null>(null)

  return (
    <div className={styles.view}>
      <div className={`${styles.header} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <span className="text-ivory">대시보드</span>
      </div>

      <div className={styles.body}>
        <div className={styles.content}>
          <div className={styles.controlsRow}>
            <p className={`${styles.statusText} text-ivory-faint`}>
              {run.running
                ? `실행 중 — ${run.activeCase ? run.activeCase.name : '준비 중'}`
                : '테스트 실행 상태를 실시간으로 모니터링합니다.'}
            </p>
            {run.running ? (
              <Button variant="danger" onClick={run.stop}>
                중지
              </Button>
            ) : (
              <Button onClick={run.start}>테스트 실행</Button>
            )}
          </div>

          <RunStatsRow cases={run.cases} running={run.running} onSelect={setResultsFilter} />
          <LiveBrowserPane
            browser={run.browser}
            apiCalls={run.apiCalls}
            activeCase={run.activeCase}
            running={run.running}
          />
          <RunLogPane logs={run.logs} running={run.running} />
        </div>
      </div>

      <CaseResultsPanel
        filter={resultsFilter}
        cases={run.cases}
        logs={run.logs}
        onClose={() => setResultsFilter(null)}
      />
    </div>
  )
}
