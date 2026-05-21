"use client";

import { useState } from "react";
import { GameIcon } from "@/components/ui/game-icon";
import { TeamFlag } from "@/components/ui/team-flag";
import type { FeedMatch } from "@/lib/tournament-data";
import { useAppStore } from "@/store/app-store";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from "@/components/ui/responsive-dialog";

function PredictorInner({ match }: { match: FeedMatch }) {
  const { closePredictor, savePrediction, showToast } = useAppStore();
  const [home, setHome] = useState(match.myPred?.[0] ?? 1);
  const [away, setAway] = useState(match.myPred?.[1] ?? 1);
  const [submitting, setSubmitting] = useState(false);

  const locked = match.state !== "pending";

  if (locked) {
    return (
      <div style={{ paddingBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 18px 4px",
          }}
        >
          <div className="t-eyebrow" style={{ color: "var(--danger)" }}>
            BLOQUEADA · {match.stage}
          </div>
          <button
            className="icon-btn"
            onClick={closePredictor}
            style={{ width: 32, height: 32 }}
          >
            <GameIcon name="close" size={14} />
          </button>
        </div>
        <div
          style={{
            padding: "20px 24px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              background: "rgba(255,61,113,0.12)",
              border: "1px solid rgba(255,61,113,0.3)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <GameIcon name="lock" size={32} color="var(--danger)" />
          </div>
          <div className="t-h2" style={{ fontSize: 26 }}>
            Predicciones cerradas
          </div>
          <div className="t-body" style={{ maxWidth: 280 }}>
            {match.state === "live"
              ? "El partido está en curso. No puedes agregar ni modificar tu predicción mientras el evento se juega."
              : "Este partido ya finalizó. Las predicciones se cerraron al kickoff."}
          </div>
          <div
            className="card"
            style={{
              marginTop: 8,
              width: "100%",
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <TeamFlag team={match.home} size="sm" />
            <div style={{ flex: 1 }}>
              <div className="t-meta">TU PRED</div>
              <div className="t-h3" style={{ fontSize: 16 }}>
                {match.myPred
                  ? `${match.myPred[0]} · ${match.myPred[1]}`
                  : "SIN PREDICCIÓN"}
              </div>
            </div>
            <TeamFlag team={match.away} size="sm" />
          </div>
        </div>
        <div style={{ padding: "16px 20px 0" }}>
          <button
            className="btn btn-ghost btn-block"
            onClick={closePredictor}
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const quickPicks = [
    { label: "1 · 0", h: 1, a: 0 },
    { label: "2 · 1", h: 2, a: 1 },
    { label: "1 · 1", h: 1, a: 1 },
    { label: "2 · 0", h: 2, a: 0 },
    { label: "0 · 1", h: 0, a: 1 },
    { label: "0 · 0", h: 0, a: 0 },
    { label: "3 · 1", h: 3, a: 1 },
    { label: "1 · 2", h: 1, a: 2 },
  ];

  let outcome = "EMPATE";
  let outcomeColor = "var(--fg-mute)";
  if (home > away) {
    outcome = `GANA ${match.home.code}`;
    outcomeColor = match.home.c1;
  } else if (away > home) {
    outcome = `GANA ${match.away.code}`;
    outcomeColor = match.away.c1;
  }

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      savePrediction(match.id, [home, away]);
      showToast({
        message: `✓ ${match.home.code} ${home}–${away} ${match.away.code} guardado`,
        type: "success",
      });
    }, 350);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 18px 4px",
        }}
      >
        <div className="t-eyebrow">PREDICCIÓN · {match.stage}</div>
        <button
          className="icon-btn"
          onClick={closePredictor}
          style={{ width: 32, height: 32 }}
        >
          <GameIcon name="close" size={14} />
        </button>
      </div>

      <div
        style={{
          padding: "16px 20px 8px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TeamFlag team={match.home} size="lg" />
          <div className="t-h3" style={{ fontSize: 16, textAlign: "center" }}>
            {match.home.name}
          </div>
          <div className="score-stepper">
            <div
              className="num"
              style={{ color: home > away ? "var(--signal)" : "var(--fg)" }}
            >
              {home}
            </div>
            <div className="stepper-controls">
              <button onClick={() => setHome(Math.max(0, home - 1))}>−</button>
              <button onClick={() => setHome(home + 1)}>+</button>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div className="t-meta">VS</div>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              background:
                outcomeColor === "var(--fg-mute)"
                  ? "rgba(255,255,255,0.05)"
                  : `${outcomeColor}26`,
              color: outcomeColor,
              fontFamily: "var(--mono)",
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {outcome}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TeamFlag team={match.away} size="lg" />
          <div className="t-h3" style={{ fontSize: 16, textAlign: "center" }}>
            {match.away.name}
          </div>
          <div className="score-stepper">
            <div
              className="num"
              style={{ color: away > home ? "var(--signal)" : "var(--fg)" }}
            >
              {away}
            </div>
            <div className="stepper-controls">
              <button onClick={() => setAway(Math.max(0, away - 1))}>−</button>
              <button onClick={() => setAway(away + 1)}>+</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 0 8px" }}>
        <div className="section-head" style={{ padding: "0 20px 8px" }}>
          <div className="num">QUICK PICK</div>
          <div className="title">RESULTADOS COMUNES</div>
        </div>
        <div className="quick-row">
          {quickPicks.map((q) => (
            <button
              key={q.label}
              className={`quick-chip ${q.h === home && q.a === away ? "on" : ""}`}
              onClick={() => {
                setHome(q.h);
                setAway(q.a);
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "8px 20px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          className="card"
          style={{
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <GameIcon name="info" size={16} color="var(--warn)" />
          <div
            className="t-meta"
            style={{
              color: "var(--fg-dim)",
              letterSpacing: "0.04em",
              textTransform: "none",
              fontSize: 11,
            }}
          >
            <b style={{ color: "var(--warn)" }}>+5 pts</b> exacto ·{" "}
            <b style={{ color: "var(--signal)" }}>+3</b> diferencia ·{" "}
            <b>+1</b> ganador
          </div>
        </div>
        <div
          className="card"
          style={{
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderColor: "rgba(255,214,10,0.3)",
            background:
              "linear-gradient(90deg, rgba(255,214,10,0.06), transparent)",
          }}
        >
          <GameIcon name="fire" size={16} color="var(--warn)" />
          <div
            className="t-meta"
            style={{
              color: "var(--fg-dim)",
              letterSpacing: "0.04em",
              textTransform: "none",
              fontSize: 11,
            }}
          >
            Tu racha actual: <b style={{ color: "var(--warn)" }}>3×</b> →
            bonus <b style={{ color: "var(--warn)" }}>+3 pts</b> si acertas
            (máx +5)
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 20px 24px" }}>
        <button
          className="btn btn-primary btn-block"
          onClick={submit}
          disabled={submitting}
          style={{ background: submitting ? "var(--signal-dim)" : undefined }}
        >
          {submitting ? (
            "BLOQUEANDO…"
          ) : (
            <>
              BLOQUEAR PREDICCIÓN <span className="arrow">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function PredictorOverlay() {
  const { predictorMatch, closePredictor } = useAppStore();

  return (
    <ResponsiveDialog
      open={!!predictorMatch}
      onOpenChange={(open) => { if (!open) closePredictor(); }}
    >
      <ResponsiveDialogContent showCloseButton={false}>
        {predictorMatch && (
          <PredictorInner key={predictorMatch.id} match={predictorMatch} />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
