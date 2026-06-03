import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

import { fetchExternalMatches } from '@/lib/match-sync'

const mockApiResponse = {
  matches: [
    {
      id: 417862,
      matchday: 3,
      status: 'FINISHED',
      score: {
        fullTime: { home: 3, away: 0 },
      },
      minute: null,
    },
    {
      id: 417863,
      matchday: 3,
      status: 'IN_PLAY',
      score: {
        fullTime: { home: null, away: null },
      },
      minute: 45,
    },
    {
      id: 417864,
      matchday: 4,
      status: 'TIMED',
      score: {
        fullTime: { home: null, away: null },
      },
      minute: null,
    },
  ],
}

describe('fetchExternalMatches', () => {
  beforeEach(() => {
    process.env.FOOTBALL_API_KEY = 'test-token'
  })
  afterEach(() => {
    delete process.env.FOOTBALL_API_KEY
    vi.clearAllMocks()
  })

  it('maps FINISHED match correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any)

    const matches = await fetchExternalMatches()
    const finished = matches.find(m => m.id === '417862')

    expect(finished).toBeDefined()
    expect(finished?.state).toBe('FINAL')
    expect(finished?.homeScore).toBe(3)
    expect(finished?.awayScore).toBe(0)
    expect(finished?.liveMinute).toBeNull()
  })

  it('maps IN_PLAY match correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any)

    const matches = await fetchExternalMatches()
    const live = matches.find(m => m.id === '417863')

    expect(live?.state).toBe('LIVE')
    expect(live?.liveMinute).toBe(45)
    expect(live?.homeScore).toBeNull()
    expect(live?.awayScore).toBeNull()
  })

  it('maps TIMED/SCHEDULED match as PENDING', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any)

    const matches = await fetchExternalMatches()
    const pending = matches.find(m => m.id === '417864')

    expect(pending?.state).toBe('PENDING')
  })

  it('returns empty array when FOOTBALL_API_KEY is not set', async () => {
    const original = process.env.FOOTBALL_API_KEY
    delete process.env.FOOTBALL_API_KEY

    const matches = await fetchExternalMatches()
    expect(matches).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()

    process.env.FOOTBALL_API_KEY = original
  })

  it('returns empty array and logs error when API responds with non-ok', async () => {
    process.env.FOOTBALL_API_KEY = 'test-token'
    mockFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) } as any)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const matches = await fetchExternalMatches()

    expect(matches).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('includes matchday in mapped result', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockApiResponse } as any)
    const matches = await fetchExternalMatches()
    expect(matches.find(m => m.id === '417862')?.matchday).toBe(3)
    expect(matches.find(m => m.id === '417864')?.matchday).toBe(4)
  })
})
