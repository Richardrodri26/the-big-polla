import { prisma } from '@/lib/prisma'
import { TEAM_COLORS } from '@/lib/team-colors'

interface FDTeam {
  id: number
  name: string
  shortName: string | null
  tla: string | null
}

interface FDMatch {
  id: number
  utcDate: string
  status: string
  matchday: number | null
  stage: string
  group: string | null
  homeTeam: FDTeam
  awayTeam: FDTeam
  venue: string | null
}

interface FDMatchesResponse {
  matches: FDMatch[]
}

function mapStage(stage: string, group: string | null): string {
  if (stage === 'GROUP_STAGE' && group) {
    return `Grupo ${group.replace('GROUP_', '')}`
  }
  const labels: Record<string, string> = {
    ROUND_OF_16: 'Octavos',
    QUARTER_FINALS: 'Cuartos',
    SEMI_FINALS: 'Semifinal',
    THIRD_PLACE: '3er Lugar',
    FINAL: 'Final',
  }
  return labels[stage] ?? stage
}

export async function importWorldCupMatches(): Promise<{ imported: number; skipped: number }> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    console.warn('[match-import] FOOTBALL_API_KEY not set — skipping')
    return { imported: 0, skipped: 0 }
  }

  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': apiKey },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error(`[match-import] API error: HTTP ${res.status}`)
    return { imported: 0, skipped: 0 }
  }

  const data: FDMatchesResponse = await res.json()

  let imported = 0
  let skipped = 0

  for (const m of data.matches) {
    const homeTla = m.homeTeam.tla
    const awayTla = m.awayTeam.tla

    if (!homeTla || !awayTla) {
      skipped++
      continue
    }

    const homeColors = TEAM_COLORS[homeTla]
    const awayColors = TEAM_COLORS[awayTla]

    if (!homeColors || !awayColors) {
      console.warn(`[match-import] No colors for ${homeTla} or ${awayTla} — skipping match ${m.id}`)
      skipped++
      continue
    }

    await prisma.match.upsert({
      where: { id: String(m.id) },
      update: {
        kickoffAt: new Date(m.utcDate),
        venue: m.venue ?? 'TBD',
        stage: mapStage(m.stage, m.group),
        homeTeamCode: homeTla,
        homeTeamName: m.homeTeam.shortName ?? m.homeTeam.name,
        homeTeamC1: homeColors.c1,
        homeTeamC2: homeColors.c2,
        awayTeamCode: awayTla,
        awayTeamName: m.awayTeam.shortName ?? m.awayTeam.name,
        awayTeamC1: awayColors.c1,
        awayTeamC2: awayColors.c2,
        matchday: m.matchday,
      },
      create: {
        id: String(m.id),
        state: 'PENDING',
        locked: false,
        kickoffAt: new Date(m.utcDate),
        venue: m.venue ?? 'TBD',
        stage: mapStage(m.stage, m.group),
        homeTeamCode: homeTla,
        homeTeamName: m.homeTeam.shortName ?? m.homeTeam.name,
        homeTeamC1: homeColors.c1,
        homeTeamC2: homeColors.c2,
        awayTeamCode: awayTla,
        awayTeamName: m.awayTeam.shortName ?? m.awayTeam.name,
        awayTeamC1: awayColors.c1,
        awayTeamC2: awayColors.c2,
        matchday: m.matchday,
      },
    })

    imported++
  }

  return { imported, skipped }
}
