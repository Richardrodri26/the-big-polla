'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GameIcon } from '@/components/ui/game-icon'

export default function JoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = code.trim()
    if (token) router.push(`/join/${token}`)
  }

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" className="icon-btn">
            <GameIcon name="back" />
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">INVITACIÓN</div>
          <div className="topbar-title">Unirse</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}
      >
        <div className="t-display" style={{ fontSize: 44, marginTop: 12 }}>
          Pasa el código.
        </div>
        <div className="t-body" style={{ maxWidth: 320 }}>
          Pedile el código a quien creó la liga e ingresalo acá.
        </div>

        <div>
          <label className="input-label">Código de invitación</label>
          <input
            className="sc-input code"
            value={code}
            onChange={e => setCode(e.target.value.trim())}
            placeholder="Pegá el código aquí"
            autoFocus
          />
        </div>

        <div style={{ marginTop: 'auto', paddingBottom: 24 }}>
          <button
            type="submit"
            disabled={!code.trim()}
            className="btn btn-primary btn-block"
          >
            Buscar liga <span className="arrow">→</span>
          </button>
        </div>
      </form>
    </div>
  )
}
