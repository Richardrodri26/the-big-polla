import { importWorldCupMatches } from '../src/lib/match-import'

async function main() {
  console.log('[seed] Importing WorldCup matches from football-data.org...')
  const { imported, skipped } = await importWorldCupMatches()
  console.log(`[seed] Done: ${imported} imported, ${skipped} skipped`)
}

main().catch(console.error).finally(() => process.exit(0))
