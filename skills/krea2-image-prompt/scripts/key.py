#!/usr/bin/env python
"""Chroma-key a generated image to RGBA: `python key.py in.png out.png [lo] [hi]`."""
import sys
import numpy as np
from PIL import Image, ImageDraw


def key(path, out, lo=36, hi=96):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    h, w = a.shape[:2]
    band = 10
    ring = np.concatenate([
        a[:band].reshape(-1, 3), a[-band:].reshape(-1, 3),
        a[:, :band].reshape(-1, 3), a[:, -band:].reshape(-1, 3)])
    bg = np.median(ring, axis=0)
    dist = np.linalg.norm(a - bg, axis=2)
    alpha = np.clip((dist - lo) / max(hi - lo, 1e-6), 0, 1)

    # keep only the component(s) touching the border as background
    from collections import deque
    bgmask = dist < hi
    seen = np.zeros((h, w), bool)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bgmask[y, x] and not seen[y, x]:
                seen[y, x] = True
                dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bgmask[y, x] and not seen[y, x]:
                seen[y, x] = True
                dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and bgmask[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                dq.append((ny, nx))
    alpha = np.where(seen, 0.0, alpha)
    # soft edge: any pixel bordering the hard background keeps its gradient alpha
    edge = seen & (dist > lo)
    alpha = np.where(edge, alpha, alpha)

    # despill: pull the excess key channel out of semi-transparent edge pixels
    key_ix = int(np.argmax(bg))
    others = [i for i in range(3) if i != key_ix]
    semi = (alpha > 0.04) & (alpha < 0.98)
    cap = (a[..., others[0]] + a[..., others[1]]) / 2 * 1.05
    a[..., key_ix] = np.where(semi, np.minimum(a[..., key_ix], cap), a[..., key_ix])

    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if bbox:
        pad = 6
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                min(w, bbox[2] + pad), min(h, bbox[3] + pad))
        img = img.crop(bbox)
    img.save(out)
    print(f"{out} {img.size} bg={bg.astype(int).tolist()} "
          f"coverage={float((np.asarray(img)[..., 3] > 8).mean()):.2%}")

    # preview sheet: light, dark, gradient
    W, H = img.size
    sheet = Image.new("RGB", (W * 3, H), "white")
    for i, color in enumerate([(245, 245, 247), (24, 28, 38), (255, 214, 214)]):
        tile = Image.new("RGB", (W, H), color)
        tile.paste(img, (0, 0), img)
        sheet.paste(tile, (i * W, 0))
    sheet.thumbnail((1500, 1500))
    sheet.save(out.replace(".png", "_preview.png"))


if __name__ == "__main__":
    key(sys.argv[1], sys.argv[2],
        *([float(v) for v in sys.argv[3:5]] if len(sys.argv) > 3 else []))
