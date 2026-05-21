import Link from "next/link";
import { Avi } from "@/components/ui/avi";
import { GameIcon } from "@/components/ui/game-icon";
import { GamePill } from "@/components/ui/game-pill";
import { TeamFlag } from "@/components/ui/team-flag";
import { BADGES, FEED_MATCHES, MEMBERS, type FeedMatch, type Member } from "@/lib/tournament-data";

type ResultKind = "exact" | "diff" | "winner" | "miss";

function classifyResult(m: FeedMatch): ResultKind | null {
  if (m.state !== "final") return null;
  if (m.correctScore) return "exact";
  if (m.correctOutcome) return m.basePts === 3 ? "diff" : "winner";
  return "miss";
}

const RESULT_CONFIG: Record<ResultKind, { label: string; color: string; bg: string }> = {
  exact:  { label: "EXACTO",     color: "var(--warn)",     bg: "rgba(255,214,10,0.15)"  },
  diff:   { label: "DIFERENCIA", color: "var(--signal)",   bg: "rgba(0,210,106,0.12)"   },
  winner: { label: "GANADOR",    color: "var(--fg-dim)",   bg: "rgba(255,255,255,0.06)" },
  miss:   { label: "MISS",       color: "var(--fg-faint)", bg: "rgba(255,255,255,0.03)" },
};

const TOTAL_PLAYED = 27;

function PerformanceBar({ breakdown }: { breakdown: { exact: number; diff: number; winner: number } }) {
  const { exact, diff, winner } = breakdown;
  const miss = Math.max(0, TOTAL_PLAYED - exact - diff - winner);
  const total = exact + diff + winner + miss;

  const segments = [
    { key: "exact",  count: exact,  label: "EXACTO",     barColor: "#FFD60A", textColor: "var(--warn)"     },
    { key: "diff",   count: diff,   label: "DIFERENCIA", barColor: "#00D26A", textColor: "var(--signal)"   },
    { key: "winner", count: winner, label: "GANADOR",    barColor: "#8B97AD", textColor: "var(--fg-dim)"   },
    { key: "miss",   count: miss,   label: "MISS",       barColor: "#2A3248", textColor: "var(--fg-faint)" },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          height: 10,
          borderRadius: 6,
          overflow: "hidden",
          gap: 2,
          background: "var(--surface-2)",
        }}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            style={{
              flex: s.count / total,
              background: s.barColor,
              minWidth: s.count > 0 ? 4 : 0,
              opacity: s.key === "miss" ? 0.35 : 0.9,
              transition: "flex 0.4s ease",
            }}
          />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
        {segments.map((s) => (
          <div key={s.key} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              className="t-num"
              style={{
                fontSize: 20,
                color: s.textColor,
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {s.count}
            </span>
            <span className="t-meta" style={{ fontSize: 8, letterSpacing: "0.1em" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const me = MEMBERS.find((m) => m.me)!;
  const finishedMatches = FEED_MATCHES.filter((m) => m.state === "final");

  const myIdx = MEMBERS.findIndex((m) => m.me);
  const sliceStart = Math.max(0, myIdx - 2);
  const sliceEnd = Math.min(MEMBERS.length, myIdx + 3);
  const miniRanking = MEMBERS.slice(sliceStart, sliceEnd);

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ width: 36 }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <div className="topbar-meta">{me.handle.toUpperCase()}</div>
          <div className="topbar-title">MI PERFIL</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/settings" className="icon-btn">
            <GameIcon name="settings" size={16} />
          </Link>
        </div>
      </div>

      <div className="scroll">
        <div className="profile-hero">
          <div className="profile-row">
            <Avi name={me.name} color={me.color} size={64} />
            <div style={{ flex: 1 }}>
              <div className="t-h2" style={{ fontSize: 26 }}>
                {me.name}
              </div>
              <div className="t-meta">
                RANK #{me.rank} · {me.pts} PTS
              </div>
            </div>
            <GamePill tone="signal" dot>
              +5 SEM
            </GamePill>
          </div>
          <div className="kpi">
            <div>
              <span className="label">ACIERTOS</span>
              <span className="value">
                {me.hits}
                <span className="small">/27</span>
              </span>
            </div>
            <div>
              <span className="label">RACHA</span>
              <span className="value" style={{ color: "var(--warn)" }}>
                {me.streak}
                <span className="small">×</span>
              </span>
            </div>
            <div>
              <span className="label">% HIT</span>
              <span className="value">
                37<span className="small">%</span>
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px var(--gutter) 0" }}>
          <div className="section-head" style={{ padding: "0 0 12px" }}>
            <div className="num">{TOTAL_PLAYED} PARTIDOS</div>
            <div className="title">RENDIMIENTO</div>
          </div>
          <PerformanceBar breakdown={me.breakdown} />
        </div>

        <div className="section-head">
          <div className="num">8 LOGROS</div>
          <div className="title">INSIGNIAS</div>
        </div>
        <div className="badge-grid">
          {BADGES.map((b) => (
            <div key={b.id} className={`badge ${b.unlocked ? "" : "locked"}`}>
              <div className="num">{b.num}</div>
              <div className="label">{b.label}</div>
            </div>
          ))}
        </div>

        <div className="section-head">
          <div className="num">POSICIÓN #{me.rank} DE {MEMBERS.length}</div>
          <div className="title">CLASIFICACIÓN</div>
        </div>
        <div
          style={{
            border: "1px solid var(--line)",
            borderRadius: "var(--card-radius)",
            overflow: "hidden",
            margin: "0 var(--gutter) 20px",
          }}
        >
          {miniRanking.map((m: Member) => {
            const delta = m.prevRank - m.rank;
            const deltaCls = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
            const deltaStr =
              delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : "—";
            return (
              <div
                key={m.id}
                className={[
                  "lb-row",
                  m.me ? "me" : "",
                  m.rank === 1 ? "top-1" : m.rank === 2 ? "top-2" : m.rank === 3 ? "top-3" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="rank">{m.rank}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avi name={m.name} color={m.color} size={32} />
                  <div className="who">
                    <div className="name" style={{ fontSize: 14 }}>
                      {m.name}
                      {m.me && (
                        <span
                          style={{
                            color: "var(--signal)",
                            marginLeft: 6,
                            fontSize: 9,
                            letterSpacing: "0.1em",
                          }}
                        >
                          TÚ
                        </span>
                      )}
                    </div>
                    <div className="sub">
                      <span>{m.hits} HITS</span>
                      {m.streak > 0 && (
                        <span style={{ color: "var(--warn)" }}>{m.streak}× RACHA</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pts" style={{ fontSize: 18 }}>
                  {m.pts}
                  <span className={`delta ${deltaCls}`}>{deltaStr}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "20px var(--gutter) 0" }}>
          <div className="section-head" style={{ padding: 0 }}>
            <div className="num">HISTÓRICO</div>
            <div className="title">ÚLTIMAS PREDICCIONES</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 12,
            }}
          >
            {finishedMatches.map((m) => {
              const kind = classifyResult(m);
              const cfg = kind ? RESULT_CONFIG[kind] : null;
              return (
                <div
                  key={m.id}
                  className="card"
                  style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}
                >
                  <div style={{ display: "flex", gap: 4 }}>
                    <TeamFlag team={m.home} size="xs" />
                    <TeamFlag team={m.away} size="xs" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="t-h3" style={{ fontSize: 13 }}>
                      {m.home.code} {m.score?.[0]}–{m.score?.[1]} {m.away.code}
                    </div>
                    <div className="t-meta">
                      TU: {m.myPred?.[0]}–{m.myPred?.[1]} · {m.stage}
                    </div>
                  </div>
                  {cfg && (
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: cfg.bg,
                        color: cfg.color,
                        fontFamily: "var(--font-jetbrains, monospace)",
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cfg.label}
                    </span>
                  )}
                  <div
                    style={{
                      fontFamily: "var(--font-inter, sans-serif)",
                      fontWeight: 900,
                      fontSize: 18,
                      color:
                        (m.pts ?? 0) > 3
                          ? "var(--signal)"
                          : (m.pts ?? 0) > 0
                            ? "var(--warn)"
                            : "var(--fg-faint)",
                      minWidth: 28,
                      textAlign: "right",
                    }}
                  >
                    {(m.pts ?? 0) > 0 ? `+${m.pts}` : "0"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ height: 96 }} />
      </div>
    </div>
  );
}
