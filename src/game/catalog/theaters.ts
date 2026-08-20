import { assetUrl } from "@/lib/assets";
import type { SideId, SiteTypeId, TheaterId } from "./ids";

export interface SiteBlueprint {
  key: string;
  typeId: SiteTypeId;
  side: SideId;
  lon: number;
  lat: number;
  name: string;
}

export interface SiteSlot {
  key: string;
  side: SideId;
  lon: number;
  lat: number;
  name: string;
}

export interface Theater {
  id: TheaterId;
  name: string;
  region: string;
  blurb: string;
  mapSrc: string;
  attribution: string;
  sites: SiteBlueprint[];
  slots: SiteSlot[];
}

/** WGS84 from bake-geo-maps.py SITES (plus slot towns). */
const LL: Record<string, readonly [number, number]> = {
  kyiv: [30.5234, 50.4501],
  kharkiv: [36.2304, 49.9935],
  dnipro: [35.0462, 48.4647],
  zaporizhzhia: [35.1396, 47.8388],
  odesa: [30.7233, 46.4825],
  poltava: [34.5514, 49.5883],
  mykolaiv: [31.9946, 46.975],
  kramatorsk: [37.5839, 48.7389],
  sumy: [34.7981, 50.9077],
  chernihiv: [31.2893, 51.4982],
  belgorod: [36.5873, 50.5977],
  kursk: [36.1874, 51.7304],
  voronezh: [39.2006, 51.672],
  rostov: [39.7015, 47.2357],
  taganrog: [38.9354, 47.2362],
  shebekino: [36.87, 50.41],
  valuyki: [38.11, 50.21],
  millerovo: [40.4, 48.92],
  novocherkassk: [40.1, 47.42],
  chuhuiv: [36.688, 49.835],
  izium: [37.257, 49.209],
  kupyansk: [37.617, 49.71],
  lyptsi: [36.366, 50.206],
  grayvoron: [35.666, 50.477],
  "stary-oskol": [37.835, 51.297],
  pavlohrad: [35.87, 48.534],
  pokrovsk: [37.176, 48.282],
  huliaipole: [36.256, 47.664],
  sloviansk: [37.625, 48.853],
  kamensk: [40.268, 48.321],
  shakhty: [40.206, 47.709],
  aksai: [39.866, 47.26],
  moscow: [37.6173, 55.7558],
  spb: [30.3351, 59.9343],
  kazan: [49.1221, 55.7887],
  nizhny: [44.0056, 56.3269],
  samara: [50.1002, 53.1959],
  volgograd: [44.5133, 48.708],
  ekaterinburg: [60.6122, 56.8519],
  krasnodar: [38.9769, 45.0355],
  tula: [37.6178, 54.193],
  bryansk: [34.3717, 53.2434],
  engels: [46.1258, 51.4853],
  kaliningrad: [20.4522, 54.7104],
  lviv: [24.0297, 49.8397],
  vinnytsia: [28.4682, 49.2331],
  sochi: [39.7231, 43.5996],
};

function s(key: string, typeId: SiteTypeId, side: SideId, name: string): SiteBlueprint {
  const [lon, lat] = LL[key]!;
  return { key, typeId, side, lon, lat, name };
}

function slot(key: string, side: SideId, name: string): SiteSlot {
  const [lon, lat] = LL[key]!;
  return { key, side, lon, lat, name };
}

const ATTR = "Natural Earth 50m · LoC Aug 2026 (approx.) · internationally recognized borders";

export const THEATERS: Record<TheaterId, Theater> = {
  depth: {
    id: "depth",
    name: "Strategic depth",
    region: "Ukraine — European Russia",
    blurb:
      "Kyiv vs Moscow. Geran / Liutyi reach the capital; FPV does not. North of the LoC is Russia (St. Petersburg, Urals). Kaliningrad is an east exclave. Pacific Russia is off-map.",
    mapSrc: assetUrl("/game/maps/depth.jpg"),
    attribution: ATTR,
    sites: [
      s("kyiv", "hq", "west", "Kyiv"),
      s("lviv", "factory", "west", "Lviv"),
      s("dnipro", "airfield", "west", "Dnipro"),
      s("kharkiv", "ammo", "west", "Kharkiv"),
      s("odesa", "fuel", "west", "Odesa"),
      s("moscow", "hq", "east", "Moscow"),
      s("rostov", "airfield", "east", "Rostov-on-Don"),
      s("voronezh", "factory", "east", "Voronezh"),
      s("engels", "ammo", "east", "Engels"),
      s("belgorod", "refinery", "east", "Belgorod"),
    ],
    slots: [
      slot("zaporizhzhia", "west", "Zaporizhzhia"),
      slot("sumy", "west", "Sumy"),
      slot("chernihiv", "west", "Chernihiv"),
      slot("mykolaiv", "west", "Mykolaiv"),
      slot("poltava", "west", "Poltava"),
      slot("vinnytsia", "west", "Vinnytsia"),
      slot("spb", "east", "St. Petersburg"),
      slot("kazan", "east", "Kazan"),
      slot("volgograd", "east", "Volgograd"),
      slot("krasnodar", "east", "Krasnodar"),
      slot("kursk", "east", "Kursk"),
      slot("ekaterinburg", "east", "Yekaterinburg"),
      slot("tula", "east", "Tula"),
      slot("samara", "east", "Samara"),
      slot("kaliningrad", "east", "Kaliningrad"),
      slot("sochi", "east", "Sochi"),
    ],
  },
  front: {
    id: "front",
    name: "Full theater",
    region: "Ukraine — Russia",
    blurb:
      "Place yards, ПВО and РЭБ on your side of the cream LoC. FPV cannot reach across from Kyiv — push a pad to the line, or send Geran / Liutyi.",
    mapSrc: assetUrl("/game/maps/front.jpg"),
    attribution: ATTR,
    sites: [
      s("kyiv", "hq", "west", "Kyiv"),
      s("kharkiv", "factory", "west", "Kharkiv"),
      s("dnipro", "airfield", "west", "Dnipro"),
      s("poltava", "ammo", "west", "Poltava"),
      s("rostov", "hq", "east", "Rostov-on-Don"),
      s("belgorod", "factory", "east", "Belgorod"),
      s("taganrog", "airfield", "east", "Taganrog"),
      s("millerovo", "ammo", "east", "Millerovo"),
    ],
    slots: [
      slot("zaporizhzhia", "west", "Zaporizhzhia"),
      slot("odesa", "west", "Odesa"),
      slot("mykolaiv", "west", "Mykolaiv"),
      slot("kramatorsk", "west", "Kramatorsk"),
      slot("sumy", "west", "Sumy"),
      slot("chernihiv", "west", "Chernihiv"),
      slot("kursk", "east", "Kursk"),
      slot("voronezh", "east", "Voronezh"),
      slot("valuyki", "east", "Valuyki"),
      slot("novocherkassk", "east", "Novocherkassk"),
      slot("shebekino", "east", "Shebekino"),
    ],
  },
  north: {
    id: "north",
    name: "Kharkiv — Belgorod",
    region: "Northern belt",
    blurb: "Kharkiv–Sumy vs Belgorod–Kursk. Short hop: FPV from HQ reaches the other side.",
    mapSrc: assetUrl("/game/maps/north.jpg"),
    attribution: ATTR,
    sites: [
      s("kharkiv", "hq", "west", "Kharkiv"),
      s("sumy", "factory", "west", "Sumy"),
      s("chuhuiv", "airfield", "west", "Chuhuiv"),
      s("belgorod", "hq", "east", "Belgorod"),
      s("shebekino", "factory", "east", "Shebekino"),
      s("valuyki", "airfield", "east", "Valuyki"),
    ],
    slots: [
      slot("poltava", "west", "Poltava"),
      slot("izium", "west", "Izium"),
      slot("kupyansk", "west", "Kupiansk"),
      slot("lyptsi", "west", "Lyptsi"),
      slot("grayvoron", "east", "Grayvoron"),
      slot("kursk", "east", "Kursk"),
      slot("voronezh", "east", "Voronezh"),
      slot("stary-oskol", "east", "Stary Oskol"),
    ],
  },
  south: {
    id: "south",
    name: "Donbas — Azov",
    region: "Southern belt",
    blurb: "Long hop. Geran from Dnipro reaches Rostov; FPV needs a pad on the LoC.",
    mapSrc: assetUrl("/game/maps/south.jpg"),
    attribution: ATTR,
    sites: [
      s("dnipro", "hq", "west", "Dnipro"),
      s("zaporizhzhia", "factory", "west", "Zaporizhzhia"),
      s("kramatorsk", "airfield", "west", "Kramatorsk"),
      s("rostov", "hq", "east", "Rostov-on-Don"),
      s("taganrog", "factory", "east", "Taganrog"),
      s("novocherkassk", "airfield", "east", "Novocherkassk"),
    ],
    slots: [
      slot("pavlohrad", "west", "Pavlohrad"),
      slot("pokrovsk", "west", "Pokrovsk"),
      slot("huliaipole", "west", "Huliaipole"),
      slot("sloviansk", "west", "Sloviansk"),
      slot("millerovo", "east", "Millerovo"),
      slot("kamensk", "east", "Kamensk-Shakhtinsky"),
      slot("shakhty", "east", "Shakhty"),
      slot("aksai", "east", "Aksai"),
    ],
  },
};

export const THEATER_ORDER: TheaterId[] = ["depth", "front", "north", "south"];
