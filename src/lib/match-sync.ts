export interface ExternalMatch {
  id: string
  state: 'PENDING' | 'LIVE' | 'FINAL'
  homeScore: number | null
  awayScore: number | null
  liveMinute: number | null
}

/**
 * Stub: reemplazar con la integración real cuando la API del Mundial 2026
 * esté disponible. Devuelve array vacío hasta entonces.
 *
 * API candidata: https://www.football-data.org/v4/competitions/WC/matches
 * Documentación: https://www.football-data.org/documentation/quickstart
 */
export async function fetchExternalMatches(): Promise<ExternalMatch[]> {
  // TODO: implementar cuando la API esté disponible
  // const res = await fetch('https://api.example.com/wc2026/matches', {
  //   headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! }
  // })
  // return res.json()
  return []
}
