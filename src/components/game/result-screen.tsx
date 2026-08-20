import { Button } from "@/components/ui/button";
import { FACTIONS } from "@/game/catalog";
import { useSession } from "@/game/session/store";
import { Link } from "@tanstack/react-router";

export function ResultScreen({ onRematch }: { onRematch: () => void }) {
  const result = useSession((s) => s.result);
  const hud = useSession((s) => s.hud);
  const side = useSession((s) => s.playerSide);
  if (!result) return null;
  const won = result === "won";
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-bg/70 px-4 backdrop-blur-sm">
      <div className="panel-in w-full max-w-md rounded-xl border border-border bg-elevated p-6 text-center">
        <p className="font-mono text-2xs tracking-[0.2em] text-muted uppercase">{FACTIONS[side].name}</p>
        <h2 className={`font-display mt-2 text-4xl ${won ? "text-ok" : "text-danger"}`}>
          {won ? "Line broken" : "Command lost"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {won ? "Enemy HQ is down. Their grid goes dark." : "Your HQ is gone. Place ПВО next time — then push."}
        </p>
        {hud && (
          <p className="mt-4 font-mono text-xs tabular-nums text-muted">
            Launched {hud.stats.launched} · Kills {hud.stats.killed} · Lost {hud.stats.lost} · Damage{" "}
            {Math.round(hud.stats.damage)}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={onRematch}>
            Rematch
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/">Desk</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
