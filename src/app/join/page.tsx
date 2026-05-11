"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GameIcon } from "@/components/ui/game-icon";
import { GamePill } from "@/components/ui/game-pill";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("POLLA-26");

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" className="icon-btn">
            <GameIcon name="back" />
          </Link>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <div className="topbar-meta">INVITACIÓN</div>
          <div className="topbar-title">Unirse</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div
        className="scroll"
        style={{
          padding: "12px 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div className="t-display" style={{ fontSize: 44, marginTop: 12 }}>
          Pasa el código.
        </div>
        <div className="t-body" style={{ maxWidth: 320 }}>
          Pídele el código a quien creó la liga. 8 caracteres, sin espacios.
        </div>

        <div>
          <label className="input-label">Código de liga</label>
          <input
            className="sc-input code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={10}
          />
        </div>

        <div
          className="card"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div
            className="avi"
            style={{
              background: "#7C3AED",
              width: 42,
              height: 42,
              fontSize: 15,
            }}
          >
            AB
          </div>
          <div style={{ flex: 1 }}>
            <div className="t-h3" style={{ fontSize: 18 }}>
              Amigos del bar
            </div>
            <div className="t-meta">12 MIEMBROS · 4 JORNADAS</div>
          </div>
          <GamePill tone="signal" dot>
            ACTIVA
          </GamePill>
        </div>
      </div>

      <div
        style={{
          padding: "12px 20px 24px",
          borderTop: "1px solid var(--line)",
        }}
      >
        <button
          className="btn btn-primary btn-block"
          onClick={() => router.push("/feed")}
        >
          Entrar a la liga <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}
