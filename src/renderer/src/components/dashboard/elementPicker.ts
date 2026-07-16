// webview 게스트 페이지에 주입하는 요소 선택(picker) 스크립트.
// 게스트 → 호스트 통신은 별도 preload 없이 console.log + PICKER_PREFIX를
// 호스트의 console-message 핸들러에서 가로채는 방식을 쓴다.

export const PICKER_PREFIX = '__TESTIFY_PICKER__'

export type PickedElement = {
  tag: string
  text: string
  type: string
  selector: string
}

export type PickedPayload = {
  kind: 'picked'
  x: number
  y: number
  element: PickedElement
}

export const PICKER_ENABLE_SCRIPT = `
(() => {
  if (window.__testifyPickerCleanup) return;

  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;z-index:2147483647;pointer-events:none;display:none;' +
    'border:2px solid #d97757;background:rgba(217,119,87,0.12);border-radius:2px;';
  document.documentElement.appendChild(overlay);

  function cssEscape(value) {
    return window.CSS && CSS.escape ? CSS.escape(value) : value.replace(/([^a-zA-Z0-9_-])/g, '\\\\$1');
  }

  function buildSelector(el) {
    if (!(el instanceof Element)) return '';
    if (el.id) return '#' + cssEscape(el.id);
    const testid = el.getAttribute('data-testid');
    if (testid) return '[data-testid="' + testid + '"]';
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 5) {
      if (node.id) {
        parts.unshift('#' + cssEscape(node.id));
        break;
      }
      let part = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (sameTag.length > 1) part += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  }

  function describe(el) {
    const rawText = el.innerText || el.value || el.getAttribute('placeholder') || '';
    return {
      tag: el.tagName.toLowerCase(),
      text: rawText.replace(/\\s+/g, ' ').trim().slice(0, 40),
      type: el.getAttribute('type') || '',
      selector: buildSelector(el)
    };
  }

  function onMove(event) {
    const el = event.target;
    if (!(el instanceof Element)) return;
    const rect = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  function onPick(event) {
    // 스텝 실행기가 디스패치한 합성 이벤트는 가로채지 않는다 (실제 동작이 그대로 일어나야 함)
    if (!event.isTrusted) return;
    if (!(event.target instanceof Element)) return;
    event.preventDefault();
    event.stopPropagation();
    console.log(
      '__TESTIFY_PICKER__' +
        JSON.stringify({ kind: 'picked', x: event.clientX, y: event.clientY, element: describe(event.target) })
    );
  }

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('contextmenu', onPick, true);
  document.addEventListener('click', onPick, true);

  window.__testifyPickerCleanup = () => {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('contextmenu', onPick, true);
    document.removeEventListener('click', onPick, true);
    overlay.remove();
    delete window.__testifyPickerCleanup;
  };
})();
`

export const PICKER_DISABLE_SCRIPT = `
(() => {
  if (window.__testifyPickerCleanup) window.__testifyPickerCleanup();
})();
`

export type StepResult = {
  ok: boolean
  error?: string
}

export const NETWORK_PREFIX = '__TESTIFY_NET__'

export type NetworkBridgePayload = {
  method: string
  url: string
  status: number | null
  failed: boolean
}

// 게스트 페이지의 fetch/XHR을 감싸 실제 네트워크 호출을 호스트의 네트워크 탭으로 브리지한다.
// 페이지 이동마다 새 문서에 다시 주입해야 하므로 dom-ready에서 항상 실행한다
export const NETWORK_HOOK_SCRIPT = `
(() => {
  if (window.__testifyNetHooked) return;
  window.__testifyNetHooked = true;

  function report(method, url, status, failed) {
    try {
      const absolute = new URL(String(url), location.href).href;
      console.log('${NETWORK_PREFIX}' + JSON.stringify({ method: method, url: absolute, status: status, failed: failed }));
    } catch (e) {
      /* URL 해석 실패 등은 무시 */
    }
  }

  const origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      return origFetch.apply(this, arguments).then(
        (res) => { report(method, url, res.status, !res.ok); return res; },
        (err) => { report(method, url, null, true); throw err; }
      );
    };
  }

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__testifyReq = { method: String(method).toUpperCase(), url: String(url) };
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    const req = this.__testifyReq;
    if (req) {
      this.addEventListener('loadend', () => {
        report(req.method, req.url, this.status || null, this.status === 0 || this.status >= 400);
      });
    }
    return origSend.apply(this, arguments);
  };
})();
`

// 기록된 스텝을 게스트 페이지에서 실제로 실행하는 스크립트.
// 반환값은 StepResult JSON 문자열. 클릭으로 페이지가 이동해도 스크립트 자체는
// 동기적으로 끝나므로 결과는 이동 전에 반환된다.
export function buildActionScript(actionType: string, selector: string, value?: string): string {
  return `
(() => {
  const SELECTOR = ${JSON.stringify(selector)};
  const ACTION = ${JSON.stringify(actionType)};
  const VALUE = ${JSON.stringify(value ?? '')};

  const el = document.querySelector(SELECTOR);
  if (!el) return JSON.stringify({ ok: false, error: 'not-found' });

  // 실행되는 요소를 잠깐 초록색으로 표시
  const prevOutline = el.style.outline;
  el.style.outline = '2px solid #8fbc8f';
  setTimeout(() => { el.style.outline = prevOutline; }, 400);

  function fireMouse(type, opts) {
    el.dispatchEvent(new MouseEvent(type, Object.assign({ bubbles: true, cancelable: true, view: window }, opts)));
  }

  try {
    switch (ACTION) {
      case 'click':
        el.click();
        break;
      case 'dblclick':
        el.click();
        el.click();
        fireMouse('dblclick');
        break;
      case 'rightclick':
        fireMouse('contextmenu');
        break;
      case 'hover':
        fireMouse('mouseover');
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, view: window }));
        fireMouse('mousemove');
        break;
      case 'scroll':
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'check':
      case 'uncheck': {
        el.checked = ACTION === 'check';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
      case 'fill': {
        if (el.focus) el.focus();
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        // React 등 프레임워크가 감지하도록 네이티브 setter로 값을 넣는다
        if (desc && desc.set && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
          desc.set.call(el, VALUE);
        } else {
          el.value = VALUE;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
      case 'press': {
        if (el.focus) el.focus();
        const opts = { bubbles: true, cancelable: true, key: VALUE };
        el.dispatchEvent(new KeyboardEvent('keydown', opts));
        el.dispatchEvent(new KeyboardEvent('keyup', opts));
        // 합성 Enter는 폼을 자동 제출하지 않으므로 직접 제출한다
        if (VALUE === 'Enter' && el.form) {
          if (el.form.requestSubmit) el.form.requestSubmit();
          else el.form.submit();
        }
        break;
      }
      case 'select': {
        el.value = VALUE;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
      case 'assert-visible': {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        return JSON.stringify({ ok: visible, error: visible ? undefined : 'not-visible' });
      }
      case 'assert-text': {
        const text = (el.innerText || el.value || '').replace(/\\s+/g, ' ').trim();
        const pass = text.includes(VALUE);
        return JSON.stringify({ ok: pass, error: pass ? undefined : 'text-mismatch:' + text.slice(0, 60) });
      }
      case 'wait': {
        const rect = el.getBoundingClientRect();
        const present = rect.width > 0 && rect.height > 0;
        return JSON.stringify({ ok: present, error: present ? undefined : 'not-visible' });
      }
    }
    return JSON.stringify({ ok: true });
  } catch (error) {
    return JSON.stringify({ ok: false, error: String((error && error.message) || error) });
  }
})();
`
}
