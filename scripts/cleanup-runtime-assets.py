from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image


@dataclass(frozen=True)
class Profile:
    target_luma: float
    padding: int = 2
    alpha_cutoff: int = 10
    max_lift: float = 1.28
    max_drop: float = 0.92


ROOT = Path(__file__).resolve().parents[1]

PROFILES: dict[str, Profile] = {
    'public/assets/player/revere_horse.png': Profile(98, padding=4, max_lift=1.22),
    'public/assets/buildings/*_unwarned.png': Profile(82, padding=2, max_lift=1.26),
    'public/assets/buildings/*_warned.png': Profile(104, padding=2, max_lift=1.25),
    'public/assets/enemies/*.png': Profile(108, padding=3, max_lift=1.24),
    'public/assets/hazards/*.png': Profile(102, padding=3, max_lift=1.24),
    'public/assets/props/rolled_broadside.png': Profile(132, padding=2, max_lift=1.18),
    'public/assets/props/hemp_bale_crate.png': Profile(112, padding=2, max_lift=1.18),
    'public/assets/props/split_rail_fence.png': Profile(92, padding=2, max_lift=1.16),
    'public/assets/props/lantern_posts.png': Profile(98, padding=2, max_lift=1.18),
    'public/assets/effects/hit_spark.png': Profile(156, padding=2, alpha_cutoff=4, max_lift=1.2),
    'public/assets/effects/lantern_glow.png': Profile(92, padding=2, alpha_cutoff=3, max_lift=1.08),
    'public/assets/ui/*.png': Profile(108, padding=0, alpha_cutoff=2, max_lift=1.08),
}

# Removes leftover concept-sheet labels from runtime building crops. The guard in
# apply_art_crop keeps repeat runs from cropping already-cleaned assets again.
ART_CROPS: dict[str, tuple[int, int, int, int]] = {
    'public/assets/buildings/blacksmith_unwarned.png': (0, 0, 338, 146),
    'public/assets/buildings/church_unwarned.png': (0, 0, 340, 138),
    'public/assets/buildings/house_unwarned.png': (0, 28, 340, 166),
    'public/assets/buildings/house_warned.png': (0, 29, 354, 176),
    'public/assets/buildings/militia_post_unwarned.png': (0, 0, 336, 132),
    'public/assets/buildings/tavern_unwarned.png': (0, 0, 340, 152),
}


def iter_profiled_assets() -> Iterable[tuple[Path, Profile]]:
    seen: set[Path] = set()

    for pattern, profile in PROFILES.items():
        for path in sorted(ROOT.glob(pattern)):
            if path in seen:
                continue

            seen.add(path)
            yield path, profile


def threshold_alpha(image: Image.Image, cutoff: int) -> Image.Image:
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    r, g, b, a = image.split()
    a = a.point(lambda value: 0 if value < cutoff else value)
    image = Image.merge('RGBA', (r, g, b, a))

    return image


def trim_to_alpha(image: Image.Image, padding: int) -> Image.Image:
    bbox = image.getchannel('A').getbbox()

    if not bbox:
        return image

    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)

    return image.crop((left, top, right, bottom))


def mean_luma(image: Image.Image) -> float | None:
    pixels = image.get_flattened_data()
    total = 0.0
    count = 0

    for r, g, b, a in pixels:
        if a <= 24:
            continue

        total += 0.2126 * r + 0.7152 * g + 0.0722 * b
        count += 1

    if count == 0:
        return None

    return total / count


def normalize_luma(image: Image.Image, profile: Profile) -> Image.Image:
    current_luma = mean_luma(image)

    if current_luma is None or current_luma <= 0:
        return image

    factor = profile.target_luma / current_luma
    factor = max(profile.max_drop, min(profile.max_lift, factor))

    if abs(factor - 1) < 0.015:
        return image

    r, g, b, a = image.split()

    def lift(value: int) -> int:
        return max(0, min(255, round(value * factor)))

    image = Image.merge('RGBA', (r.point(lift), g.point(lift), b.point(lift), a))

    return image


def apply_art_crop(path: Path, image: Image.Image) -> Image.Image:
    rel = path.relative_to(ROOT).as_posix()
    crop = ART_CROPS.get(rel)

    if crop is None:
        return image

    _left, _top, right, bottom = crop

    if image.width < right or image.height < bottom:
        return image

    return image.crop(crop)


def clean_asset(path: Path, profile: Profile) -> tuple[tuple[int, int], tuple[int, int]]:
    image = Image.open(path).convert('RGBA')
    before = image.size
    image = apply_art_crop(path, image)
    image = threshold_alpha(image, profile.alpha_cutoff)
    image = trim_to_alpha(image, profile.padding)
    image = normalize_luma(image, profile)

    # Fully transparent pixels should not carry dark RGB that can bleed in some browsers.
    r, g, b, a = image.split()
    blank = Image.new('L', image.size, 0)
    r = Image.composite(r, blank, a)
    g = Image.composite(g, blank, a)
    b = Image.composite(b, blank, a)
    image = Image.merge('RGBA', (r, g, b, a))
    image.save(path, optimize=True)

    return before, image.size


def main() -> None:
    print('Runtime asset cleanup')

    for path, profile in iter_profiled_assets():
        before, after = clean_asset(path, profile)
        rel = path.relative_to(ROOT).as_posix()
        print(f'{rel}: {before[0]}x{before[1]} -> {after[0]}x{after[1]}')


if __name__ == '__main__':
    main()
