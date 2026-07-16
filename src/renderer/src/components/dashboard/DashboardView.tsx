import { useEffect, useRef, useState } from 'react'
import type { TestCase } from '../../../../shared/types'
import { Button } from '../ui/Button'
import { PlayIcon } from '../ui/icons'
import { RunStatsRow } from './RunStatsRow'
import {
  LiveBrowserPane,
  type ConsoleMessagePayload,
  type NetworkEventPayload,
  type PlaybackCase,
  type PlaybackEvent,
  type PlaybackRequest
} from './LiveBrowserPane'
import { CaseResultsPanel, type ResultFilter } from './CaseResultsPanel'
import { RunLogPane, type ConsoleEntry, type NetworkEntry } from './RunLogPane'
import { ScenarioPanel, type ScenarioStep } from './ScenarioPanel'
import { formatLogTime, type LogLevel, type RunCase, type RunLogEntry } from './runTypes'
import styles from './DashboardView.module.css'

const MAX_DEVTOOL_ENTRIES = 400

// 대시보드는 테스트 케이스 실행(재생)을 지켜보고 결과를 확인하는 화면이다.
// 케이스 기록/등록은 테스트 케이스 목록의 생성 패널(브라우저 기록)에서 한다
export function DashboardView({
  sidebarCollapsed,
  autoPlayCases,
  onAutoPlayConsumed
}: {
  sidebarCollapsed?: boolean
  // 테스트 케이스 목록의 "실행"(단건/일괄)에서 넘어온, 재생할 케이스들
  autoPlayCases?: TestCase[] | null
  onAutoPlayConsumed?: () => void
}): JSX.Element {
  const [resultsFilter, setResultsFilter] = useState<ResultFilter | null>(null)

  // 브라우저(webview)에서 수집한 콘솔/네트워크 데브툴 항목
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [networkEntries, setNetworkEntries] = useState<NetworkEntry[]>([])
  const devIdRef = useRef(0)

  // 재생 중인 케이스들의 시나리오 스텝 (케이스별 그룹으로 표시)
  const [scenarioSteps, setScenarioSteps] = useState<ScenarioStep[]>([])
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const stepIdRef = useRef(0)

  // 재생 세션: 통계/실행 로그/결과 패널이 이 데이터를 기준으로 표시된다
  const [playbackRequest, setPlaybackRequest] = useState<PlaybackRequest | null>(null)
  const [playCases, setPlayCases] = useState<RunCase[]>([])
  const [playLogs, setPlayLogs] = useState<RunLogEntry[]>([])
  const playTokenRef = useRef(0)
  const playLogIdRef = useRef(0)
  // 완료 시점 요약용 — setState 반영(리렌더)을 기다리지 않고 결과를 바로 집계하기 위한 ref
  const playResultsRef = useRef(new Map<string, boolean>())
  // 이벤트 핸들러에서 최신 케이스 이름을 조회하기 위한 ref
  const playCasesRef = useRef<RunCase[]>([])
  playCasesRef.current = playCases

  const playing = !!playbackRequest

  function handleStepResult(stepId: number, result: ScenarioStep['result']): void {
    setScenarioSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, result } : step)))
  }

  function addConsoleEntry(payload: ConsoleMessagePayload): void {
    devIdRef.current += 1
    const entry: ConsoleEntry = { id: devIdRef.current, time: formatLogTime(), ...payload }
    setConsoleEntries((prev) => [...prev.slice(-(MAX_DEVTOOL_ENTRIES - 1)), entry])
  }

  function addNetworkEntry(payload: NetworkEventPayload): void {
    devIdRef.current += 1
    const entry: NetworkEntry = { id: devIdRef.current, time: formatLogTime(), ...payload }
    setNetworkEntries((prev) => [...prev.slice(-(MAX_DEVTOOL_ENTRIES - 1)), entry])
  }

  function appendPlayLog(level: LogLevel, message: string, caseId: string | null = null): void {
    playLogIdRef.current += 1
    const id = playLogIdRef.current
    const time = formatLogTime()
    setPlayLogs((prev) => [...prev, { id, time, level, message, caseId }])
  }

  function patchPlayCase(caseId: string, patch: Partial<RunCase>): void {
    setPlayCases((prev) => prev.map((item) => (item.id === caseId ? { ...item, ...patch } : item)))
  }

  // 마지막으로 실행한 케이스들 — "재실행" 버튼이 이 목록을 다시 돌린다
  const lastPlayedCasesRef = useRef<TestCase[]>([])

  // 자동화 스텝을 케이스별로 시나리오 패널에 불러오고 실제 브라우저에서 재생을 시작한다
  function startPlayback(testCases: TestCase[]): boolean {
    const runnable = testCases.filter((testCase) => testCase.steps.some((step) => step.automation))
    if (runnable.length === 0) return false
    lastPlayedCasesRef.current = runnable

    const allSteps: ScenarioStep[] = []
    const playbackCases: PlaybackCase[] = runnable.map((testCase) => {
      const steps = testCase.steps
        .filter((step) => step.automation)
        .map((step) => {
          stepIdRef.current += 1
          const scenarioStep: ScenarioStep = {
            id: stepIdRef.current,
            actionType: step.automation!.actionType,
            actionLabel: step.action,
            selector: step.automation!.selector,
            value: step.automation!.value,
            targetLabel: step.expected,
            caseId: testCase.id,
            caseName: testCase.name
          }
          allSteps.push(scenarioStep)
          return {
            stepId: scenarioStep.id,
            actionType: scenarioStep.actionType,
            selector: scenarioStep.selector,
            value: scenarioStep.value,
            label: `${step.action}${step.expected ? ` — ${step.expected}` : ''}`,
            request: step.automation!.request
          }
        })
      return {
        caseId: testCase.id,
        name: testCase.name,
        startUrl: testCase.policy.automationStartUrl,
        steps
      }
    })

    playTokenRef.current += 1
    playLogIdRef.current = 0
    playResultsRef.current = new Map()
    setScenarioSteps(allSteps)
    setScenarioOpen(true)
    setPlayCases(
      runnable.map((testCase) => ({
        id: testCase.id,
        name: testCase.name,
        kind: testCase.steps.some((step) => step.automation?.actionType === 'api-request') ? 'api' : 'e2e',
        status: 'pending',
        durationMs: null,
        failMessage: null
      }))
    )
    setPlayLogs([])
    setPlaybackRequest({ token: playTokenRef.current, cases: playbackCases })
    return true
  }

  // TestCaseTable/테스트 목록의 "실행"(단건/일괄)에서 App이 이 값을 채워 넘겨준다
  useEffect(() => {
    if (!autoPlayCases || autoPlayCases.length === 0) return
    startPlayback(autoPlayCases)
    onAutoPlayConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayCases])

  function handleRerun(): void {
    if (playing || lastPlayedCasesRef.current.length === 0) return
    startPlayback(lastPlayedCasesRef.current)
  }

  // 재생 세션 시작 로그는 playCases 초기화와 같은 렌더 사이클을 피해서 남긴다
  useEffect(() => {
    if (!playbackRequest) return
    appendPlayLog('info', `테스트 실행 시작 — 대상 케이스 ${playbackRequest.cases.length}건`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackRequest])

  function handlePlaybackEvent(event: PlaybackEvent): void {
    if (event.kind === 'case-start') {
      patchPlayCase(event.caseId, { status: 'running' })
      const runCase = playCasesRef.current.find((item) => item.id === event.caseId)
      appendPlayLog('info', `▶ [${runCase?.kind === 'api' ? 'API' : 'E2E'}] ${runCase?.name ?? event.caseId} 실행 시작`, event.caseId)
      return
    }
    if (event.kind === 'step-result') {
      handleStepResult(event.stepId, event.result)
      appendPlayLog(
        event.result.ok ? 'step' : 'error',
        event.result.ok ? event.label : `${event.label} — 실패 (${event.result.error ?? '알 수 없는 오류'})`,
        event.caseId
      )
      return
    }
    // case-end
    playResultsRef.current.set(event.caseId, event.passed)
    const name = playCasesRef.current.find((item) => item.id === event.caseId)?.name ?? event.caseId
    patchPlayCase(event.caseId, {
      status: event.passed ? 'passed' : 'failed',
      durationMs: event.durationMs,
      failMessage: event.failMessage
    })
    if (event.passed) appendPlayLog('success', `✓ ${name} 통과`, event.caseId)
    else appendPlayLog('error', `✕ ${name} 실패 — ${event.failMessage ?? ''}`, event.caseId)
  }

  function handlePlaybackComplete(token: number): void {
    if (playTokenRef.current !== token) return
    setPlaybackRequest(null)
    const results = [...playResultsRef.current.values()]
    const passed = results.filter(Boolean).length
    appendPlayLog(
      'info',
      `실행 완료 — 전체 ${playCasesRef.current.length}건 · 성공 ${passed}건 · 실패 ${results.length - passed}건`
    )
  }

  function stopPlayback(): void {
    playTokenRef.current += 1
    setPlaybackRequest(null)
    setPlayCases((prev) =>
      prev.map((item) => (item.status === 'running' ? { ...item, status: 'pending' } : item))
    )
    appendPlayLog('info', '사용자에 의해 실행이 중지되었습니다')
  }

  const runningCaseName = playing
    ? (playCases.find((item) => item.status === 'running')?.name ??
      (playCases.length > 1 ? `${playCases.length}개 케이스` : playCases[0]?.name))
    : null

  return (
    <div className={styles.view}>
      <div className={`${styles.header} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <span className="text-ivory">대시보드</span>
      </div>

      <div className={styles.body}>
        <div className={styles.content}>
          <div className={styles.controlsRow}>
            <p className={`${styles.statusText} text-ivory-faint`}>
              {runningCaseName
                ? `자동화 재생 중 — ${runningCaseName}`
                : playCases.length > 0
                  ? '실행이 끝났습니다. 케이스 카드를 눌러 결과를 확인하세요.'
                  : '테스트 케이스 목록에서 "실행"을 누르면 이 화면에서 실행 과정을 볼 수 있습니다.'}
            </p>
            <div className={styles.controlButtons}>
              {playing ? (
                <Button variant="danger" onClick={stopPlayback}>
                  중지
                </Button>
              ) : (
                <Button onClick={handleRerun} disabled={playCases.length === 0}>
                  <PlayIcon size={13} /> 재실행
                </Button>
              )}
            </div>
          </div>

          <RunStatsRow cases={playCases} running={playing} onSelect={setResultsFilter} />
          <LiveBrowserPane
            onConsoleMessage={addConsoleEntry}
            onNetworkEvent={addNetworkEntry}
            playbackRequest={playbackRequest}
            onPlaybackEvent={handlePlaybackEvent}
            onPlaybackComplete={handlePlaybackComplete}
          />
          <RunLogPane
            logs={playLogs}
            consoleEntries={consoleEntries}
            networkEntries={networkEntries}
            running={playing}
          />
        </div>
      </div>

      <CaseResultsPanel
        filter={resultsFilter}
        cases={playCases}
        logs={playLogs}
        onClose={() => setResultsFilter(null)}
      />
      <ScenarioPanel
        open={scenarioOpen}
        steps={scenarioSteps}
        playing={playing}
        onClose={() => setScenarioOpen(false)}
        onDeleteStep={(id) => setScenarioSteps((prev) => prev.filter((step) => step.id !== id))}
        onClearAll={() => setScenarioSteps([])}
      />
    </div>
  )
}
