export function formatDate(value?: string | null): string {
  if (!value) return 'Не указана'
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function formatShortDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date)
}

export function todayISO(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}
