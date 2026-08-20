import { FACTIONS, STOCK_LABEL, STOCK_ORDER } from "@/game/catalog";
import { useSession } from "@/game/session/store";
import { Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

function clock(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Hud({ onPause }: { onPause: () => void }) {
  const hud = useSession((s) => s.hud);
  const muted = useSession((s) => s.muted);
  const toggleMute = useSession((s) => s.toggleMute);
  const playerSide = useSession((s) => s.playerSide);
  if (!hud) return null;
  const me = FACTIONS[playerSide];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto max-w-[min(calc(100%-5.5rem),36rem)] rounded-sm border border-border bg-bg/92 px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`font-mono text-2xs tracking-[0.18em] uppercase ${playerSide === "west" ? "text-ua" : "text-ru"}`}>
            {me.short}
          </span>
          <span className="font-mono text-sm tabular-nums">{clock(hud.time)}</span>
          <span className="font-mono text-2xs tracking-[0.14em] text-subtle uppercase">Yards</span>
          <span className="font-mono text-xs tabular-nums text-muted">
            {hud.ownStrategic}/{hud.ownTotal}
          </span>
          <span className={`font-mono text-xs tabular-nums ${hud.ownHq < 0.4 ? "text-danger" : "text-muted"}`}>
            HQ {Math.round(hud.ownHq * 100)}%
          </span>
          <span className="text-xs text-danger">
            {hud.enemyTotal > 0 ? `Enemy ${hud.enemyStrategic}/${hud.enemyTotal}` : "Enemy fog"}
          </span>
          {hud.enemyHq >= 0 ? (
            <span className="font-mono text-xs tabular-nums text-subtle">{Math.round(hud.enemyHq * 100)}%</span>
          ) : (
            <span className="font-mono text-xs tabular-nums text-subtle">—</span>
          )}
          <span className="font-mono text-2xs tracking-[0.14em] text-subtle uppercase">Cnt</span>
          <span className="font-mono text-xs tabular-nums text-muted">{hud.inbound}</span>
          <span className="font-mono text-2xs tracking-[0.14em] text-subtle uppercase">Air</span>
          <span className="font-mono text-xs tabular-nums text-muted">{hud.airborne}</span>
        </div>
        <div className="mt-1 flex flex-nowrap gap-x-3 overflow-x-auto font-mono text-micro tabular-nums text-subtle">
          {STOCK_ORDER.map((id) => (
            <span key={id}>
              {STOCK_LABEL[id]} {Math.floor(hud.stocks[id])}
            </span>
          ))}
        </div>
      </div>
      <div className="pointer-events-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleMute} aria-label="Mute">
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={onPause} aria-label="Pause">
          <Pause className="size-4" />
        </Button>
      </div>
    </div>
  );
}
