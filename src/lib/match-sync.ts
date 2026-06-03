export interface ExternalMatch {
  id: string
  state: 'PENDING' | 'LIVE' | 'FINAL'
  homeScore: number | null
  awayScore: number | null
  liveMinute: number | null
}

interface FootballDataMatch {
  id: number
  status: 'TIMED' | 'SCHEDULED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED'
  score: {
    fullTime: { home: number | null; away: number | null }
  }
  minute: number | null
}

interface FootballDataResponse {
  matches: FootballDataMatch[]
}

function mapStatus(status: FootballDataMatch['status']): ExternalMatch['state'] {
  if (status === 'FINISHED') return 'FINAL'
  if (status === 'IN_PLAY' || status === 'PAUSED') return 'LIVE'
  return 'PENDING'
}

export async function fetchExternalMatches(): Promise<ExternalMatch[]> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    console.warn('[match-sync] FOOTBALL_API_KEY not set — skipping external fetch')
    return []
  }

  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      console.error(`[match-sync] API error: HTTP ${res.status}`)
      return []
    }

    const data: FootballDataResponse = await res.json()

    return data.matches.map(m => ({
      id: String(m.id),
      state: mapStatus(m.status),
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      liveMinute: m.minute ?? null,
    }))
  } catch (err) {
    console.error('[match-sync] Unexpected error:', err)
    return []
  }
}
