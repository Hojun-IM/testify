import { ipcMain } from 'electron'
import type { ApiRequestSpec, HttpRequestResult } from '../../shared/types'

function buildUrl(spec: ApiRequestSpec): string {
  const url = new URL(spec.url)
  for (const param of spec.params) {
    if (param.enabled && param.key) url.searchParams.append(param.key, param.value)
  }
  return url.toString()
}

function buildHeaders(spec: ApiRequestSpec): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const header of spec.headers) {
    if (header.enabled && header.key) headers[header.key] = header.value
  }
  if (spec.auth.type === 'bearer' && spec.auth.token) {
    headers['Authorization'] = `Bearer ${spec.auth.token}`
  } else if (spec.auth.type === 'basic' && spec.auth.username) {
    const token = Buffer.from(`${spec.auth.username}:${spec.auth.password}`).toString('base64')
    headers['Authorization'] = `Basic ${token}`
  }
  if (spec.body.mode === 'json' && !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

// 렌더러(webview)가 아니라 메인 프로세스에서 직접 요청을 보낸다 — CORS 제약이 없고
// 응답을 항상 텍스트로 받아 렌더러에서 상태/헤더/바디를 그대로 보여줄 수 있다
async function executeRequest(spec: ApiRequestSpec): Promise<HttpRequestResult> {
  const startedAt = Date.now()
  try {
    const url = buildUrl(spec)
    const headers = buildHeaders(spec)
    const method = spec.method.toUpperCase()
    const hasBody = spec.body.mode !== 'none' && method !== 'GET' && method !== 'HEAD'

    const response = await fetch(url, {
      method,
      headers,
      body: hasBody ? spec.body.content : undefined
    })
    const text = await response.text()
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: text,
      durationMs: Date.now() - startedAt
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      statusText: '',
      headers: {},
      body: '',
      durationMs: Date.now() - startedAt,
      error: String((error as Error)?.message ?? error)
    }
  }
}

export function registerHttpHandlers(): void {
  ipcMain.handle('http:request', (_event, spec: ApiRequestSpec) => executeRequest(spec))
}
