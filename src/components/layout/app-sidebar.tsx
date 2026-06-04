'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'

const NAV_ITEMS: { href: string; icon: string; label: string; kbd: string; badge?: string }[] = [
  { href: '/dashboard', icon: 'feed', label: 'Dashboard', kbd: 'G D' },
  { href: '/feed', icon: 'feed', label: 'Match feed', kbd: 'G F' },
  { href: '/oracle', icon: 'bracket', label: 'Oracle bracket', kbd: 'G B' },
  { href: '/leaderboard', icon: 'trophy', label: 'Leaderboard', kbd: 'G L' },
]

const SECONDARY_ITEMS = [
  { href: '/profile', icon: 'user', label: 'Mi perfil' },
  { href: '/settings', icon: 'settings', label: 'Liga · ajustes' },
]

interface SidebarData {
  user: { name: string; color: string; rank: number | null; pts: number }
  league: { id: string; name: string; memberCount: number } | null
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [data, setData] = useState<SidebarData | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname.startsWith('/feed/')
    return pathname === href
  }

  const user = data?.user
  const league = data?.league

  return (
    <Sidebar collapsible="none" className="hidden md:flex">
      {/* Wordmark */}
      <SidebarHeader className="px-5 pt-6 pb-4 border-b border-[var(--line)]">
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-jetbrains, monospace)',
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--fg-faint)',
          }}
        >
          WORLD CUP 2026 · DESKTOP
        </span>
        <div
          style={{
            marginTop: 8,
            fontFamily: 'var(--font-inter, sans-serif)',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 0.86,
            fontVariationSettings: '"wdth" 75',
            letterSpacing: '-0.035em',
          }}
        >
          <div style={{ fontSize: 28, color: 'var(--fg)' }}>THE</div>
          <div style={{ fontSize: 28, color: 'var(--signal)' }}>BIG</div>
          <div style={{ fontSize: 28, WebkitTextStroke: '1.2px var(--fg)', color: 'transparent' }}>
            POLLA
          </div>
        </div>
      </SidebarHeader>

      {/* League switcher */}
      <div
        onClick={() => league && router.push(`/leagues/${league.id}`)}
        style={{
          margin: '14px 12px 0',
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          cursor: league ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Avi name={league ? league.name.slice(0, 2).toUpperCase() : '?'} color="#7C3AED" size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-inter, sans-serif)',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {league ? league.name : '—'}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains, monospace)',
              fontSize: 9,
              letterSpacing: '0.12em',
              color: 'var(--fg-mute)',
              marginTop: 2,
            }}
          >
            {league ? `${league.memberCount} MIEMBROS` : 'SIN LIGA'}
          </div>
        </div>
        <GameIcon name="chevron-right" size={14} color="var(--fg-mute)" />
      </div>

      {/* Nav */}
      <SidebarContent className="py-3 px-2">
        <div
          style={{
            fontFamily: 'var(--font-jetbrains, monospace)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--fg-faint)',
            padding: '14px 14px 6px',
          }}
        >
          PRINCIPAL
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-link${active ? ' active' : ''}`}
              >
                <GameIcon name={item.icon} size={16} color={active ? 'var(--signal)' : 'currentColor'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge ? (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontFamily: 'var(--font-jetbrains, monospace)',
                      fontSize: 9,
                      letterSpacing: '0.12em',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 10,
                      background: 'var(--danger)',
                      color: '#fff',
                    }}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontFamily: 'var(--font-jetbrains, monospace)',
                      fontSize: 10,
                      color: 'var(--fg-faint)',
                      padding: '2px 5px',
                      border: '1px solid var(--line)',
                      borderRadius: 4,
                    }}
                  >
                    {item.kbd}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div
          style={{
            fontFamily: 'var(--font-jetbrains, monospace)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--fg-faint)',
            padding: '18px 14px 6px',
          }}
        >
          CUENTA
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECONDARY_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-link${active ? ' active' : ''}`}
              >
                <GameIcon name={item.icon} size={16} color={active ? 'var(--signal)' : 'currentColor'} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </SidebarContent>

      {/* Profile chip */}
      <SidebarFooter className="border-t border-[var(--line)]" style={{ padding: 0 }}>
        <div
          onClick={() => router.push('/profile')}
          style={{
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
          className="hover:bg-white/[0.03] transition-colors"
        >
          <Avi name={user?.name ?? '?'} color={user?.color ?? '#08F7FE'} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-inter, sans-serif)',
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name ?? '—'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-jetbrains, monospace)',
                fontSize: 10,
                color: 'var(--fg-mute)',
                letterSpacing: '0.06em',
              }}
            >
              {user?.rank != null ? `#${user.rank} · ${user.pts} PTS` : `${user?.pts ?? 0} PTS`}
            </div>
          </div>
          <GameIcon name="settings" size={14} color="var(--fg-mute)" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
