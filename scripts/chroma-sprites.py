#!/usr/bin/env python3
"""Fast magenta chroma + crop + optional 2x2 split."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/workspace/assets/sprites/new")
PUB_D = Path("/workspace/public/game/sprites/drones")
PUB_S = Path("/workspace/public/game/sprites/sites")
PUB_E = Path("/workspace/public/game/sprites/explode")
PUB_M = Path("/workspace/public/game/sprites/missile")


def key(im: Image.Image, thresh: int = 55) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).astype(np.int16)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    mag = (np.abs(r - 255) < thresh) & (np.abs(b - 255) < thresh) & (g < 80)
    # also catch near-magenta jpeg fringes
    mag |= (r > 200) & (b > 200) & (g < 120) & (r + b - 2 * g > 180)
    a = np.where(mag, 0, a)
    out = arr.copy()
    out[..., 3] = a
    # despill remaining magenta fringe
    fringe = (out[..., 3] > 0) & (out[..., 0] > 160) & (out[..., 2] > 160) & (out[..., 1] < 140)
    out[..., 0] = np.where(fringe, np.minimum(out[..., 0], out[..., 1] + 40), out[..., 0])
    out[..., 2] = np.where(fringe, np.minimum(out[..., 2], out[..., 1] + 40), out[..., 2])
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def crop(im: Image.Image, pad: float = 0.08) -> Image.Image:
    a = np.asarray(im.split()[-1])
    ys, xs = np.where(a > 12)
    if len(xs) == 0:
        return im
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    w, h = x1 - x0 + 1, y1 - y0 + 1
    p = int(max(w, h) * pad)
    x0, y0 = max(0, x0 - p), max(0, y0 - p)
    x1, y1 = min(im.width - 1, x1 + p), min(im.height - 1, y1 + p)
    side = max(x1 - x0, y1 - y0)
    cx = (x0 + x1) // 2
    cy = (y0 + y1) // 2
    x0 = max(0, cx - side // 2)
    y0 = max(0, cy - side // 2)
    box = (x0, y0, min(im.width, x0 + side), min(im.height, y0 + side))
    return im.crop(box)


def save_sq(im: Image.Image, dest: Path, size: int = 256) -> None:
    im = im.resize((size, size), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, optimize=True)
    print("wrote", dest, dest.stat().st_size // 1024, "KB")


def one(name: str, dest: Path, size: int = 256) -> None:
    raw = ROOT / name / "raw-sheet.png"
    if not raw.exists():
        raw = ROOT / name / "raw-sheet.jpg"
    im = key(Image.open(raw))
    im = crop(im)
    save_sq(im, dest, size)


def grid2(name: str, dest_dir: Path, prefix: str) -> None:
    raw = ROOT / name / "raw-sheet.png"
    im = key(Image.open(raw))
    w, h = im.size
    cw, ch = w // 2, h // 2
    cells = [
        im.crop((0, 0, cw, ch)),
        im.crop((cw, 0, w, ch)),
        im.crop((0, ch, cw, h)),
        im.crop((cw, ch, w, h)),
    ]
    dest_dir.mkdir(parents=True, exist_ok=True)
    for i, c in enumerate(cells):
        save_sq(crop(c, 0.06), dest_dir / f"{prefix}{i}.png", 192)


def main() -> None:
    drones = ["fpv", "fiber", "loiter", "lancet", "interceptor", "recon", "bomber", "decoy"]
    for n in drones:
        one(n, PUB_D / f"{n}.png", 256)
    one("mog", PUB_S / "mog.png", 280)
    one("shorad", PUB_S / "shorad.png", 280)
    one("aa", PUB_S / "aa.png", 280)
    one("longsam", PUB_S / "longsam.png", 300)
    grid2("explode", PUB_E, "e")
    grid2("missile", PUB_M, "m")


if __name__ == "__main__":
    main()
