"use client";

import { useMemo, useState } from "react";
import { GameIcon } from "@/components/ui/game-icon";
import { TeamFlag } from "@/components/ui/team-flag";
import {
  BRACKET,
  type BracketSlot,
  ROUND_LABELS,
  TEAMS,
} from "@/lib/tournament-data";

export default function OraclePage() {
  const [bracket, setBracket] = useState(BRACKET);
  const [zoom, setZoom] = useState(1);

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

  return (
    <div className="screen bracket-stage screen-anim">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="icon-btn">
            <GameIcon name="info" size={16} />
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
          <div className="topbar-meta">BRACKET COMPLETO</div>
          <div className="topbar-title">ORACLE</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="icon-btn">
            <GameIcon name="share" size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: "0 20px 8px" }}>
        <div
          className="card"
          style={{
            padding: 12,
            background:
              "linear-gradient(90deg, rgba(0,210,106,0.08), transparent)",
            borderColor: "rgba(0,210,106,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="t-eyebrow" style={{ color: "var(--signal)" }}>
              PROGRESO
            </div>
            <div className="t-h3" style={{ fontSize: 16 }}>
              {pickedTotal.n} de {pickedTotal.total} predicciones
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: `conic-gradient(var(--signal) 0 ${(pickedTotal.n / pickedTotal.total) * 360}deg, rgba(255,255,255,0.08) 0)`,
              display: "grid",
              placeItems: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "var(--bg)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--display)",
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              {Math.round((pickedTotal.n / pickedTotal.total) * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "8px 16px 0",
          display: "flex",
          gap: 6,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="t-meta">DESLIZA HORIZONTAL → 5 RONDAS</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}
          >
            −
          </button>
          <button
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            onClick={() => setZoom(Math.min(1.2, zoom + 0.1))}
          >
            +
          </button>
        </div>
      </div>

      <div className="scroll">
        <div
          className="bracket-track"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: `${100 / zoom}%`,
          }}
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
                        onClick={() =>
                          team && teamKey && togglePick(r.key, s.id, teamKey)
                        }
                        style={{ cursor: team ? "pointer" : "default" }}
                      >
                        <TeamFlag team={team} size="xs" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="name"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {team ? team.name : "—"}
                          </div>
                          {team && (
                            <div className="seed">
                              GR.{team.group} · #{team.seed}
                            </div>
                          )}
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
          <div
            className="card"
            style={{
              marginTop: 10,
              padding: 18,
              background:
                "linear-gradient(135deg, rgba(255,214,10,0.10), transparent 60%), var(--surface)",
              borderColor: "rgba(255,214,10,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <TeamFlag team={champTeam} size="lg" />
            <div style={{ flex: 1 }}>
              <div className="t-eyebrow" style={{ color: "var(--warn)" }}>
                ★ CAMPEÓN MUNDIAL · +50 PTS
              </div>
              <div className="t-h2" style={{ fontSize: 26, marginTop: 4 }}>
                {champTeam?.name?.toUpperCase()}
              </div>
              <div className="t-meta" style={{ marginTop: 4 }}>
                3 GR · OCT · CTS · SF · F
              </div>
            </div>
            <GameIcon name="chevron-right" />
          </div>
        </div>
        <div style={{ height: 100 }} />
      </div>
    </div>
  );
}
