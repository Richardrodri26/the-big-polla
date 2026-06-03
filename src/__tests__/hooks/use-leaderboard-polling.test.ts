// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLeaderboardPolling } from '@/hooks/use-leaderboard-polling'

const mockMembers = [
  { id: 'u1', name: 'Alice', handle: 'alice', color: '#fff', rank: 1, prevRank: 1, pts: 100, hits: 10, streak: 2, breakdown: { exact: 2, diff: 4, winner: 4, streakBonus: 5, comboBonus: 0, oraclePartial: 0 } },
]

describe('useLeaderboardPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ members: mockMembers, updatedAt: '2026-06-03T12:00:00Z' }),
    } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('fetches initial members on mount', async () => {
    const { result } = renderHook(() => useLeaderboardPolling('league-1', 30_000))
    await waitFor(() => expect(result.current.members).toHaveLength(1))
    expect(result.current.members[0].name).toBe('Alice')
  })

  it('polls again after interval', async () => {
    renderHook(() => useLeaderboardPolling('league-1', 30_000))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    act(() => { vi.advanceTimersByTime(30_000) })
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  })

  it('returns loading true while initial fetch is pending', async () => {
    let resolveFetch!: () => void
    global.fetch = vi.fn().mockReturnValue(new Promise(resolve => {
      resolveFetch = () => resolve({ ok: true, json: async () => ({ members: [], updatedAt: '' }) } as any)
    }))

    const { result } = renderHook(() => useLeaderboardPolling('league-1', 30_000))
    expect(result.current.loading).toBe(true)
    act(() => resolveFetch())
    await waitFor(() => expect(result.current.loading).toBe(false))
  })
})
