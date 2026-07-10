type IconProps = {
  size?: number
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export function PanelIcon({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <line x1="8" y1="3.5" x2="8" y2="16.5" />
    </svg>
  )
}

export function SearchIcon({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <line x1="16" y1="16" x2="12.5" y2="12.5" />
    </svg>
  )
}

export function FolderIcon({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <path d="M2.5 5.5a1 1 0 0 1 1-1H8l1.5 2h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-9Z" />
    </svg>
  )
}

export function DashboardIcon({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <line x1="4" y1="5" x2="16" y2="5" />
      <line x1="4" y1="10" x2="16" y2="10" />
      <line x1="4" y1="15" x2="12" y2="15" />
    </svg>
  )
}

export function CodeIcon({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <polyline points="7,5 2.5,10 7,15" />
      <polyline points="13,5 17.5,10 13,15" />
    </svg>
  )
}

export function PlusIcon({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <line x1="10" y1="4" x2="10" y2="16" />
      <line x1="4" y1="10" x2="16" y2="10" />
    </svg>
  )
}

export function ArtifactIcon({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <circle cx="5" cy="5" r="2" />
      <circle cx="5" cy="15" r="2" />
      <circle cx="15" cy="10" r="2" />
      <path d="M6.6 6.2 13.4 8.8" />
      <path d="M6.6 13.8 13.4 11.2" />
    </svg>
  )
}

export function CustomIcon({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <path d="M3 8 10 3l7 5-7 5-7-5Z" />
      <path d="M3 8v5l7 5 7-5V8" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 14 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <polyline points="5,8 10,13 15,8" />
    </svg>
  )
}

export function SlidersIcon({ size = 14 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <line x1="5" y1="3" x2="5" y2="17" />
      <line x1="10" y1="3" x2="10" y2="17" />
      <line x1="15" y1="3" x2="15" y2="17" />
      <circle cx="5" cy="8" r="1.6" fill="currentColor" />
      <circle cx="10" cy="13" r="1.6" fill="currentColor" />
      <circle cx="15" cy="6" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function LeafIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <path d="M4 16C4 9 9 4 16 4c0 7-5 12-12 12Z" />
      <line x1="4" y1="16" x2="10" y2="10" />
    </svg>
  )
}

export function MoreIcon({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="4.5" r="1.4" />
      <circle cx="10" cy="10" r="1.4" />
      <circle cx="10" cy="15.5" r="1.4" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 14 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" {...base}>
      <line x1="4" y1="10" x2="16" y2="10" />
      <polyline points="11,5 16,10 11,15" />
    </svg>
  )
}
