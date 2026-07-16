import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  ApiAuth,
  ApiBodyMode,
  ApiKeyValue,
  ApiRequestSpec,
  HttpRequestResult,
  TestCaseStep
} from '../../../../shared/types'
import { Button } from '../ui/Button'
import { Dropdown } from '../ui/Dropdown'
import { Tabs } from '../ui/Tabs'
import { CloseIcon, SendIcon } from '../ui/icons'
import { ApiKeyValueTable } from './ApiKeyValueTable'
import { floatingPanelLeft, LAYOUT_PADDING } from '../layout/layoutMetrics'
import { TEST_CASE_PANEL_WIDTH } from './TestCaseFormPanel'
import styles from './ApiRecorderModal.module.css'

const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((method) => ({
  value: method,
  label: method
}))

const BODY_MODE_OPTIONS: { value: ApiBodyMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
  { value: 'form', label: 'Form' }
]

const AUTH_TYPE_OPTIONS: { value: ApiAuth['type']; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' }
]

function normalizeApiUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

// 응답 바디가 JSON이면 보기 좋게 들여써서 보여준다
function emptyKeyValueRow(): ApiKeyValue {
  return { key: '', value: '', description: '', enabled: true }
}

function formatBody(body: string): string {
  if (!body) return ''
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

// 브라우저를 띄우는 CaseRecorderModal의 자리에서, API 테스트일 때 대신 뜨는
// 포스트맨 스타일 요청 빌더. 요청을 보내(Send) 응답을 직접 확인한 뒤,
// "시나리오에 추가"를 눌러야 스텝으로 등록된다 — E2E 기록과 달리 매 Send가
// 자동으로 스텝이 되지는 않는다(같은 요청을 조정해가며 여러 번 테스트할 수 있어야 하므로)
export function ApiRecorderModal({
  open,
  onClose,
  onAddStep,
  sidebarCollapsed
}: {
  open: boolean
  onClose: () => void
  onAddStep: (step: TestCaseStep) => void
  sidebarCollapsed?: boolean
}): JSX.Element | null {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [params, setParams] = useState<ApiKeyValue[]>([emptyKeyValueRow()])
  const [headers, setHeaders] = useState<ApiKeyValue[]>([emptyKeyValueRow()])
  const [authType, setAuthType] = useState<ApiAuth['type']>('none')
  const [bearerToken, setBearerToken] = useState('')
  const [basicUsername, setBasicUsername] = useState('')
  const [basicPassword, setBasicPassword] = useState('')
  const [bodyMode, setBodyMode] = useState<ApiBodyMode>('none')
  const [bodyContent, setBodyContent] = useState('')
  const [formFields, setFormFields] = useState<ApiKeyValue[]>([emptyKeyValueRow()])
  const [expectedStatusText, setExpectedStatusText] = useState('')
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params')
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body')
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<HttpRequestResult | null>(null)
  const [addedCount, setAddedCount] = useState(0)

  useEffect(() => {
    if (open) setAddedCount(0)
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  function buildAuth(): ApiAuth {
    if (authType === 'bearer') return { type: 'bearer', token: bearerToken }
    if (authType === 'basic') return { type: 'basic', username: basicUsername, password: basicPassword }
    return { type: 'none' }
  }

  // form 모드는 key-value 테이블을 URL-encoded 문자열로 직렬화해 body.content에 담는다
  function buildBodyContent(): string {
    if (bodyMode !== 'form') return bodyContent
    return formFields
      .filter((field) => field.enabled && field.key)
      .map((field) => `${encodeURIComponent(field.key)}=${encodeURIComponent(field.value)}`)
      .join('&')
  }

  function buildSpec(): ApiRequestSpec {
    const expected = expectedStatusText.trim()
    return {
      method,
      url: normalizeApiUrl(url),
      params,
      headers,
      auth: buildAuth(),
      body: { mode: bodyMode, content: buildBodyContent() },
      ...(expected && !Number.isNaN(Number(expected)) ? { expectedStatus: Number(expected) } : {})
    }
  }

  async function handleSend(): Promise<void> {
    const spec = buildSpec()
    if (!spec.url) return
    setSending(true)
    try {
      const result = await window.api.http.request(spec)
      setResponse(result)
      setResponseTab('body')
    } finally {
      setSending(false)
    }
  }

  function handleAddStep(): void {
    const spec = buildSpec()
    if (!spec.url) return
    const outcome = response
      ? `${response.status ?? 'ERR'} ${response.statusText} · ${response.durationMs}ms`
      : ''
    onAddStep({
      action: `${spec.method} ${spec.url}`,
      expected: spec.expectedStatus ? `상태 코드 ${spec.expectedStatus}` : '2xx 응답',
      outcome,
      automation: { actionType: 'api-request', selector: '', request: spec }
    })
    setAddedCount((count) => count + 1)
  }

  const enabledHeaderCount = headers.filter((header) => header.enabled && header.key).length
  const enabledParamCount = params.filter((param) => param.enabled && param.key).length

  // SlidePanel(케이스 폼) 내부에서 렌더링되면 패널의 transform이 fixed 기준점을 바꾸고,
  // 패널 backdrop(z-100)에 가려지므로 body로 포털을 띄운다 (CaseRecorderModal과 동일한 방식)
  return createPortal(
    <div
      className={`${styles.overlay} bg-raised border-line`}
      style={{
        left: floatingPanelLeft(sidebarCollapsed),
        // 케이스 패널이 이제 오른쪽에서 LAYOUT_PADDING만큼 띄워져 있어(SlidePanel), 그 왼쪽 여백까지 더한다
        right: TEST_CASE_PANEL_WIDTH + LAYOUT_PADDING + 12
      }}
    >
      <div className={`${styles.header} border-line`}>
        <span className={`${styles.title} text-ivory`}>
          <span className="text-clay-300">
            <SendIcon size={14} />
          </span>
          API 요청 작성
        </span>
        <span className={`${styles.hint} text-ivory-faint`}>
          메서드와 엔드포인트를 입력해 요청을 보내고 응답을 확인한 뒤, 시나리오에 스텝으로 추가하세요.
        </span>
        <Button variant="ghost" onClick={onClose}>
          완료{addedCount > 0 ? ` (${addedCount})` : ''}
        </Button>
        <button type="button" className="icon-btn text-ivory-faint" aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.requestRow}>
          <div className={styles.methodDropdown}>
            <Dropdown options={METHOD_OPTIONS} value={method} onChange={setMethod} />
          </div>
          <input
            type="text"
            className={`${styles.urlInput} bg-canvas text-ivory border-line`}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://api.example.com/users"
            spellCheck={false}
          />
          <Button onClick={handleSend} disabled={!url.trim() || sending}>
            <SendIcon size={13} /> {sending ? '전송 중...' : 'Send'}
          </Button>
        </div>

        <Tabs
          items={[
            { value: 'params', label: `Params${enabledParamCount ? ` (${enabledParamCount})` : ''}` },
            { value: 'headers', label: `Headers${enabledHeaderCount ? ` (${enabledHeaderCount})` : ''}` },
            { value: 'body', label: 'Body' },
            { value: 'auth', label: 'Authorization' }
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value as typeof activeTab)}
        />

        <div className={styles.tabContent}>
          {activeTab === 'params' && <ApiKeyValueTable rows={params} onChange={setParams} />}
          {activeTab === 'headers' && <ApiKeyValueTable rows={headers} onChange={setHeaders} />}
          {activeTab === 'body' && (
            <div className={styles.bodySection}>
              <div className={styles.modeGroup}>
                {BODY_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.modeBtn} ${bodyMode === option.value ? styles.modeActive : ''}`}
                    onClick={() => setBodyMode(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {bodyMode === 'form' ? (
                <ApiKeyValueTable rows={formFields} onChange={setFormFields} />
              ) : bodyMode !== 'none' ? (
                <textarea
                  className={`${styles.bodyTextarea} bg-raised border-line text-ivory`}
                  value={bodyContent}
                  onChange={(event) => setBodyContent(event.target.value)}
                  placeholder={bodyMode === 'json' ? '{\n  "key": "value"\n}' : '요청 본문을 입력하세요'}
                  spellCheck={false}
                />
              ) : (
                <p className={`${styles.emptyHint} text-ivory-faint`}>이 요청은 본문이 없습니다.</p>
              )}
            </div>
          )}
          {activeTab === 'auth' && (
            <div className={styles.authSection}>
              <div className={styles.modeGroup}>
                {AUTH_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.modeBtn} ${authType === option.value ? styles.modeActive : ''}`}
                    onClick={() => setAuthType(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {authType === 'bearer' && (
                <label className={styles.field}>
                  <span className={`${styles.fieldLabel} text-ivory-dim`}>Token</span>
                  <input
                    type="text"
                    className={`${styles.fieldInput} bg-raised border-line text-ivory`}
                    value={bearerToken}
                    onChange={(event) => setBearerToken(event.target.value)}
                    placeholder="토큰 값"
                  />
                </label>
              )}
              {authType === 'basic' && (
                <>
                  <label className={styles.field}>
                    <span className={`${styles.fieldLabel} text-ivory-dim`}>Username</span>
                    <input
                      type="text"
                      className={`${styles.fieldInput} bg-raised border-line text-ivory`}
                      value={basicUsername}
                      onChange={(event) => setBasicUsername(event.target.value)}
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={`${styles.fieldLabel} text-ivory-dim`}>Password</span>
                    <input
                      type="password"
                      className={`${styles.fieldInput} bg-raised border-line text-ivory`}
                      value={basicPassword}
                      onChange={(event) => setBasicPassword(event.target.value)}
                    />
                  </label>
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.expectedRow}>
          <label className={styles.expectedField}>
            <span className="text-ivory-faint">기대 상태 코드</span>
            <input
              type="text"
              inputMode="numeric"
              className={`${styles.expectedInput} bg-raised border-line text-ivory`}
              value={expectedStatusText}
              onChange={(event) => setExpectedStatusText(event.target.value)}
              placeholder="비워두면 2xx 통과"
            />
          </label>
          <Button onClick={handleAddStep} disabled={!url.trim()}>
            시나리오에 추가
          </Button>
        </div>

        <div className={`${styles.responseSection} border-line`}>
          {response ? (
            <>
              <div className={styles.responseHeader}>
                <span className={response.status !== null && response.status < 400 ? 'text-ok' : 'text-danger'}>
                  {response.status ?? 'ERR'} {response.statusText}
                </span>
                <span className="text-ivory-faint">{response.durationMs}ms</span>
                <span className="text-ivory-faint">{new Blob([response.body]).size}B</span>
                {response.error && <span className="text-danger">{response.error}</span>}
                <div className={styles.responseTabs}>
                  <button
                    type="button"
                    className={`${styles.responseTabBtn} ${responseTab === 'body' ? styles.responseTabActive : ''}`}
                    onClick={() => setResponseTab('body')}
                  >
                    Body
                  </button>
                  <button
                    type="button"
                    className={`${styles.responseTabBtn} ${responseTab === 'headers' ? styles.responseTabActive : ''}`}
                    onClick={() => setResponseTab('headers')}
                  >
                    Headers
                  </button>
                </div>
              </div>
              <pre className={`${styles.responseBody} bg-canvas text-ivory-dim`}>
                {responseTab === 'body'
                  ? formatBody(response.body) || '(빈 응답)'
                  : Object.entries(response.headers)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n') || '(헤더 없음)'}
              </pre>
            </>
          ) : (
            <p className={`${styles.emptyHint} text-ivory-faint`}>
              Send를 눌러 요청을 보내면 응답이 여기에 표시됩니다.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
