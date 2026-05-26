function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function getDayLabel(kickoffAt: string): string {
  const now = startOfDay(new Date())
  const match = startOfDay(new Date(kickoffAt))
  const diff = Math.round((match.getTime() - now.getTime()) / 86400000)
  if (diff === 0) return 'HOY'
  if (diff === 1) return 'MAÑANA'
  if (diff === -1) return 'AYER'
  return match
    .toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
    .toUpperCase()
}

export function getKickoffTime(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function getDateNum(kickoffAt: string): string {
  return String(new Date(kickoffAt).getDate()).padStart(2, '0')
}

export function getWeekday(kickoffAt: string): string {
  return new Date(kickoffAt)
    .toLocaleDateString('es-AR', { weekday: 'short' })
    .toUpperCase()
}

export function getMonthShort(kickoffAt: string): string {
  return new Date(kickoffAt)
    .toLocaleDateString('es-AR', { month: 'short' })
    .toUpperCase()
}

export function getKickoffIn(kickoffAt: string): string | undefined {
  const diff = new Date(kickoffAt).getTime() - Date.now()
  if (diff <= 0 || diff > 24 * 3600 * 1000) return undefined
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return hours > 0 ? `EN ${hours}H` : `EN ${mins}MIN`
}
