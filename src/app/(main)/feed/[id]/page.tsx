"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { GameIcon } from "@/components/ui/game-icon";
import { GamePill } from "@/components/ui/game-pill";
import { TeamFlag } from "@/components/ui/team-flag";
import { FEED_MATCHES } from "@/lib/tournament-data";
import { useAppStore } from "@/store/app-store";

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { openPredictor, predictions } = useAppStore();

  const match = FEED_MATCHES.find((m) => m.id === id);
  if (!match) notFound();

  const { home, away, state, score } = match;
  const savedPred = predictions[match.id];
  const myPred = savedPred ?? match.myPred;

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/feed" className="icon-btn">
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
          <div className="topbar-meta">{match.stage.toUpperCase()}</div>
          <div className="topbar-title">MATCH</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="icon-btn">
            <GameIcon name="share" size={16} />
          </button>
        </div>
      </div>

      <div className="scroll">
        <div
          className="detail-hero"
          style={
            {
              "--c1": `${home.c1}33`,
              "--c2": `${away.c1}33`,
            } as React.CSSProperties
          }
        >
          <div className="detail-meta-row">
            <span>{match.venue}</span>
            {state === "live" && (
              <span style={{ color: "var(--signal)" }}>● {match.time}</span>
            )}
            {state === "final" && <span>FINAL</span>}
            {state === "pending" && <span>{match.time}</span>}
          </div>
          <div className="detail-versus">
            <div className="detail-team">
              <TeamFlag team={home} size="lg" />
              <div className="name">{home.name}</div>
              <div className="t-meta">{home.code}</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              {(state === "live" || state === "final") && score && (
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontWeight: 900,
                    fontSize: 64,
                    letterSpacing: "-0.06em",
                    lineHeight: 1,
                  }}
                >
                  {score[0]}
                  <span style={{ color: "var(--fg-faint)" }}>·</span>
                  {score[1]}
                </div>
              )}
              {state === "pending" && <div className="detail-vs">VS</div>}
              {state === "live" && (
                <GamePill tone="signal" dot>
                  EN VIVO
                </GamePill>
              )}
            </div>
            <div className="detail-team">
              <TeamFlag team={away} size="lg" />
              <div className="name">{away.name}</div>
              <div className="t-meta">{away.code}</div>
            </div>
          </div>
          <div className="detail-meta-row">
            <span>TU PRED · {myPred ? `${myPred[0]}–${myPred[1]}` : "—"}</span>
            <span>VS · LIGA · 8 PRED</span>
          </div>
        </div>

        {match.timeline && (
          <div>
            <div className="section-head">
              <div className="num">EVENTOS</div>
              <div className="title">CRONOLOGÍA</div>
            </div>
            <div className="live-timeline">
              {[...match.timeline].reverse().map((e, i) => (
                <div className="live-event" key={i}>
                  <div className="min">{e.min}&apos;</div>
                  <div className="text">
                    <div className="head">{e.head}</div>
                    <div className="body">{e.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section-head">
          <div className="num">LIGA · 8 PRED</div>
          <div className="title">¿QUÉ DICE LA TRIBUNA?</div>
        </div>
        <div
          style={{
            padding: "0 20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {[
            { who: `Gana ${home.name}`, pct: 62, color: home.c1 },
            { who: "Empate", pct: 25, color: "var(--fg-mute)" },
            { who: `Gana ${away.name}`, pct: 13, color: away.c1 },
          ].map((row) => (
            <div key={row.who}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--fg-dim)",
                  }}
                >
                  {row.who}
                </span>
                <span className="t-num" style={{ fontSize: 13 }}>
                  {row.pct}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${row.pct}%`,
                    height: "100%",
                    background: row.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {state === "pending" && (
          <div style={{ padding: "0 20px 24px" }}>
            <button
              className="btn btn-primary btn-block"
              onClick={() => openPredictor(match)}
            >
              {myPred ? "EDITAR PREDICCIÓN" : "HACER PREDICCIÓN"}{" "}
              <span className="arrow">→</span>
            </button>
          </div>
        )}
        <div style={{ height: 90 }} />
      </div>
    </div>
  );
}
