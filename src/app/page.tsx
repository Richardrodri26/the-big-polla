import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function SplashPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/feed')

  return (
    <div className="screen onboard screen-anim">
      <div className="onboard-poster">
        <div className="onboard-edge tl">FIFA · 2026</div>
        <div className="onboard-edge tr">
          USA · CAN · MEX
          <br />
          48 NACIONES
        </div>
        <div className="poster-mark">
          <div className="line l1">THE</div>
          <div className="line l2">BIG</div>
          <div className="line l3">POLLA</div>
        </div>
        <div className="onboard-edge bl">N° 0001 / EDICIÓN MUNDIAL</div>
        <div className="onboard-edge br">
          PRE-PARTIDO
          <br />
          JORNADA 4
        </div>
      </div>

      <div className="onboard-foot">
        <div className="t-eyebrow">Apuesta entre amigos · sin dinero real</div>
        <Link href="/login" className="btn btn-primary btn-block">
          Iniciar sesión <span className="arrow">→</span>
        </Link>
        <Link href="/create" className="btn btn-ghost btn-block">
          Crear nueva liga
        </Link>
      </div>
    </div>
  )
}
