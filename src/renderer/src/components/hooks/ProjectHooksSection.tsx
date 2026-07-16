import { useEffect, useState } from 'react'
import type { Hook, HookTiming, TestType } from '../../../../shared/types'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { Button } from '../ui/Button'
import { SearchInput } from '../ui/SearchInput'
import { Table, type TableColumn } from '../ui/Table'
import { Switch } from '../ui/Switch'
import { IconMenuButton } from '../ui/IconMenuButton'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { HookFormPanel, HOOK_TIMING_LABELS, type HookFormValues } from './HookFormPanel'
import styles from './ProjectHooksSection.module.css'

const TYPE_OPTIONS: DropdownOption[] = [
  { value: 'all', label: '전체' },
  { value: 'api', label: 'API' },
  { value: 'e2e', label: 'E2E' }
]

const TIMING_OPTIONS: DropdownOption[] = [
  { value: 'all', label: '전체' },
  { value: 'beforeAll', label: 'Before All' },
  { value: 'beforeEach', label: 'Before Each' },
  { value: 'afterEach', label: 'After Each' },
  { value: 'afterAll', label: 'After All' },
  { value: 'onFailure', label: 'On Failure' }
]

function formatDateTime(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16)
}

// 훅(사전/사후 공통 시나리오) 목록 및 CRUD.
// projectId를 주면 해당 프로젝트 전용 훅을, 생략하면 전역 훅(사이드바 훅 탭)을 관리한다
export function ProjectHooksSection({
  projectId,
  sidebarCollapsed
}: {
  projectId?: string
  sidebarCollapsed?: boolean
}): JSX.Element {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [timing, setTiming] = useState('all')
  const [hooks, setHooks] = useState<Hook[]>([])

  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'create' | 'edit'>('create')
  const [editingHook, setEditingHook] = useState<Hook | null>(null)
  const [deletingHook, setDeletingHook] = useState<Hook | null>(null)

  async function refreshHooks(): Promise<void> {
    const result = await window.api.hooks.list({
      projectId,
      type: type as TestType | 'all',
      timing: timing as HookTiming | 'all',
      search
    })
    setHooks(result)
  }

  useEffect(() => {
    let cancelled = false

    const timer = setTimeout(() => {
      window.api.hooks
        .list({ projectId, type: type as TestType | 'all', timing: timing as HookTiming | 'all', search })
        .then((result) => {
          if (!cancelled) setHooks(result)
        })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [projectId, search, type, timing])

  function openCreatePanel(): void {
    setPanelMode('create')
    setEditingHook(null)
    setPanelOpen(true)
  }

  function openEditPanel(hook: Hook): void {
    setPanelMode('edit')
    setEditingHook(hook)
    setPanelOpen(true)
  }

  async function handlePanelSubmit(values: HookFormValues): Promise<void> {
    if (panelMode === 'edit' && editingHook) {
      await window.api.hooks.update({ id: editingHook.id, project_id: projectId ?? null, ...values })
    } else {
      await window.api.hooks.create({ project_id: projectId ?? null, ...values })
    }
    await refreshHooks()
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deletingHook) return
    await window.api.hooks.remove(deletingHook.id)
    setDeletingHook(null)
    await refreshHooks()
  }

  // 목록에서 스위치로 바로 활성/비활성 전환 (수정 패널을 열 필요 없이)
  async function toggleEnabled(hook: Hook, enabled: boolean): Promise<void> {
    await window.api.hooks.update({
      id: hook.id,
      project_id: hook.project_id,
      name: hook.name,
      description: hook.description ?? '',
      type: hook.type,
      timing: hook.timing,
      enabled,
      steps: hook.steps,
      start_url: hook.start_url
    })
    await refreshHooks()
  }

  const columns: TableColumn<Hook>[] = [
    { key: 'name', header: '이름', render: (row) => row.name },
    { key: 'type', header: '타입', width: '64px', render: (row) => row.type.toUpperCase() },
    {
      key: 'timing',
      header: '실행 시점',
      width: '110px',
      render: (row) => <span className={styles.timingBadge}>{HOOK_TIMING_LABELS[row.timing]}</span>
    },
    {
      key: 'steps',
      header: '스텝',
      width: '56px',
      render: (row) => <span className="text-ivory-dim">{row.steps.length}</span>
    },
    {
      key: 'enabled',
      header: '활성',
      width: '64px',
      truncate: false,
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <Switch
            checked={row.enabled}
            onChange={(value) => void toggleEnabled(row, value)}
            ariaLabel={`${row.name} 활성화`}
          />
        </span>
      )
    },
    { key: 'updated_dt', header: '업데이트됨', width: '140px', render: (row) => formatDateTime(row.updated_dt) },
    {
      key: 'actions',
      header: '',
      width: '40px',
      align: 'right',
      truncate: false,
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <IconMenuButton
            ariaLabel="훅 설정"
            items={[
              { label: '수정', onClick: () => openEditPanel(row) },
              { label: '삭제', onClick: () => setDeletingHook(row), danger: true }
            ]}
          />
        </span>
      )
    }
  ]

  return (
    <div className={styles.section}>
      <div className={styles.controlsRow}>
        <div className={styles.left}>
          <Dropdown label="타입" options={TYPE_OPTIONS} value={type} onChange={setType} />
          <Dropdown label="시점" options={TIMING_OPTIONS} value={timing} onChange={setTiming} minWidth={168} />
        </div>
        <div className={styles.right}>
          <Button onClick={openCreatePanel}>새 훅</Button>
        </div>
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="훅 검색..." />
      <Table
        columns={columns}
        data={hooks}
        rowKey={(row) => row.id}
        onRowClick={openEditPanel}
        emptyMessage={
          projectId
            ? '이 프로젝트 전용 훅이 없습니다. 반복되는 공통 시나리오를 훅으로 만들어 재사용하세요.'
            : '전역 훅이 없습니다. 여러 프로젝트에서 재사용할 공통 시나리오를 훅으로 만들어보세요.'
        }
      />
      <HookFormPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSubmit={handlePanelSubmit}
        mode={panelMode}
        sidebarCollapsed={sidebarCollapsed}
        initialValues={panelMode === 'edit' ? editingHook : null}
      />
      <ConfirmDialog
        open={!!deletingHook}
        onClose={() => setDeletingHook(null)}
        onConfirm={handleConfirmDelete}
        title="훅 삭제"
        description={`"${deletingHook?.name}" 훅을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="영구 삭제"
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  )
}
