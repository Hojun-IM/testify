export function App() {
  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      {/* macOS hiddenInset 타이틀바 자리(32px). 이 영역을 잡아 창을 옮긴다. */}
      <div className="h-8 shrink-0 drag-region" />
      <main className="flex-1" />
    </div>
  )
}
