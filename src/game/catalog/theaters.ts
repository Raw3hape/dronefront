import { assetUrl } from "@/lib/assets";
import type { SideId, SiteTypeId, TheaterId } from "./ids";

export interface SiteBlueprint {
  key: string;
  typeId: SiteTypeId;
  side: SideId;
  x: number;
  y: number;
  name: string;
}

export interface SiteSlot {
  key: string;
  side: SideId;
  x: number;
  y: number;
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

function s(
  key: string,
  typeId: SiteTypeId,
  side: SideId,
  x: number,
  y: number,
  name: string,
): SiteBlueprint {
  return { key, typeId, side, x, y, name };
}

function slot(key: string, side: SideId, x: number, y: number, name: string): SiteSlot {
  return { key, side, x, y, name };
}

const ATTR = "Natural Earth 50m · LoC Aug 2026 (approx.) · internationally recognized borders";

export const THEATERS: Record<TheaterId, Theater> = {
  front: {
    id: "front",
    name: "Full theater",
    region: "Ukraine — Russia",
    blurb:
      "Place yards, ПВО and РЭБ on your side of the cream LoC. FPV cannot reach across from Kyiv — push a pad to the line, or send Geran / Liutyi.",
    mapSrc: assetUrl("/game/maps/front.jpg"),
    attribution: ATTR,
    sites: [
      s("kyiv", "hq", "west", 989, 428, "Kyiv"),
      s("rostov", "hq", "east", 2079, 895, "Rostov-on-Don"),
    ],
    slots: [
      slot("kharkiv", "west", 1667, 495, "Kharkiv"),
      slot("dnipro", "west", 1526, 716, "Dnipro"),
      slot("zaporizhzhia", "west", 1537, 807, "Zaporizhzhia"),
      slot("odesa", "west", 1013, 1004, "Odesa"),
      slot("poltava", "west", 1468, 553, "Poltava"),
      slot("mykolaiv", "west", 1164, 933, "Mykolaiv"),
      slot("kramatorsk", "west", 1828, 677, "Kramatorsk"),
      slot("sumy", "west", 1497, 362, "Sumy"),
      slot("chernihiv", "west", 1080, 276, "Chernihiv"),
      slot("belgorod", "east", 1709, 407, "Belgorod"),
      slot("kursk", "east", 1662, 242, "Kursk"),
      slot("voronezh", "east", 2020, 251, "Voronezh"),
      slot("taganrog", "east", 1988, 895, "Taganrog"),
      slot("millerovo", "east", 2162, 650, "Millerovo"),
      slot("valuyki", "east", 1890, 463, "Valuyki"),
      slot("novocherkassk", "east", 2127, 868, "Novocherkassk"),
      slot("shebekino", "east", 1748, 434, "Shebekino"),
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
      s("kharkiv", "hq", "west", 1226, 850, "Kharkiv"),
      s("belgorod", "hq", "east", 1340, 641, "Belgorod"),
    ],
    slots: [
      slot("sumy", "west", 767, 534, "Sumy"),
      slot("poltava", "west", 688, 991, "Poltava"),
      slot("izium", "west", 1565, 1122, "Izium"),
      slot("kupyansk", "west", 1638, 948, "Kupiansk"),
      slot("chuhuiv", "west", 1372, 905, "Chuhuiv"),
      slot("lyptsi", "west", 1100, 720, "Lyptsi"),
      slot("kursk", "east", 1212, 249, "Kursk"),
      slot("voronezh", "east", 2176, 269, "Voronezh"),
      slot("stary-oskol", "east", 1741, 399, "Stary Oskol"),
      slot("valuyki", "east", 1826, 776, "Valuyki"),
      slot("shebekino", "east", 1444, 706, "Shebekino"),
      slot("grayvoron", "west", 985, 683, "Grayvoron"),
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
      s("dnipro", "hq", "west", 356, 370, "Dnipro"),
      s("rostov", "hq", "east", 1941, 830, "Rostov-on-Don"),
    ],
    slots: [
      slot("zaporizhzhia", "west", 388, 604, "Zaporizhzhia"),
      slot("kramatorsk", "west", 1220, 267, "Kramatorsk"),
      slot("pavlohrad", "west", 637, 344, "Pavlohrad"),
      slot("pokrovsk", "west", 1082, 438, "Pokrovsk"),
      slot("huliaipole", "west", 768, 670, "Huliaipole"),
      slot("sloviansk", "west", 1234, 224, "Sloviansk"),
      slot("taganrog", "east", 1680, 830, "Taganrog"),
      slot("millerovo", "east", 2178, 197, "Millerovo"),
      slot("novocherkassk", "east", 2077, 761, "Novocherkassk"),
      slot("kamensk", "east", 2135, 424, "Kamensk-Shakhtinsky"),
      slot("shakhty", "east", 2114, 653, "Shakhty"),
      slot("aksai", "east", 1855, 713, "Aksai"),
    ],
  },
};

export const THEATER_ORDER: TheaterId[] = ["front", "north", "south"];
