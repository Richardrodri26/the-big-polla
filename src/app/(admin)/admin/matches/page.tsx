import { prisma } from '@/lib/prisma'
import { MatchRow } from './match-row'

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: 'asc' },
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">Admin — Resultados de partidos</h1>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-sm text-white/60">
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Visitante</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Goles L</th>
              <th className="px-4 py-3">Goles V</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => (
              <MatchRow key={match.id} match={match} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
