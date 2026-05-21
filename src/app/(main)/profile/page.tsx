import Link from "next/link";
import { Avi } from "@/components/ui/avi";
import { GameIcon } from "@/components/ui/game-icon";
import { GamePill } from "@/components/ui/game-pill";
import { TeamFlag } from "@/components/ui/team-flag";
import { BADGES, FEED_MATCHES, MEMBERS, type FeedMatch } from "@/lib/tournament-data";

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

export default function ProfilePage() {
  const me = MEMBERS.find((m) => m.me)!;
  const finishedMatches = FEED_MATCHES.filter((m) => m.state === "final");

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

        <div style={{ padding: "20px 20px 0" }}>
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
        <div style={{ height: 100 }} />
      </div>
    </div>
  );
}
