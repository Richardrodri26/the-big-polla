"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { GameIcon } from "@/components/ui/game-icon";
import { TeamFlag } from "@/components/ui/team-flag";
import { DKTopbar } from "@/components/layout/dk-topbar";
import {
  BRACKET,
  type BracketSlot,
  ROUND_LABELS,
  TEAMS,
} from "@/lib/oracle-data";

interface Line { d: string; active: boolean }

export default function OraclePage() {
  const [bracket, setBracket] = useState(BRACKET);
  const [zoom, setZoom] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);

  const togglePick = (round: string, slotId: string, teamKey: string) => {
    setBracket((b) => ({
      ...b,
      [round]: b[round].map((s: BracketSlot) =>
        s.id === slotId
          ? { ...s, picked: s.picked === teamKey ? null : teamKey }
          : s,
      ),
    }));
  };

  // Compute SVG connecting lines after layout
  useLayoutEffect(() => {
    if (!trackRef.current) return;
    const cont = trackRef.current.getBoundingClientRect();
    const rounds = ["r32", "r16", "qf", "sf", "f"];
    const allLines: Line[] = [];

    rounds.forEach((rkey, ci) => {
      if (ci === rounds.length - 1) return;
      const fromCol = trackRef.current!.querySelector(`[data-col="${rkey}"]`);
      const toCol = trackRef.current!.querySelector(`[data-col="${rounds[ci + 1]}"]`);
      if (!fromCol || !toCol) return;

      const fromCards = fromCol.querySelectorAll(".dk-br-match");
      const toCards = toCol.querySelectorAll(".dk-br-match");

      fromCards.forEach((fc, i) => {
        const tc = toCards[Math.floor(i / 2)];
        if (!tc) return;
        const fr = fc.getBoundingClientRect();
        const tr = tc.getBoundingClientRect();
        const x1 = fr.right - cont.left;
        const y1 = fr.top + fr.height / 2 - cont.top;
        const x2 = tr.left - cont.left;
        const y2 = tr.top + tr.height / 2 - cont.top;
        const midX = (x1 + x2) / 2;
        const fromSlot = (bracket[rkey] as BracketSlot[])[i];
        allLines.push({
          d: `M${x1} ${y1} H${midX} V${y2} H${x2}`,
          active: !!fromSlot?.picked,
        });
      });
    });
    setLines(allLines);
  }, [bracket]);

  const pickedTotal = useMemo(() => {
    let n = 0;
    let total = 0;
    Object.values(bracket).forEach((round) => {
      (round as BracketSlot[]).forEach((s) => {
        if (s.top || s.bot) total += 1;
        if (s.picked) n += 1;
      });
    });
    return { n, total };
  }, [bracket]);

  const champTeam = TEAMS.A1;
  const pct = Math.round((pickedTotal.n / pickedTotal.total) * 100);

  return (
    <div className="screen bracket-stage screen-anim">
      {/* Mobile topbar */}
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="icon-btn">
            <GameIcon name="info" size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div className="topbar-meta">BRACKET COMPLETO</div>
          <div className="topbar-title">ORACLE</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="icon-btn">
            <GameIcon name="share" size={16} />
          </button>
        </div>
      </div>

      {/* Desktop topbar */}
      <DKTopbar crumbs={["LIGA AMIGOS DEL BAR", "ORACLE BRACKET"]} />

      {/* Desktop page header */}
      <div className="dk-page-head">
        <div>
          <div className="sub">FASE ELIMINATORIA · WC 2026</div>
          <div className="title">ORACLE</div>
        </div>
        <div className="actions">
          <div className="dk-tape">CIERRA EN<span>11 JUN · 18:00</span></div>
          <button className="dk-btn primary">Guardar progreso →</button>
        </div>
      </div>

      {/* Mobile progress card */}
      <div style={{ padding: "0 20px 8px" }} className="md:hidden">
        <div
          className="card"
          style={{
            padding: 12,
            background: "linear-gradient(90deg, rgba(0,210,106,0.08), transparent)",
            borderColor: "rgba(0,210,106,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="t-eyebrow" style={{ color: "var(--signal)" }}>PROGRESO</div>
            <div className="t-h3" style={{ fontSize: 16 }}>
              {pickedTotal.n} de {pickedTotal.total} predicciones
            </div>
          </div>
          <div
            style={{
              width: 48, height: 48, borderRadius: "50%",
              background: `conic-gradient(var(--signal) 0 ${(pickedTotal.n / pickedTotal.total) * 360}deg, rgba(255,255,255,0.08) 0)`,
              display: "grid", placeItems: "center", position: "relative",
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--bg)", display: "grid", placeItems: "center", fontFamily: "var(--display)", fontWeight: 900, fontSize: 12 }}>
              {pct}%
            </div>
          </div>
        </div>
      </div>

      {/* Desktop stats row */}
      <div className="dk-section hidden md:block" style={{ paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.5fr", gap: 12 }}>
          <div className="dk-card" style={{ background: "linear-gradient(135deg, rgba(0,210,106,0.10), transparent 60%), var(--surface)", borderColor: "rgba(0,210,106,0.3)" }}>
            <div className="t-eyebrow" style={{ color: "var(--signal)" }}>PROGRESO TOTAL</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <span style={{ fontFamily: "var(--font-inter, sans-serif)", fontWeight: 900, fontSize: 44, letterSpacing: "-0.05em", fontVariationSettings: '"wdth" 75' }}>{pickedTotal.n}</span>
              <span style={{ fontFamily: "var(--font-inter, sans-serif)", fontWeight: 800, fontSize: 18, color: "var(--fg-mute)" }}>/{pickedTotal.total}</span>
            </div>
            <div className="t-meta" style={{ marginTop: 4 }}>{pct}% COMPLETO</div>
          </div>
          <div className="dk-card">
            <div className="t-eyebrow">PUNTOS POSIBLES · BRACKET</div>
            <div style={{ fontFamily: "var(--font-inter, sans-serif)", fontWeight: 900, fontSize: 44, letterSpacing: "-0.05em", fontVariationSettings: '"wdth" 75', marginTop: 6, color: "var(--warn)" }}>+128</div>
            <div className="t-meta" style={{ marginTop: 4 }}>SI ACIERTAS TODO + CAMPEÓN</div>
          </div>
          <div className="dk-card">
            <div className="t-eyebrow">RONDAS PENDIENTES</div>
            <div style={{ fontFamily: "var(--font-inter, sans-serif)", fontWeight: 900, fontSize: 44, letterSpacing: "-0.05em", fontVariationSettings: '"wdth" 75', marginTop: 6 }}>3</div>
            <div className="t-meta" style={{ marginTop: 4 }}>OCTAVOS · CUARTOS · SEMIS</div>
          </div>
          <div className="dk-champion">
            <TeamFlag team={champTeam} size="lg" />
            <div>
              <div className="label">★ CAMPEÓN MUNDIAL</div>
              <div className="name">{champTeam?.name?.toUpperCase()}</div>
              <div className="t-meta" style={{ marginTop: 4 }}>+50 PTS SI ACIERTAS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile zoom controls */}
      <div
        className="md:hidden"
        style={{ padding: "8px 16px 0", display: "flex", gap: 6, justifyContent: "space-between", alignItems: "center" }}
      >
        <div className="t-meta">DESLIZA HORIZONTAL → 5 RONDAS</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}>−</button>
          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setZoom(Math.min(1.2, zoom + 0.1))}>+</button>
        </div>
      </div>

      {/* Mobile bracket track */}
      <div className="scroll md:hidden">
        <div
          className="bracket-track"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}
        >
          {ROUND_LABELS.map((r) => (
            <div key={r.key} className="round-col">
              <div className="round-head">
                <span>{r.label}</span>
                <span className="count">{r.count}</span>
              </div>
              {(bracket[r.key] as BracketSlot[]).map((s) => (
                <div key={s.id} className="bracket-card">
                  {(["top", "bot"] as const).map((side) => {
                    const teamKey = side === "top" ? s.top : s.bot;
                    const team = teamKey ? TEAMS[teamKey] : null;
                    const picked = s.picked === teamKey;
                    return (
                      <div
                        key={side}
                        className={`slot ${picked ? "picked" : ""}`}
                        onClick={() => team && teamKey && togglePick(r.key, s.id, teamKey)}
                        style={{ cursor: team ? "pointer" : "default" }}
                      >
                        <TeamFlag team={team} size="xs" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {team ? team.name : "—"}
                          </div>
                          {team && <div className="seed">GR.{team.group} · #{team.seed}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 20px 8px" }}>
          <div className="section-head" style={{ padding: 0 }}>
            <div className="num">CAMPEÓN</div>
            <div className="title">TU PICK FINAL</div>
          </div>
          <div className="card" style={{ marginTop: 10, padding: 18, background: "linear-gradient(135deg, rgba(255,214,10,0.10), transparent 60%), var(--surface)", borderColor: "rgba(255,214,10,0.3)", display: "flex", alignItems: "center", gap: 14 }}>
            <TeamFlag team={champTeam} size="lg" />
            <div style={{ flex: 1 }}>
              <div className="t-eyebrow" style={{ color: "var(--warn)" }}>★ CAMPEÓN MUNDIAL · +50 PTS</div>
              <div className="t-h2" style={{ fontSize: 26, marginTop: 4 }}>{champTeam?.name?.toUpperCase()}</div>
            </div>
          </div>
        </div>
        <div style={{ height: 100 }} />
      </div>

      {/* Desktop bracket with SVG lines */}
      <div className="scroll hidden md:block">
        <div
          ref={trackRef}
          className="dk-bracket"
          style={{ position: "relative" }}
        >
          {/* SVG lines layer */}
          <svg
            className="dk-bracket-lines"
            preserveAspectRatio="none"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
          >
            {lines.map((l, i) => (
              <path key={i} d={l.d} className={l.active ? "active" : ""} />
            ))}
          </svg>

          {/* Bracket grid */}
          <div className="dk-bracket-grid">
            {ROUND_LABELS.map((r) => (
              <div key={r.key} className="dk-bracket-col" data-col={r.key}>
                <div className="dk-bracket-col-head">
                  <div className="name">{r.label.toUpperCase()}</div>
                  <div>{r.count}</div>
                </div>
                {(bracket[r.key] as BracketSlot[]).map((s) => (
                  <div key={s.id} className="dk-br-match">
                    {(["top", "bot"] as const).map((side) => {
                      const teamKey = side === "top" ? s.top : s.bot;
                      const team = teamKey ? TEAMS[teamKey] : null;
                      const picked = s.picked === teamKey && !!teamKey;
                      return (
                        <div
                          key={side}
                          className={`dk-br-slot ${picked ? "picked" : ""}`}
                          onClick={() => team && teamKey && togglePick(r.key, s.id, teamKey)}
                          style={{ cursor: team ? "pointer" : "default" }}
                        >
                          <TeamFlag team={team} size="xs" />
                          <div style={{ minWidth: 0 }}>
                            <div className="name">{team ? team.name : "—"}</div>
                            {team && <div className="seed">GR.{team.group} · #{team.seed}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
