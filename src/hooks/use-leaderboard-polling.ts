import { useState, useEffect, useRef, useCallback } from 'react'
import type { Member } from '@/types/domain'

interface LeaderboardState {
  members: Member[]
  updatedAt: string | null
  loading: boolean
  error: string | null
}

export function useLeaderboardPolling(leagueId: string, intervalMs = 30_000): LeaderboardState {
  const [state, setState] = useState<LeaderboardState>({
    members: [],
    updatedAt: null,
    loading: true,
    error: null,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/leaderboard`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setState({ members: data.members, updatedAt: data.updatedAt, loading: false, error: null })
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: String(err) }))
    }
  }, [leagueId])

  useEffect(() => {
    fetchLeaderboard()
    intervalRef.current = setInterval(fetchLeaderboard, intervalMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchLeaderboard, intervalMs])

  return state
}
