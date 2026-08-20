import type { SiteTypeId, StockId } from "./ids";
import type { StockCost } from "./drones";

export interface SiteType {
  id: SiteTypeId;
  name: string;
  blurb: string;
  hp: number;
  strategic: boolean;
  isAa: boolean;
  isEw: boolean;
  isAirfield: boolean;
  placeable: boolean;
  radius: number;
  drawSize: number;
  sprite: string;
  produce: Partial<Record<StockId, number>>;
  build: StockCost;
  aaRange: number;
  aaRate: number;
  aaDamage: number;
  aaSpeed: number;
  ewRange: number;
  ewSlow: number;
  ewJam: number;
  mobile: boolean;
  relocateSpeed: number;
  value: number;
}

function zero(): StockCost {
  return { parts: 0, fuel: 0, warheads: 0, electronics: 0 };
}

const QUIET: Pick<
  SiteType,
  "aaRange" | "aaRate" | "aaDamage" | "aaSpeed" | "ewRange" | "ewSlow" | "ewJam" | "mobile" | "relocateSpeed"
> = {
  aaRange: 0, aaRate: 0, aaDamage: 0, aaSpeed: 0,
  ewRange: 0, ewSlow: 0, ewJam: 0, mobile: false, relocateSpeed: 0,
};

type Spec = Omit<SiteType, keyof typeof QUIET> & Partial<typeof QUIET>;
function def(s: Spec): SiteType {
  return { ...QUIET, ...s };
}

function yard(
  id: SiteTypeId, name: string, blurb: string, hp: number, radius: number, drawSize: number,
  produce: SiteType["produce"], build: StockCost, value: number, extra: Partial<SiteType> = {},
): SiteType {
  return def({
    id, name, blurb, hp, radius, drawSize, produce, build, value,
    sprite: extra.sprite ?? id, strategic: extra.strategic ?? true, isAa: false,
    isEw: extra.isEw ?? false, isAirfield: extra.isAirfield ?? false, placeable: extra.placeable ?? true,
    ...extra,
  });
}

function battery(
  id: SiteTypeId, name: string, blurb: string, hp: number,
  aaRange: number, aaRate: number, aaDamage: number, aaSpeed: number,
  build: StockCost, mobile: boolean, relocateSpeed: number, value: number,
  extra: Partial<SiteType> = {},
): SiteType {
  return def({
    id, name, blurb, hp, build, mobile, relocateSpeed, value,
    sprite: extra.sprite ?? id, strategic: false, isAa: true, isEw: false, isAirfield: false,
    placeable: true, produce: {}, radius: extra.radius ?? 32, drawSize: extra.drawSize ?? 58,
    aaRange, aaRate, aaDamage, aaSpeed, ...extra,
  });
}

export const SITE_TYPES: Record<SiteTypeId, SiteType> = {
  hq: yard("hq", "Command", "Command. If it dies, the match is over. Guard it with ПВО.", 220, 42, 78, {
    electronics: 1.4, parts: 1.8, fuel: 1.2, warheads: 0.55,
  }, zero(), 1.3, { placeable: false, isAirfield: true }),
  factory: yard("factory", "Factory", "Airframes and parts.", 210, 40, 76, { parts: 5.0 }, {
    parts: 36, fuel: 4, warheads: 0, electronics: 6,
  }, 1.2),
  refinery: yard("refinery", "Refinery", "Fuel for the long hops.", 195, 40, 74, { fuel: 4.2 }, {
    parts: 28, fuel: 2, warheads: 0, electronics: 4,
  }, 1.15),
  power: yard("power", "Power", "Keeps radars and lines alive.", 185, 40, 74, { electronics: 2.2, parts: 0.6 }, {
    parts: 26, fuel: 4, warheads: 0, electronics: 8,
  }, 1.1),
  airfield: yard("airfield", "Airfield", "Launch pad. Range is measured from here, not from HQ.", 200, 44, 80, {
    parts: 0.8,
  }, { parts: 30, fuel: 8, warheads: 0, electronics: 4 }, 1.05, { isAirfield: true }),
  ammo: yard("ammo", "Magazine", "Warheads and charges.", 175, 36, 68, { warheads: 2.8 }, {
    parts: 22, fuel: 2, warheads: 4, electronics: 2,
  }, 1),
  fuel: yard("fuel", "Fuel farm", "Tank farm. Soft, valuable.", 155, 36, 66, { fuel: 2.1 }, {
    parts: 18, fuel: 2, warheads: 0, electronics: 2,
  }, 0.95),
  rail: yard("rail", "Rail yard", "Logistics spine. Feeds everything slowly.", 190, 40, 74, {
    parts: 1.4, warheads: 0.6, fuel: 0.5,
  }, { parts: 28, fuel: 4, warheads: 2, electronics: 4 }, 0.9),
  mog: battery("mog", "МОГ", "Mobile fire group vs FPV. Cheap guns — relocate onto the approach.", 95, 85, 2.4, 7, 280, {
    parts: 10, fuel: 2, warheads: 4, electronics: 4,
  }, true, 92, 0.5, { radius: 26, drawSize: 48 }),
  shorad: battery("shorad", "SHORAD", "Pantsir / Gepard class. Guns and missiles for the mid ring.", 125, 150, 1.6, 10, 360, {
    parts: 14, fuel: 3, warheads: 6, electronics: 7,
  }, true, 54, 0.62, { radius: 30, drawSize: 54 }),
  aa: battery("aa", "ПВО", "Medium SAM. Place on the approach, not only on HQ. Relocate to hold a Geran salvo.", 150, 240, 1.05, 13, 440, {
    parts: 18, fuel: 4, warheads: 8, electronics: 10,
  }, true, 26, 0.75),
  longsam: battery("longsam", "Long SAM", "Patriot / S-300 class. Fixed site. Covers the deep rear.", 170, 400, 0.52, 22, 520, {
    parts: 34, fuel: 8, warheads: 16, electronics: 20,
  }, false, 0, 0.88, { radius: 38, drawSize: 66 }),
  ew: yard("ew", "РЭБ", "Jammer. Slows and drops radio FPV. Fiber walks through it.", 135, 30, 56, {}, {
    parts: 14, fuel: 4, warheads: 0, electronics: 16,
  }, 0.8, { strategic: false, isEw: true, ewRange: 190, ewSlow: 0.52, ewJam: 0.28 }),
};

export const BUILD_ORDER: SiteTypeId[] = [
  "mog", "shorad", "aa", "longsam", "ew", "factory", "airfield", "refinery", "ammo", "fuel", "power", "rail",
];
