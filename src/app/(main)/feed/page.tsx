"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Avi } from "@/components/ui/avi";
import { GameIcon } from "@/components/ui/game-icon";
import { TeamFlag } from "@/components/ui/team-flag";
import { FEED_MATCHES, type FeedMatch } from "@/lib/tournament-data";
import { useAppStore } from "@/store/app-store";

function FeedMatchCard({ match }: { match: FeedMatch }) {
  const { openPredictor, predictions } = useAppStore();
  const { home, away, state, score, time, kickoffIn, pts, streakBonus } = match;
  const live = state === "live";
  const final = state === "final";
  const pending = state === "pending";

  const savedPred = predictions[match.id];
  const myPred = savedPred ?? match.myPred;

  const handleClick = () => {
    if (pending) {
      openPredictor(match);
    }
  };

  return (
    <div
      className={`match-card variant-tape ${state}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      role={pending ? "button" : undefined}
      tabIndex={pending ? 0 : undefined}
      style={{ cursor: pending ? "pointer" : "default" }}
    >
      <div className="match-stripes">
        <div className="match-stripe" style={{ background: home.c1 }} />
        <div className="match-stripe" style={{ background: away.c1 }} />
      </div>
      <div className="match-tape">
        <span>
          {match.stage} · {match.venue.split(",")[0]}
        </span>
        {live && (
          <span className="live-pill">
            <span className="dot" />
            EN VIVO · {time}
          </span>
        )}
        {final && <span style={{ color: "var(--fg-mute)" }}>FT</span>}
        {pending && <span>{kickoffIn || time}</span>}
      </div>
      <div className="match-body">
        <div className="team-block">
          <TeamFlag team={home} />
          <div className="team-name" style={{ textAlign: "center" }}>
            {home.name}
          </div>
          <div className="team-code">{home.code}</div>
        </div>
        <div className="center-vs">
          {(live || final) && score && (
            <div className="score-row">
              <span>{score[0]}</span>
              <span className="sep">·</span>
              <span>{score[1]}</span>
            </div>
          )}
          {pending && (
            <>
              <div className="kickoff-time">{time}</div>
              <div className="t-meta" style={{ fontSize: 9 }}>
                {match.weekday} {match.dateNum}
              </div>
            </>
          )}
        </div>
        <div className="team-block right">
          <TeamFlag team={away} />
          <div className="team-name" style={{ textAlign: "center" }}>
            {away.name}
          </div>
          <div className="team-code">{away.code}</div>
        </div>
      </div>
      <div className="match-foot">
        {pending && !myPred && (
          <span className="pred-state">
            <GameIcon name="plus" size={12} /> SIN PREDICCIÓN
          </span>
        )}
        {pending && myPred && (
          <span className="pred-state set">
            <GameIcon name="check" size={12} /> TU: {myPred[0]}–{myPred[1]}
          </span>
        )}
        {live && myPred && (
          <span className="pred-state set">
            TU PRED · {myPred[0]}–{myPred[1]}
          </span>
        )}
        {live && !myPred && (
          <span className="pred-state miss">SIN PREDICCIÓN</span>
        )}
        {final && myPred && (
          <span className={`pred-state ${(pts ?? 0) > 0 ? "set" : "miss"}`}>
            TU: {myPred[0]}–{myPred[1]} · {(pts ?? 0) > 0 ? "ACIERTO" : "FALLO"}
          </span>
        )}
        {final && (
          <span
            className="pts"
            title={
              streakBonus
                ? `Base +${match.basePts} · Racha +${streakBonus}`
                : ""
            }
          >
            {(pts ?? 0) > 0 ? `+${pts}` : "0"} PTS
            {(streakBonus ?? 0) > 0 && (
              <span style={{ color: "var(--warn)", marginLeft: 4 }}>
                ·🔥+{streakBonus}
              </span>
            )}
          </span>
        )}
        {pending && !match.locked && (
          <span style={{ color: "var(--signal)" }}>
            {myPred ? "EDITAR ›" : "PREDECIR ›"}
          </span>
        )}
        {live && (
          <span
            style={{
              color: "var(--danger)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <GameIcon name="lock" size={11} /> BLOQUEADA
          </span>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { openPredictor } = useAppStore();

  const groups = useMemo(() => {
    const byDay: Record<string, { meta: FeedMatch; items: FeedMatch[] }> = {};
    FEED_MATCHES.forEach((m) => {
      if (!byDay[m.dayLabel]) byDay[m.dayLabel] = { meta: m, items: [] };
      byDay[m.dayLabel].items.push(m);
    });
    return byDay;
  }, []);

  const order = ["HOY", "MAÑANA", "AYER"];
  const nextNoPred = FEED_MATCHES.find(
    (m) => m.state === "pending" && !m.myPred,
  );

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avi name="Tú" color="#08F7FE" size={32} />
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
          <div className="topbar-title">THE BIG POLLA</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="icon-btn" style={{ position: "relative" }}>
            <GameIcon name="bell" size={18} />
            <span
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                background: "var(--danger)",
                borderRadius: 4,
                top: 6,
                right: 6,
                boxShadow: "0 0 0 2px var(--bg)",
              }}
            />
          </button>
        </div>
      </div>

      <div className="league-bar">
        <span className="name">RANKING #4</span>
        <span className="sep">·</span>
        <span>252 PTS</span>
        <span className="sep">·</span>
        <span style={{ color: "var(--signal)" }}>+3 ESTA SEMANA</span>
      </div>

      <div className="scroll">
        <div style={{ padding: "12px 20px 0" }}>
          <div className="kpi">
            <div>
              <span className="label">JORNADA</span>
              <span className="value">
                04<span className="small">/12</span>
              </span>
            </div>
            <div>
              <span className="label">PARTIDOS HOY</span>
              <span className="value">06</span>
            </div>
            <div>
              <span className="label">RACHA</span>
              <span className="value" style={{ color: "var(--warn)" }}>
                3<span className="small">×</span>
              </span>
            </div>
          </div>
        </div>

        {nextNoPred && (
          <div style={{ padding: "16px 20px 0" }}>
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                borderColor: "rgba(255, 214, 10, 0.4)",
                background:
                  "linear-gradient(90deg, rgba(255, 214, 10, 0.08), transparent)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  flex: 1,
                }}
              >
                <div className="t-eyebrow" style={{ color: "var(--warn)" }}>
                  ALERTA · CIERRA EN 4H
                </div>
                <div className="t-h3" style={{ fontSize: 16 }}>
                  Te falta predecir {nextNoPred.home.code} vs{" "}
                  {nextNoPred.away.code}
                </div>
              </div>
              <button
                className="btn btn-warn"
                style={{ padding: "10px 14px", fontSize: 12 }}
                onClick={() => openPredictor(nextNoPred)}
              >
                IR →
              </button>
            </div>
          </div>
        )}

        {order.map((day) => {
          const g = groups[day];
          if (!g) return null;
          return (
            <div key={day}>
              <div className="day-divider">
                <div className="num">{g.meta.dateNum}</div>
                <div className="stack">
                  <span className="label">
                    {g.meta.weekday} · {g.meta.monthShort}
                  </span>
                  <span className="meta">{day}</span>
                </div>
                <div className="rule" />
                <div className="t-meta">{g.items.length} PARTIDOS</div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "0 20px 4px",
                }}
              >
                {g.items.map((m) =>
                  m.state !== "pending" ? (
                    <Link
                      key={m.id}
                      href={`/feed/${m.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <FeedMatchCard match={m} />
                    </Link>
                  ) : (
                    <FeedMatchCard key={m.id} match={m} />
                  ),
                )}
              </div>
            </div>
          );
        })}
        <div style={{ height: 90 }} />
      </div>
    </div>
  );
}
