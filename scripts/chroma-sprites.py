#!/usr/bin/env python3
"""Magenta chroma + edge flood of leftover studio/dirt backdrops + crop."""
from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/workspace/assets/sprites/new")
PUB = Path("/workspace/public/game/sprites")
PUB_D = PUB / "drones"
PUB_S = PUB / "sites"
PUB_E = PUB / "explode"
PUB_M = PUB / "missile"


def key_magenta(arr: np.ndarray, thresh: int = 55) -> np.ndarray:
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    mag = (np.abs(r.astype(np.int16) - 255) < thresh) & (np.abs(b.astype(np.int16) - 255) < thresh) & (g < 90)
    mag |= (r > 190) & (b > 190) & (g < 130) & (r.astype(np.int16) + b.astype(np.int16) - 2 * g.astype(np.int16) > 160)
    arr = arr.copy()
    arr[..., 3] = np.where(mag, 0, a)
    fringe = (arr[..., 3] > 0) & (arr[..., 0] > 160) & (arr[..., 2] > 160) & (arr[..., 1] < 140)
    arr[..., 0] = np.where(fringe, np.minimum(arr[..., 0], arr[..., 1] + 40), arr[..., 0])
    arr[..., 2] = np.where(fringe, np.minimum(arr[..., 2], arr[..., 1] + 40), arr[..., 2])
    return arr


def punch_edge_bg(arr: np.ndarray, tol: float = 34) -> np.ndarray:
    """If corners are opaque and similar, flood that backdrop from the edges."""
    h, w = arr.shape[:2]
    patches = [arr[0:12, 0:12], arr[0:12, -12:], arr[-12:, 0:12], arr[-12:, -12:]]
    if not all(float(p[..., 3].mean()) > 180 for p in patches):
        return arr
    ref = np.median(np.concatenate([p.reshape(-1, 4)[:, :3] for p in patches], axis=0), axis=0).astype(np.float32)
    dist = np.linalg.norm(arr[..., :3].astype(np.float32) - ref, axis=2)
    seen = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for y, x in (
        *[(0, x) for x in range(w)],
        *[(h - 1, x) for x in range(w)],
        *[(y, 0) for y in range(h)],
        *[(y, w - 1) for y in range(h)],
    ):
        if arr[y, x, 3] > 8 and dist[y, x] < tol and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        arr[y, x, 3] = 0
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and arr[ny, nx, 3] > 8 and dist[ny, nx] < tol:
                seen[ny, nx] = True
                q.append((ny, nx))
    return arr


def zero_keyed(arr: np.ndarray) -> np.ndarray:
    dead = arr[..., 3] <= 8
    arr[..., 0] = np.where(dead, 0, arr[..., 0])
    arr[..., 1] = np.where(dead, 0, arr[..., 1])
    arr[..., 2] = np.where(dead, 0, arr[..., 2])
    arr[..., 3] = np.where(dead, 0, arr[..., 3])
    return arr


def clean(im: Image.Image) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).copy()
    arr = key_magenta(arr)
    arr = punch_edge_bg(arr)
    arr = zero_keyed(arr)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def crop(im: Image.Image, pad: float = 0.08) -> Image.Image:
    a = np.asarray(im.split()[-1])
    ys, xs = np.where(a > 12)
    if len(xs) == 0:
        return im
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    w, h = x1 - x0 + 1, y1 - y0 + 1
    p = int(max(w, h) * pad)
    x0, y0 = max(0, x0 - p), max(0, y0 - p)
    x1, y1 = min(im.width - 1, x1 + p), min(im.height - 1, y1 + p)
    side = max(x1 - x0, y1 - y0)
    cx = (x0 + x1) // 2
    cy = (y0 + y1) // 2
    x0 = max(0, cx - side // 2)
    y0 = max(0, cy - side // 2)
    return im.crop((x0, y0, min(im.width, x0 + side), min(im.height, y0 + side)))


def save_sq(im: Image.Image, dest: Path, size: int = 256) -> None:
    im = im.resize((size, size), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, optimize=True)
    print("wrote", dest, dest.stat().st_size // 1024, "KB")


def one(name: str, dest: Path, size: int = 256) -> None:
    raw = ROOT / name / "raw-sheet.png"
    if not raw.exists():
        raw = ROOT / name / "raw-sheet.jpg"
    im = crop(clean(Image.open(raw)))
    save_sq(im, dest, size)


def grid2(name: str, dest_dir: Path, prefix: str) -> None:
    raw = ROOT / name / "raw-sheet.png"
    im = clean(Image.open(raw))
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
        save_sq(crop(clean(c), 0.06), dest_dir / f"{prefix}{i}.png", 192)


def polish_public() -> None:
    """Second pass on every production sprite (yards included)."""
    for p in sorted(PUB.rglob("*.png")):
        im = clean(Image.open(p))
        im.save(p, optimize=True)


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
    polish_public()


if __name__ == "__main__":
    main()
