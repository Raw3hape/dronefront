import type { SideId, SiteTypeId, TheaterId } from "./ids";

export interface SiteBlueprint {
  key: string;
  typeId: SiteTypeId;
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

const ATTR = "Natural Earth 50m · public domain · internationally recognized borders";

export const THEATERS: Record<TheaterId, Theater> = {
  front: {
    id: "front",
    name: "Full theater",
    region: "Ukraine — Russia",
    blurb:
      "All of Ukraine and the Russian border oblasts. Sites sit on real cities. The cream line is the internationally recognized state border (Natural Earth).",
    mapSrc: "/game/maps/front.jpg",
    attribution: ATTR,
    sites: [
      s("kyiv", "hq", "west", 989, 428, "Kyiv"),
      s("kharkiv", "factory", "west", 1667, 495, "Kharkiv"),
      s("dnipro", "rail", "west", 1526, 716, "Dnipro"),
      s("zaporizhzhia", "power", "west", 1537, 807, "Zaporizhzhia"),
      s("odesa", "fuel", "west", 1013, 1004, "Odesa"),
      s("poltava", "ammo", "west", 1468, 553, "Poltava"),
      s("mykolaiv", "airfield", "west", 1164, 933, "Mykolaiv"),
      s("kramatorsk", "airfield", "west", 1828, 677, "Kramatorsk"),
      s("sumy", "aa", "west", 1497, 362, "Sumy"),
      s("chernihiv", "aa", "west", 1080, 276, "Chernihiv"),
      s("izium", "aa", "west", 1793, 608, "Izium"),
      s("rostov", "hq", "east", 2079, 895, "Rostov-on-Don"),
      s("belgorod", "factory", "east", 1709, 407, "Belgorod"),
      s("kursk", "rail", "east", 1662, 242, "Kursk"),
      s("voronezh", "factory", "east", 2020, 251, "Voronezh"),
      s("taganrog", "airfield", "east", 1988, 895, "Taganrog"),
      s("millerovo", "airfield", "east", 2162, 650, "Millerovo"),
      s("valuyki", "ammo", "east", 1890, 463, "Valuyki"),
      s("novocherkassk", "fuel", "east", 2127, 868, "Novocherkassk"),
      s("shebekino", "aa", "east", 1748, 434, "Shebekino"),
      s("grayvoron", "aa", "east", 1578, 424, "Grayvoron"),
      s("aksai", "aa", "east", 2050, 849, "Aksai"),
    ],
  },
  north: {
    id: "north",
    name: "Kharkiv — Belgorod",
    region: "Northern border",
    blurb:
      "Zoom on the Kharkiv–Sumy–Belgorod–Kursk belt. The state border cuts the map; drones cross it on a heading, batteries sit on both sides.",
    mapSrc: "/game/maps/north.jpg",
    attribution: ATTR,
    sites: [
      s("kharkiv", "hq", "west", 1226, 850, "Kharkiv"),
      s("sumy", "factory", "west", 767, 534, "Sumy"),
      s("poltava", "ammo", "west", 688, 991, "Poltava"),
      s("izium", "airfield", "west", 1565, 1122, "Izium"),
      s("kupyansk", "rail", "west", 1664, 948, "Kupiansk"),
      s("chuhuiv", "fuel", "west", 1372, 905, "Chuhuiv"),
      s("ua-aa-n", "aa", "west", 1100, 720, "Lyptsi"),
      s("ua-aa-e", "aa", "west", 1480, 780, "Vovchansk"),
      s("belgorod", "hq", "east", 1340, 641, "Belgorod"),
      s("kursk", "rail", "east", 1212, 249, "Kursk"),
      s("voronezh", "factory", "east", 2176, 269, "Voronezh"),
      s("stary-oskol", "factory", "east", 1741, 399, "Stary Oskol"),
      s("valuyki", "ammo", "east", 1826, 776, "Valuyki"),
      s("tomarovka", "airfield", "east", 1312, 675, "Tomarovka"),
      s("shebekino", "aa", "east", 1444, 706, "Shebekino"),
      s("grayvoron", "aa", "east", 985, 683, "Grayvoron"),
    ],
  },
  south: {
    id: "south",
    name: "Donbas — Azov",
    region: "Southern belt",
    blurb:
      "Donets basin, the Azov coast, Rostov. Olive is Ukraine, rust is Russia. Sea of Azov is the dark water to the south.",
    mapSrc: "/game/maps/south.jpg",
    attribution: ATTR,
    sites: [
      s("dnipro", "hq", "west", 356, 370, "Dnipro"),
      s("zaporizhzhia", "power", "west", 388, 604, "Zaporizhzhia"),
      s("kramatorsk", "factory", "west", 1220, 267, "Kramatorsk"),
      s("pavlohrad", "ammo", "west", 637, 344, "Pavlohrad"),
      s("pokrovsk", "rail", "west", 1082, 438, "Pokrovsk"),
      s("huliaipole", "airfield", "west", 768, 670, "Huliaipole"),
      s("sloviansk", "aa", "west", 1234, 224, "Sloviansk"),
      s("izium", "aa", "west", 1121, 90, "Izium"),
      s("rostov", "hq", "east", 1941, 830, "Rostov-on-Don"),
      s("taganrog", "airfield", "east", 1680, 830, "Taganrog"),
      s("millerovo", "airfield", "east", 2178, 197, "Millerovo"),
      s("novocherkassk", "fuel", "east", 2077, 761, "Novocherkassk"),
      s("kamensk", "ammo", "east", 2135, 424, "Kamensk-Shakhtinsky"),
      s("shakhty", "factory", "east", 2114, 653, "Shakhty"),
      s("aksai", "aa", "east", 1855, 713, "Aksai"),
      s("ru-aa-n", "aa", "east", 2000, 380, "Millerovo guns"),
    ],
  },
};

export const THEATER_ORDER: TheaterId[] = ["front", "north", "south"];
