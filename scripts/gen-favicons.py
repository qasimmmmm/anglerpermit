#!/usr/bin/env python3
"""Generate the full AnglerPermit favicon set on a solid white background.

Source: the highest-resolution transparent mark
(/mnt/agents/upload/icon-1024.png, 1024x1024 RGBA). The mark is cropped to
its alpha bounding box, then composited onto an opaque #FFFFFF canvas so the
mark fills ~85% of the canvas (optically centered, ~7.5% padding per side).

Outputs (all fully opaque, no alpha):
  src/app/favicon.ico                      multi-res 16+32+48
  src/app/icon.png                         32x32
  src/app/apple-icon.png                   180x180 (square corners; iOS rounds)
  public/icons/android-chrome-192x192.png  192x192
  public/icons/android-chrome-512x512.png  512x512

Run:  python3 scripts/gen-favicons.py
Requires: Pillow
"""
import os
import sys

from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.environ.get("FAVICON_SOURCE", "/mnt/agents/upload/icon-1024.png")
OCCUPANCY = 0.85  # mark width as a fraction of the canvas
BG = (255, 255, 255)


def load_mark() -> Image.Image:
    mark = Image.open(SOURCE).convert("RGBA")
    bbox = mark.getchannel("A").getbbox()
    if bbox:
        mark = mark.crop(bbox)
    return mark


def render(size: int, mark: Image.Image) -> Image.Image:
    """Mark flattened onto a solid white `size` x `size` canvas."""
    canvas = Image.new("RGB", (size, size), BG)
    target = max(1, round(size * OCCUPANCY))
    scale = target / max(mark.size)
    w = max(1, round(mark.size[0] * scale))
    h = max(1, round(mark.size[1] * scale))
    resized = mark.resize((w, h), Image.LANCZOS)
    x = (size - w) // 2
    y = (size - h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def main() -> None:
    mark = load_mark()
    print(f"source: {SOURCE} cropped mark: {mark.size}")

    def out(rel: str) -> str:
        path = os.path.join(REPO, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        return path

    # Multi-resolution ICO (16 + 32 + 48), white background, no alpha.
    # PIL's ICO writer derives the smaller frames from the largest image.
    render(48, mark).save(
        out("src/app/favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    render(32, mark).save(out("src/app/icon.png"), format="PNG")
    render(180, mark).save(out("src/app/apple-icon.png"), format="PNG")
    render(192, mark).save(out("public/icons/android-chrome-192x192.png"), format="PNG")
    render(512, mark).save(out("public/icons/android-chrome-512x512.png"), format="PNG")

    for rel in (
        "src/app/favicon.ico",
        "src/app/icon.png",
        "src/app/apple-icon.png",
        "public/icons/android-chrome-192x192.png",
        "public/icons/android-chrome-512x512.png",
    ):
        print("wrote", rel)


if __name__ == "__main__":
    sys.exit(main())
