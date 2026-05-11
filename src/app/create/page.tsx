"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GameIcon } from "@/components/ui/game-icon";

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState("Amigos del bar");

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
          <div className="topbar-meta">PASO 1 / 2</div>
          <div className="topbar-title">Crear liga</div>
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
          Arma tu liga.
        </div>
        <div className="t-body" style={{ maxWidth: 320 }}>
          Ponle nombre, ajusta reglas de puntaje y comparte el código con tus
          amigos.
        </div>

        <div>
          <label className="input-label">Nombre de la liga</label>
          <input
            className="sc-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Amigos del bar"
          />
        </div>

        <div>
          <label className="input-label">Código generado</label>
          <input className="sc-input code" readOnly value="POLLA-FB7K" />
        </div>

        <div
          className="card"
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div className="t-eyebrow">REGLAS DE PUNTAJE · PRESET</div>
          {[
            ["Resultado exacto", "+5 pts"],
            ["Diferencia de gol", "+3 pts"],
            ["Solo ganador", "+1 pt"],
            ["Bonus 5/5 en jornada", "+10 pts"],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--fg-dim)" }}>{k}</span>
              <span
                className="t-mono"
                style={{ color: "var(--warn)", fontWeight: 700 }}
              >
                {v}
              </span>
            </div>
          ))}
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
          Crear y compartir <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}
