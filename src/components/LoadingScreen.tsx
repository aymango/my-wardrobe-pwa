export function LoadingScreen({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="center-screen">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  )
}
