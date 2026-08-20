import { Hud } from "@/components/game/hud";
import { LaunchDock } from "@/components/game/launch-dock";
import { ResultScreen } from "@/components/game/result-screen";
import { Button } from "@/components/ui/button";
import { THEATERS } from "@/game/catalog";
import type { DifficultyId, SideId, TheaterId } from "@/game/catalog/ids";
import { startGame, type Handle } from "@/game/render/canvas-app";
import { setMuted, unlockAudio } from "@/game/audio/engine";
import { useSession } from "@/game/session/store";
import { saveRun } from "@/lib/ops/scores";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export function GameView(props: {
  theaterId: TheaterId;
  playerSide: SideId;
  difficultyId: DifficultyId;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handle, setHandle] = useState<Handle | null>(null);
  const [tick, setTick] = useState(0);
  const ui = useSession((s) => s.ui);
  const result = useSession((s) => s.result);
  const muted = useSession((s) => s.muted);
  const setUi = useSession((s) => s.setUi);
  const theater = THEATERS[props.theaterId];

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    useSession.getState().setResult(null);
    useSession.getState().setUi("play");
    useSession.getState().setHud(null);
    useSession.getState().setDockTab("sortie");
    const h = startGame(canvas, {
      theaterId: props.theaterId,
      playerSide: props.playerSide,
      difficultyId: props.difficultyId,
    });
    setHandle(h);
    return () => {
      h.destroy();
      setHandle(null);
    };
  }, [props.theaterId, props.playerSide, props.difficultyId, tick]);

  useEffect(() => {
    if (!result || !handle) return;
    const world = handle.world;
    void saveRun({
      data: {
        theaterId: world.theaterId,
        difficultyId: world.difficultyId,
        side: world.playerSide,
        won: result === "won",
        durationS: world.time,
        damage: world.stats[world.playerSide].damage,
      },
    }).catch(() => undefined);
  }, [result, handle]);

  function pause(): void {
    const world = handle?.world;
    if (!world || world.phase !== "play") return;
    world.phase = "paused";
    setUi("paused");
  }
  function resume(): void {
    const world = handle?.world;
    if (!world) return;
    if (world.phase === "paused") world.phase = "play";
    setUi("play");
    unlockAudio();
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full touch-none"
        style={{ touchAction: "none" }}
      />
      <Hud onPause={pause} />
      {ui === "play" && !result ? <LaunchDock handle={handle} /> : null}
      {ui === "paused" && !result ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-bg/70 px-4 backdrop-blur-sm">
          <div className="panel-in w-full max-w-sm rounded-xl border border-border bg-elevated p-6">
            <p className="font-mono text-2xs tracking-[0.18em] text-subtle uppercase">{theater.region}</p>
            <h2 className="font-display mt-1 text-3xl">Paused</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{theater.blurb}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={resume}>Resume</Button>
              <Button asChild variant="outline">
                <Link to="/">Abort</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <ResultScreen onRematch={() => setTick((n) => n + 1)} />
    </div>
  );
}
