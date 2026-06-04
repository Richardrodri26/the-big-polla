'use client'

import { useTransition, useState } from 'react'
import { Flag } from '@/components/ui/flag'
import { setMatchResult } from './actions'

interface Match {
  id: string
  homeTeamCode: string
  homeTeamName: string
  awayTeamCode: string
  awayTeamName: string
  kickoffAt: Date
  state: string
  homeScore: number | null
  awayScore: number | null
}

export function MatchRow({ match }: { match: Match }) {
  const [isPending, startTransition] = useTransition()
  const [home, setHome] = useState(match.homeScore ?? 0)
  const [away, setAway] = useState(match.awayScore ?? 0)
  const [error, setError] = useState<string | null>(null)

  const isFinal = match.state === 'FINAL'

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await setMatchResult(match.id, home, away)
      if ('error' in result) setError(result.error)
    })
  }

  return (
    <tr className="border-b border-white/10">
      <td className="px-4 py-3">
        <span className="flex items-center gap-2">
          <Flag code={match.homeTeamCode} size="sm" />
          {match.homeTeamName}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-2">
          <Flag code={match.awayTeamCode} size="sm" />
          {match.awayTeamName}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-white/60">
        {new Date(match.kickoffAt).toLocaleString('es-AR', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-bold px-2 py-1 rounded ${isFinal ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {match.state}
        </span>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          value={home}
          readOnly={isFinal}
          onChange={e => setHome(Number(e.target.value))}
          className="w-16 rounded bg-white/10 px-2 py-1 text-center text-sm disabled:opacity-50 read-only:opacity-60"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          value={away}
          readOnly={isFinal}
          onChange={e => setAway(Number(e.target.value))}
          className="w-16 rounded bg-white/10 px-2 py-1 text-center text-sm disabled:opacity-50 read-only:opacity-60"
        />
      </td>
      <td className="px-4 py-3">
        {!isFinal && (
          <div className="flex flex-col gap-1">
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="rounded bg-green-600 px-3 py-1 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Marcar FINAL'}
            </button>
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
        )}
      </td>
    </tr>
  )
}
