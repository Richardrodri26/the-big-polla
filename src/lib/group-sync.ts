import { prisma } from '@/lib/prisma'
import { TEAM_COLORS } from '@/lib/team-colors'

interface FDTeam {
  id: number
  name: string
  tla: string
}

interface FDStandingRow {
  position: number
  team: FDTeam
}

interface FDStandingGroup {
  stage: string
  type: string
  group: string
  table: FDStandingRow[]
}

interface FDStandingsResponse {
  standings: FDStandingGroup[]
}

export async function syncWorldCupGroups(): Promise<{ synced: number; skipped: number }> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    console.warn('[group-sync] FOOTBALL_API_KEY not set — skipping')
    return { synced: 0, skipped: 0 }
  }

  const res = await fetch('https://api.football-data.org/v4/competitions/WC/standings', {
    headers: { 'X-Auth-Token': apiKey },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error(`[group-sync] API error: HTTP ${res.status}`)
    return { synced: 0, skipped: 0 }
  }

  const data: FDStandingsResponse = await res.json()

  const groupStandings = data.standings.filter(
    s => s.stage === 'GROUP_STAGE' && s.type === 'TOTAL',
  )

  let synced = 0
  let skipped = 0

  for (const standing of groupStandings) {
    const groupLetter = standing.group.replace('GROUP_', '')

    for (const row of standing.table) {
      const { tla, name } = row.team
      const colors = TEAM_COLORS[tla]

      if (!colors) {
        console.warn(`[group-sync] No colors for team: ${tla}`)
        skipped++
        continue
      }

      await prisma.worldCupTeam.upsert({
        where: { code: tla },
        update: { name, group: groupLetter, seed: row.position, updatedAt: new Date() },
        create: { code: tla, name, c1: colors.c1, c2: colors.c2, group: groupLetter, seed: row.position },
      })
      synced++
    }
  }

  return { synced, skipped }
}
