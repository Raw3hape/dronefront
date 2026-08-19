#!/usr/bin/env python3
"""Bake operational maps + share cards from Natural Earth (public domain)."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

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
    "UKR": (72, 96, 68, 255),
    "RUS": (118, 74, 62, 255),
    "OTHER": (42, 44, 40, 255),
}
OCEAN = (16, 26, 32, 255)
RIVER = (70, 112, 124, 255)
GRID = (230, 228, 216, 22)
UA_STROKE = (236, 232, 214, 255)
RU_STROKE = (210, 164, 148, 200)
OTHER_STROKE = (88, 90, 84, 160)

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
    return Image.blend(img.convert("RGB"), overlay, 0.07)


def main() -> None:
    countries = json.loads((GEO / "countries.geojson").read_text())["features"]
    rivers = json.loads((GEO / "rivers.geojson").read_text())["features"]
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
    font_city = font(body, 15 * SCALE)

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
                width = 5 if any(k in name for k in ("Dnipro", "Don", "Danube", "Dniester")) else 2
                draw.line(pts, fill=RIVER, width=width)

        ua = project(*spec["ua"], bbox, RW, RH)
        ru = project(*spec["ru"], bbox, RW, RH)
        halo_text(draw, ua, "UKRAINE", font_lg, (226, 232, 214, 230), (18, 22, 18, 180))
        halo_text(draw, ru, "RUSSIA", font_lg, (236, 210, 198, 230), (28, 16, 14, 180))

        halo_text(draw, (48 * SCALE, 44 * SCALE), spec["title"], font_title, (230, 228, 216, 220), (12, 13, 11, 160), "lt")
        halo_text(
            draw,
            (48 * SCALE, RH - 56 * SCALE),
            "Natural Earth 50m  ·  public domain  ·  internationally recognized borders",
            font_sm,
            (176, 174, 164, 200),
            (12, 13, 11, 140),
            "lt",
        )

        # legend
        lx, ly = RW - 420 * SCALE, 40 * SCALE
        draw.rounded_rectangle((lx, ly, lx + 380 * SCALE, ly + 92 * SCALE), radius=16, fill=(12, 13, 11, 150))
        draw.rectangle((lx + 18 * SCALE, ly + 22 * SCALE, lx + 48 * SCALE, ly + 42 * SCALE), fill=FILL["UKR"][:3])
        draw.rectangle((lx + 18 * SCALE, ly + 54 * SCALE, lx + 48 * SCALE, ly + 74 * SCALE), fill=FILL["RUS"][:3])
        halo_text(draw, (lx + 62 * SCALE, ly + 32 * SCALE), "Ukraine", font_sm, (226, 232, 214, 230), (12, 13, 11, 120), "lm")
        halo_text(draw, (lx + 62 * SCALE, ly + 64 * SCALE), "Russia", font_sm, (236, 210, 198, 230), (12, 13, 11, 120), "lm")

        img = img.resize((W, H), Image.Resampling.LANCZOS)
        rgb = Image.new("RGB", (W, H), (16, 26, 32))
        rgb.paste(img, mask=img.split()[-1])
        rgb = grain(rgb)
        rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
        dest = OUT / f"{tid}.jpg"
        rgb.save(dest, quality=90, optimize=True, subsampling=1)
        baked[tid] = rgb
        print("wrote", dest, dest.stat().st_size // 1024, "KB")

    # share cards from the real theater map
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
