"use client";

import { useState } from "react";
import { Avi } from "@/components/ui/avi";
import { GameIcon } from "@/components/ui/game-icon";
import { MEMBERS, type Member, SCORING_RULES } from "@/lib/tournament-data";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from "@/components/ui/responsive-dialog";

function PointsBreakdownContent({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const b = member.breakdown;
  const R = SCORING_RULES;
  const lines = [
    {
      k: "exact",
      label: "Resultado exacto",
      count: b.exact,
      unit: R.exact,
      color: "var(--warn)",
      icon: "★",
    },
    {
      k: "diff",
      label: "Diferencia de gol",
      count: b.diff,
      unit: R.diff,
      color: "var(--signal)",
      icon: "Δ",
    },
    {
      k: "winner",
      label: "Solo ganador / empate",
      count: b.winner,
      unit: R.winner,
      color: "var(--fg)",
      icon: "✓",
    },
  ];
  const subtotalBase = lines.reduce((s, l) => s + l.count * l.unit, 0);
  const total = subtotalBase + b.streakBonus + b.comboBonus + b.oraclePartial;

  return (
    <div className="scroll" style={{ overflowY: "auto", maxHeight: "80dvh" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 18px 4px",
          }}
        >
          <div className="t-eyebrow">DESGLOSE · TRANSPARENCIA</div>
          <button
            className="icon-btn"
            onClick={onClose}
            style={{ width: 32, height: 32 }}
          >
            <GameIcon name="close" size={14} />
          </button>
        </div>
        <div
          style={{
            padding: "10px 20px 6px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Avi name={member.name} color={member.color} size={48} />
          <div style={{ flex: 1 }}>
            <div className="t-h2" style={{ fontSize: 22 }}>
              {member.name}
            </div>
            <div className="t-meta">
              RANK #{member.rank} · {member.handle}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="t-num" style={{ fontSize: 32, color: "var(--fg)" }}>
              {member.pts}
            </div>
            <div className="t-meta" style={{ fontSize: 9 }}>
              PUNTOS TOTALES
            </div>
          </div>
        </div>

        <div
          className="scroll"
          style={{ padding: "8px 20px 8px", maxHeight: 440 }}
        >
          <div className="section-head" style={{ padding: "10px 0 8px" }}>
            <div className="num">A · ACIERTOS</div>
            <div className="title">PUNTOS BASE</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lines.map((l) => (
              <div
                key={l.k}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 1fr auto auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    background:
                      l.color === "var(--warn)"
                        ? "rgba(255,214,10,0.15)"
                        : l.color === "var(--signal)"
                          ? "rgba(0,210,106,0.15)"
                          : "rgba(255,255,255,0.06)",
                    color: l.color,
                    fontFamily: "var(--display)",
                    fontWeight: 900,
                    fontSize: 14,
                  }}
                >
                  {l.icon}
                </div>
                <div>
                  <div className="t-h3" style={{ fontSize: 13 }}>
                    {l.label}
                  </div>
                  <div
                    className="t-meta"
                    style={{
                      textTransform: "none",
                      letterSpacing: "0.02em",
                      fontSize: 10,
                    }}
                  >
                    {l.count} × +{l.unit} pts
                  </div>
                </div>
                <div
                  className="t-num"
                  style={{ fontSize: 13, color: "var(--fg-mute)" }}
                >
                  ×{l.count}
                </div>
                <div
                  className="t-num"
                  style={{
                    fontSize: 16,
                    color: l.color,
                    minWidth: 44,
                    textAlign: "right",
                  }}
                >
                  +{l.count * l.unit}
                </div>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "6px 12px",
                borderTop: "1px dashed var(--line)",
                marginTop: 4,
              }}
            >
              <span className="t-meta">SUBTOTAL BASE</span>
              <span className="t-num" style={{ fontSize: 16 }}>
                +{subtotalBase}
              </span>
            </div>
          </div>

          <div className="section-head" style={{ padding: "16px 0 8px" }}>
            <div className="num">B · BONIFICACIONES</div>
            <div className="title">EXTRAS</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr auto",
                gap: 10,
                alignItems: "center",
                padding: "12px",
                borderRadius: 10,
                background:
                  "linear-gradient(90deg, rgba(255,214,10,0.10), rgba(255,214,10,0.02))",
                border: "1px solid rgba(255,214,10,0.3)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(255,214,10,0.2)",
                  color: "var(--warn)",
                }}
              >
                <GameIcon name="fire" size={14} color="var(--warn)" />
              </div>
              <div>
                <div className="t-h3" style={{ fontSize: 13 }}>
                  Bonus por racha
                </div>
                <div
                  className="t-meta"
                  style={{
                    textTransform: "none",
                    letterSpacing: "0.02em",
                    fontSize: 10,
                  }}
                >
                  +1 pt × nivel de racha (máx +5 / partido) · racha actual{" "}
                  {member.streak}×
                </div>
              </div>
              <div
                className="t-num"
                style={{ fontSize: 18, color: "var(--warn)" }}
              >
                +{b.streakBonus}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr auto",
                gap: 10,
                alignItems: "center",
                padding: "12px",
                borderRadius: 10,
                background: "rgba(0,210,106,0.06)",
                border: "1px solid rgba(0,210,106,0.25)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(0,210,106,0.18)",
                  color: "var(--signal)",
                  fontFamily: "var(--display)",
                  fontWeight: 900,
                }}
              >
                5
              </div>
              <div>
                <div className="t-h3" style={{ fontSize: 13 }}>
                  Pleno de jornada (5/5)
                </div>
                <div
                  className="t-meta"
                  style={{
                    textTransform: "none",
                    letterSpacing: "0.02em",
                    fontSize: 10,
                  }}
                >
                  +{R.combo} pts por jornada perfecta ·{" "}
                  {Math.round(b.comboBonus / R.combo)} jornada(s)
                </div>
              </div>
              <div
                className="t-num"
                style={{ fontSize: 18, color: "var(--signal)" }}
              >
                +{b.comboBonus}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr auto",
                gap: 10,
                alignItems: "center",
                padding: "12px",
                borderRadius: 10,
                background: "rgba(124,58,237,0.06)",
                border: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(124,58,237,0.2)",
                  color: "#A78BFA",
                  fontFamily: "var(--display)",
                  fontWeight: 900,
                }}
              >
                ★
              </div>
              <div>
                <div className="t-h3" style={{ fontSize: 13 }}>
                  Oracle (bracket)
                </div>
                <div
                  className="t-meta"
                  style={{
                    textTransform: "none",
                    letterSpacing: "0.02em",
                    fontSize: 10,
                  }}
                >
                  Picks acertados en rondas eliminatorias hasta ahora
                </div>
              </div>
              <div className="t-num" style={{ fontSize: 18, color: "#A78BFA" }}>
                +{b.oraclePartial}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "14px 14px",
              background: "var(--surface-2)",
              border: "1px solid var(--line-2)",
              borderRadius: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div className="t-eyebrow">TOTAL</div>
              <div
                className="t-meta"
                style={{ textTransform: "none", letterSpacing: "0.02em" }}
              >
                {subtotalBase} base +{" "}
                {b.streakBonus + b.comboBonus + b.oraclePartial} bonus
              </div>
            </div>
            <div className="t-num" style={{ fontSize: 36, color: "var(--fg)" }}>
              {total}
            </div>
          </div>

          <div
            className="t-meta"
            style={{
              textAlign: "center",
              marginTop: 14,
              fontSize: 9,
              lineHeight: 1.5,
              textTransform: "none",
              letterSpacing: "0.04em",
            }}
          >
            Reglas oficiales de la liga · Auditadas por todos los miembros ·
            Última actualización Jornada 4
          </div>
        </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState("global");
  const [breakdownFor, setBreakdownFor] = useState<Member | null>(null);

  const members = MEMBERS;

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="icon-btn">
            <GameIcon name="filter" size={16} />
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <div className="topbar-meta">LIGA · AMIGOS DEL BAR</div>
          <div className="topbar-title">LEADERBOARD</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="icon-btn">
            <GameIcon name="fire" size={16} color="var(--warn)" />
          </button>
        </div>
      </div>

      {/* Desktop: 2-col. Mobile: single col */}
      <div className="flex flex-col lg:flex-row lg:flex-1 lg:overflow-hidden">
        {/* LEFT PANEL — tabs + podium */}
        <div className="lg:w-[380px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-[var(--line)]">
          <div style={{ display: "flex", gap: 6, padding: "8px 20px 12px" }}>
            {[
              { id: "global", label: "Global" },
              { id: "week", label: "Semanal" },
              { id: "j4", label: "Jornada 4" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                  background: tab === t.id ? "var(--fg)" : "rgba(255,255,255,0.03)",
                  color: tab === t.id ? "#04130A" : "var(--fg-dim)",
                  fontFamily: "var(--display)",
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Podium */}
          <div
            style={{
              padding: "0 20px 16px",
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr 1fr",
              gap: 8,
              alignItems: "end",
            }}
          >
            {[1, 0, 2].map((idx) => {
              const m = members[idx];
              if (!m) return null;
              const heights = [110, 86, 72];
              const place = m.rank;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Avi name={m.name} color={m.color} size={place === 1 ? 56 : 44} />
                  <div
                    className="t-h3"
                    style={{ fontSize: place === 1 ? 14 : 12, textAlign: "center" }}
                  >
                    {m.name.split(" ")[0]}
                  </div>
                  <div
                    className="t-num"
                    style={{
                      fontSize: place === 1 ? 24 : 18,
                      color: place === 1 ? "var(--warn)" : "var(--fg)",
                    }}
                  >
                    {m.pts}
                  </div>
                  <div
                    style={{
                      height: heights[idx],
                      width: "100%",
                      background:
                        place === 1
                          ? "linear-gradient(180deg, var(--warn), transparent 130%)"
                          : place === 2
                            ? "linear-gradient(180deg, #C7CACE, transparent 130%)"
                            : "linear-gradient(180deg, #D08350, transparent 130%)",
                      borderRadius: "10px 10px 0 0",
                      position: "relative",
                      opacity: 0.92,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        fontFamily: "var(--display)",
                        fontWeight: 900,
                        fontSize: place === 1 ? 28 : 22,
                        color: "rgba(0,0,0,0.55)",
                      }}
                    >
                      {place}°
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL — full rankings list */}
        <div className="flex-1 scroll">
          <div className="section-head">
            <div className="num">RANKING · {members.length}</div>
            <div className="title">CLASIFICACIÓN</div>
          </div>
          {members.map((m) => {
            const delta = m.prevRank - m.rank;
            const deltaCls = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
            return (
              <div
                key={m.id}
                onClick={() => setBreakdownFor(m)}
                className={`lb-row ${m.me ? "me" : ""} ${m.rank === 1 ? "top-1" : m.rank === 2 ? "top-2" : m.rank === 3 ? "top-3" : ""}`}
                style={{ cursor: "pointer" }}
              >
                <div className="rank">{m.rank}</div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minWidth: 0,
                  }}
                >
                  <Avi name={m.name} color={m.color} size={36} />
                  <div className="who">
                    <div className="name">
                      {m.name}
                      {m.me && (
                        <span
                          style={{
                            color: "var(--signal)",
                            marginLeft: 6,
                            fontSize: 10,
                            letterSpacing: "0.1em",
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="sub">
                      <span>{m.handle}</span>
                      <span>{m.hits} HITS</span>
                      {m.streak > 0 && (
                        <span style={{ color: "var(--warn)" }}>
                          {m.streak}× RACHA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 2,
                  }}
                >
                  <div className="pts">
                    {m.pts}
                    <span className={`delta ${deltaCls}`}>
                      {delta > 0
                        ? `▲${delta}`
                        : delta < 0
                          ? `▼${Math.abs(delta)}`
                          : "—"}
                    </span>
                  </div>
                  <div
                    className="t-meta"
                    style={{
                      fontSize: 9,
                      color: "var(--signal)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    VER DESGLOSE <GameIcon name="chevron-right" size={10} />
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ height: 90 }} />
        </div>
      </div>

      <ResponsiveDialog
        open={!!breakdownFor}
        onOpenChange={(open) => { if (!open) setBreakdownFor(null); }}
      >
        <ResponsiveDialogContent showCloseButton={false}>
          {breakdownFor && (
            <PointsBreakdownContent
              member={breakdownFor}
              onClose={() => setBreakdownFor(null)}
            />
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
