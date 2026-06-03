"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import { GameIcon } from "@/components/ui/game-icon";
import { TeamFlag } from "@/components/ui/team-flag";
import { DKTopbar } from "@/components/layout/dk-topbar";
import {
  BRACKET,
  type BracketSlot,
  type OracleTeam,
  ROUND_LABELS,
} from "@/lib/oracle-data";

// ─── Types ─────────────────────────────────────────────────────────────────

type Phase = "groups" | "bracket";
type GroupPick = { first: string | null; second: string | null };

// ─── Bracket propagation helpers ───────────────────────────────────────────

const ROUNDS = ["r32", "r16", "qf", "sf", "f"] as const;
const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

/** Propagate a winner code forward through the bracket tree, cascading clears. */
function propagatePick(
  bracket: Record<string, BracketSlot[]>,
  round: string,
  slotIdx: number,
  teamCode: string | null,
): Record<string, BracketSlot[]> {
  const roundIdx = ROUNDS.indexOf(round as (typeof ROUNDS)[number]);
  if (roundIdx < 0 || roundIdx >= ROUNDS.length - 1) return bracket;

  const nextRound = ROUNDS[roundIdx + 1];
  const nextSlotIdx = Math.floor(slotIdx / 2);
  const isTop = slotIdx % 2 === 0;

  const nextSlot = bracket[nextRound][nextSlotIdx];
  const oldVal = isTop ? nextSlot.top : nextSlot.bot;
  if (oldVal === teamCode) return bracket;

  const updatedNextSlot: BracketSlot = {
    ...nextSlot,
    [isTop ? "top" : "bot"]: teamCode,
    picked: nextSlot.picked === oldVal ? null : nextSlot.picked,
  };

  const next = {
    ...bracket,
    [nextRound]: bracket[nextRound].map((s, i) =>
      i === nextSlotIdx ? updatedNextSlot : s,
    ),
  };

  // Cascade if the pick in the next slot referenced the old value
  if (nextSlot.picked === oldVal && nextSlot.picked !== null) {
    return propagatePick(next, nextRound, nextSlotIdx, null);
  }
  return next;
}

/** Toggle a bracket pick and propagate the winner to the next round. */
function applyToggle(
  prev: Record<string, BracketSlot[]>,
  round: string,
  slotId: string,
  teamCode: string,
): Record<string, BracketSlot[]> {
  const slotIdx = prev[round].findIndex((s) => s.id === slotId);
  const slot = prev[round][slotIdx];
  const newPicked = slot.picked === teamCode ? null : teamCode;

  const withToggle = {
    ...prev,
    [round]: prev[round].map((s, i) =>
      i === slotIdx ? { ...s, picked: newPicked } : s,
    ),
  };

  return propagatePick(withToggle, round, slotIdx, newPicked);
}

interface Line { d: string; active: boolean }

// ─── Main page ──────────────────────────────────────────────────────────────

export default function OraclePage() {
  const [phase, setPhase] = useState<Phase>("groups");
  const [teams, setTeams] = useState<Record<string, OracleTeam>>({});
  const [groupPicks, setGroupPicks] = useState<Record<string, GroupPick>>({});
  const [bracket, setBracket] = useState<Record<string, BracketSlot[]>>(BRACKET);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);

  // ── Derived lookups ──────────────────────────────────────────────────────

  const teamByCode = useMemo(() => {
    const m: Record<string, OracleTeam> = {};
    Object.values(teams).forEach((t) => { m[t.code] = t; });
    return m;
  }, [teams]);

  const groupedTeams = useMemo(() => {
    const g: Record<string, OracleTeam[]> = {};
    Object.values(teams).forEach((t) => {
      if (!g[t.group]) g[t.group] = [];
      g[t.group].push(t);
    });
    GROUP_LETTERS.forEach((l) => {
      if (g[l]) g[l].sort((a, b) => a.seed - b.seed);
    });
    return g;
  }, [teams]);

  /**
   * Resolve a slot key to a team:
   * - 'A1' / 'B2' → look up in groupPicks
   * - direct team code → look up in teamByCode
   */
  const resolveTeam = useCallback(
    (key: string | null): OracleTeam | null => {
      if (!key) return null;
      const m = /^([A-L])([12])$/.exec(key);
      if (m) {
        const pick = groupPicks[m[1]];
        if (!pick) return null;
        const code = m[2] === "1" ? pick.first : pick.second;
        return code ? (teamByCode[code] ?? null) : null;
      }
      return teamByCode[key] ?? null;
    },
    [groupPicks, teamByCode],
  );

  // ── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [teamsRes, picksRes] = await Promise.all([
          fetch("/api/oracle/teams"),
          fetch("/api/oracle/picks"),
        ]);

        if (teamsRes.ok) {
          const dbTeams = await teamsRes.json() as Array<{
            code: string; name: string; c1: string; c2: string; group: string; seed: number;
          }>;
          const record: Record<string, OracleTeam> = {};
          dbTeams.forEach((t) => {
            record[`${t.group}${t.seed}`] = { ...t, key: `${t.group}${t.seed}` };
          });
          setTeams(record);
        }

        if (picksRes.ok) {
          const allPicks = await picksRes.json() as Array<{
            round: string; slotId: string; teamCode: string;
          }>;

          // Bracket picks
          setBracket((prev) => {
            let next = { ...prev };
            for (const [round, slots] of Object.entries(next)) {
              next[round] = slots.map((s) => {
                const pick = allPicks.find((p) => p.round === round && p.slotId === s.id);
                return pick ? { ...s, picked: pick.teamCode } : s;
              });
            }
            return next;
          });

          // Group picks (stored as round='groups', slotId='A-first'/'A-second')
          const gPicks: Record<string, GroupPick> = {};
          for (const p of allPicks.filter((p) => p.round === "groups")) {
            const [group, pos] = p.slotId.split("-");
            if (!gPicks[group]) gPicks[group] = { first: null, second: null };
            if (pos === "first") gPicks[group].first = p.teamCode;
            if (pos === "second") gPicks[group].second = p.teamCode;
          }
          setGroupPicks(gPicks);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleGroupPick = useCallback((group: string, code: string) => {
    setGroupPicks((prev) => {
      const pick = prev[group] ?? { first: null, second: null };
      let newPick: GroupPick;

      if (pick.first === code) {
        // Clear first, promote second
        newPick = { first: pick.second, second: null };
        void fetch("/api/oracle/picks", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ round: "groups", slotId: `${group}-first`, teamCode: pick.second }) });
        void fetch("/api/oracle/picks", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ round: "groups", slotId: `${group}-second`, teamCode: null }) });
      } else if (pick.second === code) {
        // Clear second
        newPick = { ...pick, second: null };
        void fetch("/api/oracle/picks", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ round: "groups", slotId: `${group}-second`, teamCode: null }) });
      } else if (!pick.first) {
        newPick = { ...pick, first: code };
        void fetch("/api/oracle/picks", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ round: "groups", slotId: `${group}-first`, teamCode: code }) });
      } else if (pick.second === null) {
        newPick = { ...pick, second: code };
        void fetch("/api/oracle/picks", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ round: "groups", slotId: `${group}-second`, teamCode: code }) });
      } else {
        return prev; // both slots taken
      }

      return { ...prev, [group]: newPick };
    });
  }, []);

  const handleBracketPick = useCallback((round: string, slotId: string, teamCode: string) => {
    setBracket((prev) => {
      const next = applyToggle(prev, round, slotId, teamCode);
      const newPicked = next[round].find((s) => s.id === slotId)?.picked ?? null;
      void fetch("/api/oracle/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round, slotId, teamCode: newPicked }),
      });
      return next;
    });
  }, []);

  // ── SVG connecting lines (desktop bracket) ────────────────────────────────

  useLayoutEffect(() => {
    if (!trackRef.current || phase !== "bracket") return;
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
        const fromSlot = bracket[rkey][i];
        allLines.push({ d: `M${x1} ${y1} H${midX} V${y2} H${x2}`, active: !!fromSlot?.picked });
      });
    });
    setLines(allLines);
  }, [bracket, phase]);

  // ── Stats ────────────────────────────────────────────────────────────────

  const completedGroups = useMemo(
    () => GROUP_LETTERS.filter((l) => groupPicks[l]?.first && groupPicks[l]?.second).length,
    [groupPicks],
  );

  const bracketPicks = useMemo(() => {
    let n = 0, total = 0;
    Object.values(bracket).forEach((round) => {
      round.forEach((s) => { total++; if (s.picked) n++; });
    });
    return { n, total };
  }, [bracket]);

  const champKey = bracket.f[0]?.picked ?? null;
  const champTeam = champKey ? resolveTeam(champKey) : null;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="screen" style={{ display: "grid", placeItems: "center" }}>
        <div className="t-meta">Cargando Oracle…</div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="screen bracket-stage screen-anim">

      {/* ── Mobile topbar ──────────────────────────────────────────────── */}
      <div className="topbar">
        <div className="oracle-phase-tabs">
          <button className={phase === "groups" ? "active" : ""} onClick={() => setPhase("groups")}>
            Grupos
          </button>
          <button className={phase === "bracket" ? "active" : ""} onClick={() => setPhase("bracket")}>
            Bracket
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div className="topbar-meta">WC 2026</div>
          <div className="topbar-title">ORACLE</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="icon-btn">
            <GameIcon name="share" size={16} />
          </button>
        </div>
      </div>

      {/* ── Desktop topbar + page header ──────────────────────────────── */}
      <DKTopbar crumbs={["ORACLE", phase === "groups" ? "FASE DE GRUPOS" : "BRACKET ELIMINATORIO"]} />
      <div className="dk-page-head">
        <div>
          <div className="sub">WC 2026 · ORACLE</div>
          <div className="title">ORACLE</div>
        </div>
        <div className="actions">
          <div className="oracle-phase-tabs">
            <button className={phase === "groups" ? "active" : ""} onClick={() => setPhase("groups")}>
              {completedGroups}/12 Grupos
            </button>
            <button className={phase === "bracket" ? "active" : ""} onClick={() => setPhase("bracket")}>
              {bracketPicks.n}/{bracketPicks.total} Bracket
            </button>
          </div>
          <div className="dk-tape">CIERRA EN<span>11 JUN · 18:00</span></div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PHASE: GRUPOS
         ══════════════════════════════════════════════════════════════════ */}
      {phase === "groups" && (
        <div className="scroll">
          {/* Mobile progress strip */}
          <div className="md:hidden" style={{ padding: "12px 16px 0" }}>
            <div className="card" style={{
              padding: "10px 14px",
              background: "linear-gradient(90deg, rgba(0,210,106,0.07), transparent)",
              borderColor: "rgba(0,210,106,0.2)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div className="t-eyebrow" style={{ color: "var(--signal)" }}>GRUPOS COMPLETADOS</div>
                <div style={{ fontFamily: "var(--font-inter)", fontWeight: 900, fontSize: 20, letterSpacing: "-0.03em", marginTop: 2 }}>
                  {completedGroups}<span style={{ fontSize: 13, color: "var(--fg-mute)", fontWeight: 700 }}>/12</span>
                </div>
              </div>
              <div style={{ height: 36, width: 80, background: "rgba(255,255,255,0.04)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "var(--signal)", transformOrigin: "left", transform: `scaleX(${completedGroups / 12})`, transition: "transform 0.4s" }} />
              </div>
            </div>
          </div>

          {/* Desktop stats strip */}
          <div className="hidden md:flex" style={{ gap: 12, paddingTop: 20 }}>
            <div className="dk-card" style={{ flex: 1, background: "linear-gradient(135deg, rgba(0,210,106,0.08), transparent 60%), var(--surface)", borderColor: "rgba(0,210,106,0.25)" }}>
              <div className="t-eyebrow" style={{ color: "var(--signal)" }}>GRUPOS COMPLETADOS</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                <span style={{ fontFamily: "var(--font-inter)", fontWeight: 900, fontSize: 44, letterSpacing: "-0.05em", fontVariationSettings: '"wdth" 75' }}>{completedGroups}</span>
                <span style={{ fontFamily: "var(--font-inter)", fontWeight: 800, fontSize: 18, color: "var(--fg-mute)" }}>/12</span>
              </div>
            </div>
            <div className="dk-card" style={{ flex: 1 }}>
              <div className="t-eyebrow">GRUPOS PENDIENTES</div>
              <div style={{ fontFamily: "var(--font-inter)", fontWeight: 900, fontSize: 44, letterSpacing: "-0.05em", fontVariationSettings: '"wdth" 75', marginTop: 6 }}>{12 - completedGroups}</div>
            </div>
            <div className="dk-card" style={{ flex: "0 0 auto", minWidth: 200 }}>
              <div className="t-eyebrow">SIGUIENTE PASO</div>
              <button
                onClick={() => setPhase("bracket")}
                className="dk-btn primary"
                style={{ marginTop: 8, width: "100%" }}
                disabled={completedGroups < 12}
              >
                {completedGroups < 12 ? `Faltan ${12 - completedGroups} grupos` : "→ IR AL BRACKET"}
              </button>
            </div>
          </div>

          {/* Group cards grid */}
          <div className="oracle-group-grid">
            {GROUP_LETTERS.map((letter) => {
              const groupTeams = groupedTeams[letter] ?? [];
              const pick = groupPicks[letter] ?? { first: null, second: null };
              const isDone = !!pick.first && !!pick.second;

              return (
                <div key={letter} className={`oracle-group-card${isDone ? " complete" : ""}`}>
                  <div className="oracle-group-head">
                    <span className="oracle-group-label">GRUPO {letter}</span>
                    {isDone && (
                      <span style={{ fontSize: 9, fontFamily: "var(--font-jetbrains)", letterSpacing: "0.12em", color: "var(--signal)" }}>
                        ✓ LISTO
                      </span>
                    )}
                  </div>

                  {groupTeams.map((team) => {
                    const isFirst = pick.first === team.code;
                    const isSecond = pick.second === team.code;
                    return (
                      <button
                        key={team.code}
                        className={`oracle-team-row${isFirst ? " pick-first" : ""}${isSecond ? " pick-second" : ""}`}
                        onClick={() => handleGroupPick(letter, team.code)}
                      >
                        <TeamFlag team={team} size="xs" />
                        <span className="oracle-team-name">{team.name}</span>
                        {isFirst && <span className="oracle-pick-badge first">1°</span>}
                        {isSecond && <span className="oracle-pick-badge second">2°</span>}
                        {!isFirst && !isSecond && <span className="oracle-pick-empty">—</span>}
                      </button>
                    );
                  })}

                  {/* Pick summary footer */}
                  <div className="oracle-group-picks">
                    {(["first", "second"] as const).map((pos, i) => {
                      const code = pick[pos];
                      const team = code ? teamByCode[code] : null;
                      return (
                        <div key={pos} className="oracle-group-pick-slot">
                          <span className="pos">{i + 1}°</span>
                          {team ? <TeamFlag team={team} size="xs" /> : <div className="empty-slot" />}
                          <span className="code">{team?.code ?? "?"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile CTA to go to bracket */}
          <div className="md:hidden" style={{ padding: "16px 16px 24px" }}>
            <button
              onClick={() => setPhase("bracket")}
              className="btn btn-primary btn-block"
              style={{ opacity: completedGroups < 12 ? 0.5 : 1 }}
            >
              {completedGroups < 12 ? `Faltan ${12 - completedGroups} grupos → Bracket` : "→ IR AL BRACKET"}
            </button>
          </div>

          <div style={{ height: 80 }} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PHASE: BRACKET
         ══════════════════════════════════════════════════════════════════ */}
      {phase === "bracket" && (
        <>
          {/* ── Desktop stats row ──────────────────────────────────────── */}
          <div className="dk-section hidden md:block" style={{ paddingLeft: 32, paddingRight: 32 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.5fr", gap: 12 }}>
              <div className="dk-card" style={{ background: "linear-gradient(135deg, rgba(0,210,106,0.10), transparent 60%), var(--surface)", borderColor: "rgba(0,210,106,0.3)" }}>
                <div className="t-eyebrow" style={{ color: "var(--signal)" }}>PROGRESO BRACKET</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                  <span style={{ fontFamily: "var(--font-inter)", fontWeight: 900, fontSize: 44, letterSpacing: "-0.05em", fontVariationSettings: '"wdth" 75' }}>{bracketPicks.n}</span>
                  <span style={{ fontFamily: "var(--font-inter)", fontWeight: 800, fontSize: 18, color: "var(--fg-mute)" }}>/{bracketPicks.total}</span>
                </div>
                <div className="t-meta" style={{ marginTop: 4 }}>
                  {bracketPicks.total > 0 ? Math.round(bracketPicks.n / bracketPicks.total * 100) : 0}% COMPLETO
                </div>
              </div>
              <div className="dk-card">
                <div className="t-eyebrow">PUNTOS POSIBLES</div>
                <div style={{ fontFamily: "var(--font-inter)", fontWeight: 900, fontSize: 44, letterSpacing: "-0.05em", fontVariationSettings: '"wdth" 75', marginTop: 6, color: "var(--warn)" }}>+178</div>
                <div className="t-meta" style={{ marginTop: 4 }}>BRACKET + CAMPEÓN</div>
              </div>
              <div className="dk-card">
                <div className="t-eyebrow">GRUPOS COMPLETADOS</div>
                <div style={{ fontFamily: "var(--font-inter)", fontWeight: 900, fontSize: 44, letterSpacing: "-0.05em", fontVariationSettings: '"wdth" 75', marginTop: 6 }}>{completedGroups}<span style={{ fontSize: 20, color: "var(--fg-mute)" }}>/12</span></div>
                <button onClick={() => setPhase("groups")} className="t-meta" style={{ marginTop: 4, cursor: "pointer", color: "var(--signal)", background: "none", border: 0 }}>
                  ← Editar grupos
                </button>
              </div>
              <div className="dk-champion">
                {champTeam ? (
                  <>
                    <TeamFlag team={champTeam} size="lg" />
                    <div>
                      <div className="label">★ CAMPEÓN MUNDIAL</div>
                      <div className="name">{champTeam.name.toUpperCase()}</div>
                      <div className="t-meta" style={{ marginTop: 4 }}>+50 PTS SI ACIERTAS</div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="label">★ CAMPEÓN MUNDIAL</div>
                    <div className="name" style={{ color: "var(--fg-mute)" }}>SIN PICK</div>
                    <div className="t-meta" style={{ marginTop: 4 }}>COMPLETÁ EL BRACKET</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Mobile: progress + zoom ────────────────────────────────── */}
          <div className="md:hidden" style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="t-meta">
              {bracketPicks.n}/{bracketPicks.total} PICKS · DESLIZÁ →
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}>−</button>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setZoom(Math.min(1.2, zoom + 0.1))}>+</button>
            </div>
          </div>

          {/* ── Mobile bracket track ───────────────────────────────────── */}
          <div className="scroll md:hidden">
            <div
              className="bracket-track"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}
            >
              {ROUND_LABELS.map((r) => (
                <div key={r.key} className="round-col">
                  <div className="round-head">
                    <span>{r.label}</span>
                    <span className="count">{bracket[r.key].filter((s) => s.picked).length}/{bracket[r.key].length}</span>
                  </div>
                  {bracket[r.key].map((s) => (
                    <div key={s.id} className="bracket-card">
                      {(["top", "bot"] as const).map((side) => {
                        const key = side === "top" ? s.top : s.bot;
                        const team = resolveTeam(key);
                        const picked = s.picked === key && !!key;
                        let teamName = "\u2014";
                        if (team) teamName = team.name;
                        else if (key) teamName = "MEJOR 3\u00b0";
                        return (
                          <div
                            key={side}
                            className={`slot ${picked ? "picked" : ""}`}
                            onClick={() => team && key && handleBracketPick(r.key, s.id, key)}
                            style={{ cursor: team ? "pointer" : "default" }}
                          >
                            <TeamFlag team={team} size="xs" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {teamName}
                              </div>
                              {team && <div className="seed">GR.{team.group} · {team.code}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Mobile champion card */}
            <div style={{ padding: "16px 20px 8px" }}>
              <div className="section-head" style={{ padding: 0 }}>
                <div className="num">CAMPEÓN</div>
                <div className="title">TU PICK FINAL</div>
              </div>
              <div className="card" style={{ marginTop: 10, padding: 18, background: "linear-gradient(135deg, rgba(255,214,10,0.10), transparent 60%), var(--surface)", borderColor: "rgba(255,214,10,0.3)", display: "flex", alignItems: "center", gap: 14 }}>
                {champTeam ? (
                  <>
                    <TeamFlag team={champTeam} size="lg" />
                    <div style={{ flex: 1 }}>
                      <div className="t-eyebrow" style={{ color: "var(--warn)" }}>★ CAMPEÓN MUNDIAL · +50 PTS</div>
                      <div className="t-h2" style={{ fontSize: 26, marginTop: 4 }}>{champTeam.name.toUpperCase()}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1 }}>
                    <div className="t-eyebrow" style={{ color: "var(--warn)" }}>★ CAMPEÓN MUNDIAL · +50 PTS</div>
                    <div className="t-h2" style={{ fontSize: 26, marginTop: 4, color: "var(--fg-mute)" }}>SIN PICK</div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: 100 }} />
          </div>

          {/* ── Desktop bracket with SVG lines ────────────────────────── */}
          <div className="scroll hidden md:block">
            <div ref={trackRef} className="dk-bracket" style={{ position: "relative" }}>
              <svg
                className="dk-bracket-lines"
                preserveAspectRatio="none"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
              >
                {lines.map((l, i) => (
                  <path key={i} d={l.d} className={l.active ? "active" : ""} />
                ))}
              </svg>

              <div className="dk-bracket-grid">
                {ROUND_LABELS.map((r) => (
                  <div key={r.key} className="dk-bracket-col" data-col={r.key}>
                    <div className="dk-bracket-col-head">
                      <div className="name">{r.label.toUpperCase()}</div>
                      <div>{bracket[r.key].filter((s) => s.picked).length}/{bracket[r.key].length}</div>
                    </div>
                    {bracket[r.key].map((s) => (
                      <div key={s.id} className="dk-br-match">
                        {(["top" as const, "bot" as const]).map((side) => {
                          const key = side === "top" ? s.top : s.bot;
                          const team = resolveTeam(key);
                          const picked = s.picked === key && !!key;
                          let teamName = "\u2014";
                          if (team) teamName = team.name;
                          else if (key) teamName = "MEJOR 3\u00b0";
                          return (
                            <div
                              key={side}
                              className={`dk-br-slot ${picked ? "picked" : ""}`}
                              onClick={() => team && key && handleBracketPick(r.key, s.id, key)}
                              style={{ cursor: team ? "pointer" : "default" }}
                            >
                              <TeamFlag team={team} size="xs" />
                              <div style={{ minWidth: 0 }}>
                                <div className="name">{teamName}</div>
                                {team && <div className="seed">GR.{team.group} · {team.code}</div>}
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
        </>
      )}
    </div>
  );
}

