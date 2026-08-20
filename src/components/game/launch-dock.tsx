import {
  BUILD_ORDER,
  DRONE_ORDER,
  DRONE_TYPES,
  SITE_TYPES,
  canAfford,
  droneName,
  rangeKm,
} from "@/game/catalog";
import { useSession } from "@/game/session/store";
import type { Handle } from "@/game/render/canvas-app";
import type { World } from "@/game/sim/types";
import { siteInRange } from "@/game/sim/range";
import { OTHER_SIDE } from "@/game/catalog/factions";
import { assetUrl } from "@/lib/assets";

export function LaunchDock({ handle }: { handle: Handle | null }) {
  const selected = useSession((s) => s.selected);
  const setSelected = useSession((s) => s.setSelected);
  const buildType = useSession((s) => s.buildType);
  const setBuildType = useSession((s) => s.setBuildType);
  const dockTab = useSession((s) => s.dockTab);
  const setDockTab = useSession((s) => s.setDockTab);
  const packageMode = useSession((s) => s.packageMode);
  const togglePackage = useSession((s) => s.togglePackage);
  const hud = useSession((s) => s.hud);
  const playerSide = useSession((s) => s.playerSide);
  const world = handle?.world as World | undefined;
  const enemy = world ? OTHER_SIDE[world.playerSide] : "east";
  const stocks = hud?.stocks;
  const sites = world?.sites.filter((s) => s.side === enemy && s.alive) ?? [];
  const sortie = dockTab === "sortie";
  const hunt = Boolean(selected && DRONE_TYPES[selected].role === "intercept");
  const reachCount =
    world && selected && !hunt ? sites.filter((s) => siteInRange(world, world.playerSide, selected, s.id)).length : 0;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 border-t border-border bg-bg/90 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <div className="flex gap-1 px-3 pt-2">
        <Tab on={sortie} onClick={() => setDockTab("sortie")} label="Sortie" hint="1–8" />
        <Tab on={!sortie} onClick={() => setDockTab("fortify")} label="Fortify" hint="B · ПВО / РЭБ" />
      </div>
      {sortie ? (
        <div className="flex gap-2 overflow-x-auto px-3 pt-2">
          {hunt ? (
            <p className="py-2 font-mono text-micro text-subtle">Tap an inbound drone — or tap the map to hunt the nearest.</p>
          ) : (
            <>
              {sites.map((site) => {
                const reach = world && selected ? siteInRange(world, world.playerSide, selected, site.id) : true;
                return (
                  <button
                    key={site.id}
                    type="button"
                    disabled={!reach}
                    onClick={() => handle?.launchAt(site.id)}
                    className="min-h-11 shrink-0 rounded-sm border border-border px-2.5 py-1.5 text-left hover:border-border-strong hover:text-fg disabled:opacity-35"
                  >
                    <span className="block text-xs font-medium text-fg">{site.name}</span>
                    <span className="font-mono text-micro text-subtle">
                      {reach ? SITE_TYPES[site.typeId].name : "out of range"}
                    </span>
                  </button>
                );
              })}
              {sites.length === 0 ? (
                <p className="py-2 font-mono text-micro text-subtle">No enemy yards yet — they will fortify.</p>
              ) : null}
              {sites.length > 0 && selected && reachCount === 0 ? (
                <p className="py-2 font-mono text-micro text-subtle">
                  No reach from your pads. Fortify an airfield toward the LoC.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      <div className="flex flex-nowrap items-stretch gap-2 overflow-x-auto overscroll-x-contain px-3 py-2">
        {sortie
          ? DRONE_ORDER.map((id) => {
              const t = DRONE_TYPES[id];
              const on = selected === id;
              const ok = stocks ? canAfford(stocks, t.cost) : true;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!ok}
                  onClick={() => setSelected(id)}
                  className={`flex min-h-11 min-w-32 shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors duration-(--motion-quick) ${
                    on ? "border-border-strong bg-surface text-fg" : "border-border text-muted"
                  } disabled:opacity-35`}
                >
                  <img
                    src={assetUrl(`/game/sprites/drones/${t.sprite}.png`)}
                    alt=""
                    className="size-8 shrink-0 object-contain"
                  />
                  <span>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">{droneName(id, playerSide)}</span>
                      <span className="font-mono text-micro">{t.hotkey}</span>
                    </span>
                    <span className="block font-mono text-micro text-subtle">
                      {t.callsign} · {rangeKm(t.range)} km
                    </span>
                  </span>
                </button>
              );
            })
          : BUILD_ORDER.map((id) => {
              const t = SITE_TYPES[id];
              const on = buildType === id;
              const ok = stocks ? canAfford(stocks, t.build) : true;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!ok}
                  onClick={() => setBuildType(id)}
                  className={`flex min-h-11 min-w-28 shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors duration-(--motion-quick) ${
                    on ? "border-border-strong bg-surface text-fg" : "border-border text-muted"
                  } disabled:opacity-35`}
                >
                  <img
                    src={assetUrl(`/game/sprites/sites/${t.sprite}.png`)}
                    alt=""
                    className="size-8 shrink-0 object-contain"
                  />
                  <span>
                    <span className="text-sm font-medium">{t.name}</span>
                    <span className="block font-mono text-micro text-subtle">
                      {t.isAa ? `${rangeKm(t.aaRange)} km` : `${t.build.parts}p ${t.build.electronics}c`}
                    </span>
                  </span>
                </button>
              );
            })}
        {sortie ? (
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
        ) : null}
      </div>
      <p className="hidden px-3 pb-1 font-mono text-micro text-subtle sm:block">
        {sortie
          ? selected
            ? `${DRONE_TYPES[selected].blurb} · ${rangeKm(DRONE_TYPES[selected].range)} km from nearest pad`
            : "Select a drone"
          : buildType
            ? `${SITE_TYPES[buildType].blurb} · Tap your ПВО to relocate`
            : "Tap your ПВО to relocate"}
      </p>
    </div>
  );
}

function Tab({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 flex-1 rounded-md border px-3 text-sm ${
        on ? "border-border-strong bg-surface text-fg" : "border-border text-muted"
      }`}
    >
      {label}
      <span className="ml-2 font-mono text-micro text-subtle">{hint}</span>
    </button>
  );
}
