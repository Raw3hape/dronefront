import { DRONE_ORDER, DRONE_TYPES, SITE_TYPES, canAfford } from "@/game/catalog";
import { useSession } from "@/game/session/store";
import type { Handle } from "@/game/render/canvas-app";
import type { World } from "@/game/sim/types";
import { OTHER_SIDE } from "@/game/catalog/factions";
import { assetUrl } from "@/lib/assets";

export function LaunchDock({ handle }: { handle: Handle | null }) {
  const selected = useSession((s) => s.selected);
  const setSelected = useSession((s) => s.setSelected);
  const packageMode = useSession((s) => s.packageMode);
  const togglePackage = useSession((s) => s.togglePackage);
  const hud = useSession((s) => s.hud);
  const world = handle?.world as World | undefined;
  const enemy = world ? OTHER_SIDE[world.playerSide] : "east";
  const stocks = hud?.stocks;
  const sites = world?.sites.filter((s) => s.side === enemy && s.alive) ?? [];

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-bg/90 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <div className="flex gap-2 overflow-x-auto px-3 pt-2">
        {sites.map((site) => (
          <button
            key={site.id}
            type="button"
            onClick={() => handle?.launchAt(site.id)}
            className="min-h-11 shrink-0 rounded-sm border border-border px-2.5 py-1.5 text-left hover:border-border-strong hover:text-fg"
          >
            <span className="block text-xs font-medium text-fg">{site.name}</span>
            <span className="font-mono text-micro text-subtle">{SITE_TYPES[site.typeId].name}</span>
          </button>
        ))}
      </div>
      <div className="flex items-stretch gap-2 overflow-x-auto px-3 py-2">
        {DRONE_ORDER.map((id) => {
          const t = DRONE_TYPES[id];
          const on = selected === id;
          const ok = stocks ? canAfford(stocks, t.cost) : true;
          return (
            <button
              key={id}
              type="button"
              disabled={!ok}
              onClick={() => setSelected(id)}
              className={`flex min-h-11 min-w-28 shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors duration-(--motion-quick) ${
                on ? "border-border-strong bg-surface text-fg" : "border-border text-muted"
              } disabled:opacity-35`}
            >
              <img src={assetUrl(`/game/sprites/drones/${id}.png`)} alt="" className="size-8 shrink-0 object-contain" />
              <span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="font-mono text-micro">{t.hotkey}</span>
                </span>
                <span className="block text-micro text-subtle">{t.callsign}</span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={togglePackage}
          className={`min-h-11 min-w-24 shrink-0 rounded-md border px-3 py-1.5 text-left text-sm transition-colors duration-(--motion-quick) ${
            packageMode ? "border-border-strong bg-surface text-fg" : "border-border text-muted"
          }`}
        >
          Package
          <span className="mt-0.5 block font-mono text-micro">{packageMode ? "ON · Q" : "off · Q"}</span>
        </button>
      </div>
      <p className="hidden px-3 pb-1 font-mono text-micro text-subtle sm:block">
        {selected ? DRONE_TYPES[selected].blurb : "Select a drone"} · tap a city across the border
      </p>
    </div>
  );
}
