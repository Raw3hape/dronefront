import { AuthSlot } from "@/components/auth/auth-slot";
import { Button } from "@/components/ui/button";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  FACTIONS,
  THEATER_ORDER,
  THEATERS,
} from "@/game/catalog";
import { useSession } from "@/game/session/store";
import { unlockAudio } from "@/game/audio/engine";
import { loadRuns } from "@/game/save/persist";
import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";

export function TitleScreen() {
  const theaterId = useSession((s) => s.theaterId);
  const playerSide = useSession((s) => s.playerSide);
  const difficultyId = useSession((s) => s.difficultyId);
  const setTheater = useSession((s) => s.setTheater);
  const setSide = useSession((s) => s.setSide);
  const setDiff = useSession((s) => s.setDiff);
  const theater = THEATERS[theaterId];
  const runs = useMemo(() => loadRuns().slice(0, 4), []);

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-bg text-fg">
      <img
        src={theater.mapSrc}
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-linear-to-b from-bg/80 via-bg/78 to-bg" />
      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-5 pb-16 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <p className="font-mono text-2xs tracking-[0.22em] text-muted uppercase">Ops desk</p>
          <AuthSlot />
        </header>

        <div className="mt-8 max-w-xl sm:mt-12">
          <p className="font-mono text-2xs tracking-[0.28em] text-muted uppercase">Ukraine / Russia</p>
          <h1 className="font-display mt-1 text-5xl font-semibold tracking-[-0.04em] text-fg sm:text-7xl">
            DRONEFRONT
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            Guard the HQ with ПВО, then strike. FPV needs a pad on the LoC; Geran / Liutyi fly the long way.
          </p>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5 rounded-xl border border-border bg-elevated/85 p-4 sm:p-5">
            <Field label="Theater">
              <div className="grid grid-cols-3 gap-2">
                {THEATER_ORDER.map((id) => {
                  const t = THEATERS[id];
                  const on = id === theaterId;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTheater(id)}
                      className={`min-h-11 overflow-hidden rounded-md border text-left transition-colors duration-(--motion-quick) ${
                        on ? "border-border-strong bg-surface text-fg" : "border-border text-muted hover:text-fg"
                      }`}
                    >
                      <img src={t.mapSrc} alt="" className="aspect-video w-full object-cover" />
                      <span className="block px-2 py-2 text-xs font-medium leading-tight sm:text-sm">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
            <p className="text-sm leading-relaxed text-muted lg:hidden">{theater.blurb}</p>
            <Field label="Command">
              <div className="grid grid-cols-2 gap-2">
                {(["west", "east"] as const).map((id) => {
                  const f = FACTIONS[id];
                  const on = id === playerSide;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSide(id)}
                      className={`flex min-h-11 items-stretch gap-3 overflow-hidden rounded-md border text-left transition-colors duration-(--motion-quick) ${
                        on ? "border-border-strong bg-surface text-fg" : "border-border text-muted hover:text-fg"
                      }`}
                    >
                      <span className={`w-1.5 ${id === "west" ? "bg-ua" : "bg-ru"}`} />
                      <span className="flex flex-col justify-center py-2 pr-3">
                        <span className="text-sm font-medium">{f.name}</span>
                        <span className="text-2xs text-muted">{f.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Pressure">
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_ORDER.map((id) => {
                  const d = DIFFICULTIES[id];
                  const on = id === difficultyId;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDiff(id)}
                      className={`min-h-11 rounded-md border text-center text-sm transition-colors duration-(--motion-quick) ${
                        on ? "border-border-strong bg-surface text-fg" : "border-border text-muted hover:text-fg"
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Button asChild size="lg" className="w-full font-display text-lg tracking-[0.16em] uppercase">
              <Link
                to="/play"
                search={{ t: theaterId, s: playerSide, d: difficultyId }}
                onClick={() => unlockAudio()}
              >
                Deploy
              </Link>
            </Button>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="hidden overflow-hidden rounded-xl border border-border bg-elevated/85 lg:block">
              <img src={theater.mapSrc} alt="" className="aspect-video w-full object-cover" />
              <div className="p-4">
                <p className="font-mono text-2xs tracking-[0.18em] text-subtle uppercase">{theater.region}</p>
                <h2 className="font-display mt-1 text-xl">{theater.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{theater.blurb}</p>
              </div>
            </div>
            <div className={`rounded-xl border border-border bg-elevated/85 p-4 ${runs.length === 0 ? "max-lg:hidden" : ""}`}>
              <h2 className="font-display text-lg">Last sorties</h2>
              {runs.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No runs on this desk yet.</p>
              ) : (
                <ul className="mt-2">
                  {runs.map((r, i) => (
                    <li
                      key={`${r.at}-${i}`}
                      className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"
                    >
                      <span className="text-muted">
                        {THEATERS[r.theaterId]?.name ?? r.theaterId} · {FACTIONS[r.side]?.short}
                      </span>
                      <span className={r.won ? "text-ok" : "text-danger"}>{r.won ? "Win" : "Lost"}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 font-mono text-micro leading-relaxed text-subtle">
                1–8 drones · B fortify · Q package · Space pause
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-2xs tracking-[0.18em] text-subtle uppercase">{label}</p>
      {children}
    </div>
  );
}
