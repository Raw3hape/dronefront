#!/usr/bin/env python3
"""Bake operational maps + share cards from Natural Earth (public domain)."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps

ROOT = Path("/workspace")
GEO = ROOT / "assets/geo"
OUT = ROOT / "public/game/maps"
OUT.mkdir(parents=True, exist_ok=True)
PUBLIC = ROOT / "public"

W, H = 2400, 1350
SCALE = 2
RW, RH = W * SCALE, H * SCALE

THEATERS = {
    "front": {
        "bbox": (22.2, 44.1, 42.4, 53.4),
        "title": "UKRAINE  —  RUSSIA",
        "ua": (31.2, 48.55),
        "ru": (39.6, 50.9),
    },
    "north": {
        "bbox": (32.4, 48.55, 39.9, 52.45),
        "title": "KHARKIV  —  BELGOROD",
        "ua": (34.35, 49.35),
        "ru": (38.15, 51.55),
    },
    "south": {
        "bbox": (34.0, 45.85, 41.05, 49.45),
        "title": "DONBAS  —  AZOV  —  ROSTOV",
        "ua": (35.55, 47.95),
        "ru": (39.55, 47.55),
    },
}

FILL = {
    "UKR": (68, 100, 64, 255),
    "RUS": (118, 74, 62, 255),
    "OTHER": (42, 44, 40, 255),
}
OCEAN = (16, 26, 32, 255)
FLOOD = (56, 88, 58, 110)
LAKE = (52, 92, 102, 255)
LAKE_EDGE = (70, 118, 122, 200)
RIVER = (70, 112, 124, 255)
GRID = (230, 228, 216, 22)
UA_STROKE = (236, 232, 214, 255)
RU_STROKE = (210, 164, 148, 200)
OTHER_STROKE = (88, 90, 84, 160)
LOC_HALO = (12, 13, 11, 200)
LOC_CREAM = (236, 220, 168, 245)
LOC_DASH = (196, 92, 74, 200)

SITES = [
    ("kyiv", 30.5234, 50.4501, "Kyiv"),
    ("kharkiv", 36.2304, 49.9935, "Kharkiv"),
    ("dnipro", 35.0462, 48.4647, "Dnipro"),
    ("zaporizhzhia", 35.1396, 47.8388, "Zaporizhzhia"),
    ("odesa", 30.7233, 46.4825, "Odesa"),
    ("poltava", 34.5514, 49.5883, "Poltava"),
    ("mykolaiv", 31.9946, 46.9750, "Mykolaiv"),
    ("kramatorsk", 37.5839, 48.7389, "Kramatorsk"),
    ("sumy", 34.7981, 50.9077, "Sumy"),
    ("chernihiv", 31.2893, 51.4982, "Chernihiv"),
    ("belgorod", 36.5873, 50.5977, "Belgorod"),
    ("kursk", 36.1874, 51.7304, "Kursk"),
    ("voronezh", 39.2006, 51.6720, "Voronezh"),
    ("rostov", 39.7015, 47.2357, "Rostov"),
    ("taganrog", 38.9354, 47.2362, "Taganrog"),
    ("lviv", 24.0297, 49.8397, "Lviv"),
    ("shebekino", 36.87, 50.41, "Shebekino"),
    ("valuyki", 38.11, 50.21, "Valuyki"),
    ("millerovo", 40.40, 48.92, "Millerovo"),
    ("novocherkassk", 40.10, 47.42, "Novocherkassk"),
    ("chuhuiv", 36.688, 49.835, "Chuhuiv"),
]

# keep in sync with catalog/frontline.ts
LOC_LL = [
    (35.15, 53.55), (35.12, 52.8), (35.1, 52.2), (35.08, 51.7),
    (35.02, 51.45), (35.18, 51.3), (35.38, 51.22), (35.5, 51.18),
    (35.4, 51.1), (35.22, 50.98), (35.45, 50.85), (35.7, 50.72),
    (36.0, 50.58), (36.3, 50.45), (36.6, 50.35), (36.85, 50.3),
    (36.95, 50.26), (37.12, 50.12), (37.35, 49.95), (37.52, 49.82),
    (37.65, 49.72), (37.72, 49.58), (37.76, 49.4), (37.78, 49.22),
    (37.8, 49.05), (37.81, 48.99), (37.95, 48.92), (38.1, 48.87),
    (38.02, 48.78), (37.88, 48.66), (37.84, 48.59), (37.74, 48.53),
    (37.55, 48.45), (37.38, 48.38), (37.22, 48.32), (37.12, 48.28),
    (37.08, 48.18), (37.15, 48.08), (37.26, 47.99), (37.22, 47.88),
    (37.05, 47.8), (36.8, 47.74), (36.5, 47.7), (36.28, 47.66),
    (36.1, 47.62), (35.92, 47.58), (35.8, 47.56), (35.55, 47.52),
    (35.25, 47.5), (34.9, 47.46), (34.55, 47.38), (34.2, 47.22),
    (33.85, 47.05), (33.5, 46.9), (33.15, 46.75), (32.85, 46.65),
    (32.62, 46.58), (32.35, 46.48), (32.05, 46.38), (31.8, 46.28),
    (31.6, 46.1), (31.52, 45.7), (31.5, 45.2), (31.5, 44.5), (31.5, 43.9),
]


def project(lon, lat, bbox, w, h):
    west, south, east, north = bbox
    x = (lon - west) / (east - west) * w
    y = (north - lat) / (north - south) * h
    return x, y


def rings(geom):
    t = geom["type"]
    if t == "Polygon":
        return geom["coordinates"]
    if t == "MultiPolygon":
        out = []
        for poly in geom["coordinates"]:
            out.extend(poly)
        return out
    return []


def lines(geom):
    t = geom["type"]
    if t == "LineString":
        return [geom["coordinates"]]
    if t == "MultiLineString":
        return geom["coordinates"]
    return []


def draw_poly(draw, ring, bbox, fill, outline, width):
    pts = [project(p[0], p[1], bbox, RW, RH) for p in ring]
    if len(pts) < 3:
        return
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    if max(xs) < -20 or min(xs) > RW + 20 or max(ys) < -20 or min(ys) > RH + 20:
        return
    draw.polygon(pts, fill=fill, outline=None)
    if outline and width:
        draw.line(pts + [pts[0]], fill=outline, width=width)


def clip_seg(a, b, w, h):
    t0, t1 = 0.0, 1.0
    dx, dy = b[0] - a[0], b[1] - a[1]
    p = (-dx, dx, -dy, dy)
    q = (a[0], w - a[0], a[1], h - a[1])
    for pi, qi in zip(p, q):
        if pi == 0:
            if qi < 0:
                return None
            continue
        t = qi / pi
        if pi < 0:
            t0 = max(t0, t)
        else:
            t1 = min(t1, t)
        if t0 > t1:
            return None
    return (a[0] + t0 * dx, a[1] + t0 * dy), (a[0] + t1 * dx, a[1] + t1 * dy)


def clip_poly(pts, w, h):
    out = []
    for a, b in zip(pts, pts[1:]):
        hit = clip_seg(a, b, w, h)
        if not hit:
            continue
        if not out or abs(out[-1][0] - hit[0][0]) + abs(out[-1][1] - hit[0][1]) > 0.8:
            out.append(hit[0])
        out.append(hit[1])
    return out


def halo_text(draw, xy, text, font, fill, stroke, anchor="mm"):
    draw.text(xy, text, font=font, fill=fill, anchor=anchor, stroke_width=max(2, font.size // 18), stroke_fill=stroke)


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def grain(img: Image.Image) -> Image.Image:
    noise = Image.effect_noise(img.size, 18).convert("L")
    noise = ImageOps.autocontrast(noise, cutoff=1)
    overlay = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(img.convert("RGB"), overlay, 0.05)


def draw_rivers(draw, rivers, bbox, fill, major_w, minor_w):
    for ft in rivers:
        name = (ft["properties"].get("name") or "") + " " + (ft["properties"].get("name_en") or "")
        for line in lines(ft["geometry"]):
            pts = [project(p[0], p[1], bbox, RW, RH) for p in line]
            if not pts:
                continue
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            if max(xs) < 0 or min(xs) > RW or max(ys) < 0 or min(ys) > RH:
                continue
            width = major_w if any(k in name for k in ("Dnipro", "Don", "Danube", "Dniester")) else minor_w
            draw.line(pts, fill=fill, width=width)


def draw_loc(draw, bbox):
    raw = [project(lon, lat, bbox, RW, RH) for lon, lat in LOC_LL]
    pts = clip_poly(raw, RW, RH)
    if len(pts) < 2:
        return
    draw.line(pts, fill=LOC_HALO, width=14)
    draw.line(pts, fill=LOC_CREAM, width=6)
    draw.line(pts, fill=LOC_DASH, width=2)


def draw_cities(draw, bbox, font_city):
    for _key, lon, lat, label in SITES:
        x, y = project(lon, lat, bbox, RW, RH)
        if x < 28 or x > RW - 28 or y < 28 or y > RH - 28:
            continue
        r = 7 * SCALE
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(236, 232, 214, 255), outline=(18, 20, 16, 220), width=2)
        halo_text(draw, (x + 12 * SCALE, y), label, font_city, (230, 228, 216, 235), (12, 13, 11, 180), "lm")


def main() -> None:
    countries = json.loads((GEO / "countries.geojson").read_text())["features"]
    rivers = json.loads((GEO / "rivers.geojson").read_text())["features"]
    lakes = json.loads((GEO / "lakes.geojson").read_text())["features"]
    by_iso = {}
    others = []
    for ft in countries:
        iso = ft["properties"].get("ADM0_A3")
        if iso in ("UKR", "RUS"):
            by_iso[iso] = ft
        elif iso in ("BLR", "POL", "ROU", "MDA", "SVK", "HUN", "GEO", "TUR", "KAZ"):
            others.append(ft)

    display = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    body = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    font_lg = font(display, 46 * SCALE)
    font_title = font(display, 22 * SCALE)
    font_sm = font(body, 16 * SCALE)
    font_city = font(body, 14 * SCALE)

    baked = {}
    for tid, spec in THEATERS.items():
        bbox = spec["bbox"]
        img = Image.new("RGBA", (RW, RH), OCEAN)
        draw = ImageDraw.Draw(img, "RGBA")

        west, south, east, north = bbox
        lon = int(west) - 1
        while lon <= east + 1:
            x0, y0 = project(lon, south, bbox, RW, RH)
            x1, y1 = project(lon, north, bbox, RW, RH)
            draw.line([(x0, y0), (x1, y1)], fill=GRID, width=1)
            lon += 2
        lat = int(south) - 1
        while lat <= north + 1:
            x0, y0 = project(west, lat, bbox, RW, RH)
            x1, y1 = project(east, lat, bbox, RW, RH)
            draw.line([(x0, y0), (x1, y1)], fill=GRID, width=1)
            lat += 1

        for ft in others:
            for ring in rings(ft["geometry"]):
                draw_poly(draw, ring, bbox, FILL["OTHER"], OTHER_STROKE, 2)
        for ring in rings(by_iso["RUS"]["geometry"]):
            draw_poly(draw, ring, bbox, FILL["RUS"], RU_STROKE, 4)
        for ring in rings(by_iso["UKR"]["geometry"]):
            draw_poly(draw, ring, bbox, FILL["UKR"], UA_STROKE, 8)

        draw_rivers(draw, rivers, bbox, FLOOD, 22, 8)
        for ft in lakes:
            for ring in rings(ft["geometry"]):
                draw_poly(draw, ring, bbox, LAKE, LAKE_EDGE, 3)
        draw_rivers(draw, rivers, bbox, RIVER, 6, 3)

        ua = project(*spec["ua"], bbox, RW, RH)
        ru = project(*spec["ru"], bbox, RW, RH)
        halo_text(draw, ua, "UKRAINE", font_lg, (226, 232, 214, 230), (18, 22, 18, 180))
        halo_text(draw, ru, "RUSSIA", font_lg, (236, 210, 198, 230), (28, 16, 14, 180))

        draw_loc(draw, bbox)
        draw_cities(draw, bbox, font_city)

        halo_text(draw, (48 * SCALE, 44 * SCALE), spec["title"], font_title, (230, 228, 216, 220), (12, 13, 11, 160), "lt")
        halo_text(
            draw,
            (48 * SCALE, RH - 56 * SCALE),
            "Natural Earth 50m  ·  public domain  ·  LoC Aug 2026 (approx.)",
            font_sm,
            (176, 174, 164, 200),
            (12, 13, 11, 140),
            "lt",
        )

        lx, ly = RW - 420 * SCALE, 40 * SCALE
        draw.rounded_rectangle((lx, ly, lx + 380 * SCALE, ly + 128 * SCALE), radius=16, fill=(12, 13, 11, 150))
        draw.rectangle((lx + 18 * SCALE, ly + 22 * SCALE, lx + 48 * SCALE, ly + 42 * SCALE), fill=FILL["UKR"][:3])
        draw.rectangle((lx + 18 * SCALE, ly + 54 * SCALE, lx + 48 * SCALE, ly + 74 * SCALE), fill=FILL["RUS"][:3])
        draw.line(
            [(lx + 18 * SCALE, ly + 100 * SCALE), (lx + 48 * SCALE, ly + 100 * SCALE)],
            fill=LOC_CREAM[:3],
            width=4,
        )
        halo_text(draw, (lx + 62 * SCALE, ly + 32 * SCALE), "Ukraine", font_sm, (226, 232, 214, 230), (12, 13, 11, 120), "lm")
        halo_text(draw, (lx + 62 * SCALE, ly + 64 * SCALE), "Russia", font_sm, (236, 210, 198, 230), (12, 13, 11, 120), "lm")
        halo_text(draw, (lx + 62 * SCALE, ly + 100 * SCALE), "LoC Aug 2026", font_sm, (236, 220, 168, 230), (12, 13, 11, 120), "lm")

        img = img.resize((W, H), Image.Resampling.LANCZOS)
        rgb = Image.new("RGB", (W, H), (16, 26, 32))
        rgb.paste(img, mask=img.split()[-1])
        rgb = grain(rgb)
        rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
        dest = OUT / f"{tid}.jpg"
        rgb.save(dest, quality=86, optimize=True, subsampling=1)
        baked[tid] = rgb
        print("wrote", dest, dest.stat().st_size // 1024, "KB")

    front = baked["front"]
    card = Image.new("RGB", (1600, 840), (12, 13, 11))
    cover = ImageOps.fit(front, (1600, 840), Image.Resampling.LANCZOS)
    cover = ImageEnhance.Brightness(cover).enhance(0.55)
    card.paste(cover, (0, 0))
    shade = Image.new("RGBA", card.size, (12, 13, 11, 0))
    sd = ImageDraw.Draw(shade)
    for i in range(220):
        a = int(170 * (i / 220))
        sd.rectangle((0, 840 - 220 + i, 1600, 840 - 219 + i), fill=(12, 13, 11, a))
    card = Image.alpha_composite(card.convert("RGBA"), shade).convert("RGB")
    cd = ImageDraw.Draw(card)
    big = font(display, 96)
    sub = font(body, 28)
    halo_text(cd, (800, 390), "DRONEFRONT", big, (230, 228, 216, 255), (12, 13, 11, 220))
    halo_text(cd, (800, 480), "Ukraine  /  Russia   ·   command the border", sub, (176, 174, 164, 255), (12, 13, 11, 180))
    card = card.resize((1200, 630), Image.Resampling.LANCZOS)
    card.save(PUBLIC / "og.jpg", quality=86, optimize=True)
    print("og", (PUBLIC / "og.jpg").stat().st_size // 1024, "KB")

    banner = Image.new("RGB", (1600, 352), (12, 13, 11))
    bcover = ImageOps.fit(front, (1600, 352), Image.Resampling.LANCZOS, centering=(0.35, 0.42))
    bcover = ImageEnhance.Brightness(bcover).enhance(0.5)
    banner.paste(bcover)
    bd = ImageDraw.Draw(banner)
    halo_text(bd, (64, 118), "DRONEFRONT", font(display, 64), (230, 228, 216, 255), (12, 13, 11, 220), "lm")
    halo_text(bd, (64, 188), "Ukraine / Russia", font(body, 24), (176, 174, 164, 255), (12, 13, 11, 180), "lm")
    banner = banner.resize((1200, 264), Image.Resampling.LANCZOS)
    banner.save(PUBLIC / "x-banner.jpg", quality=86, optimize=True)
    print("banner", (PUBLIC / "x-banner.jpg").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
