#!/usr/bin/env python3
"""
parse_slate.py - Parse Slate app exports and match with media files.

Reads JSON/CSV from the Slate app and correlates entries with actual
media files on disk using FX3 clip naming conventions.

Usage:
    python3 parse_slate.py slate_2026-04-04.json /path/to/media/
    python3 parse_slate.py slate_2026-04-04.csv /path/to/media/
"""

import json
import csv
import sys
import os
import re
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class SlateEntry:
    """A single entry from the Slate app."""
    type: str  # 'take' or 'event'
    scene: str
    scene_name: str
    shot: str
    shot_name: str
    take: Optional[str]
    time_start: str
    time_end: str
    clip: str  # e.g. 'A001C003'
    camera: str
    fps: str
    capture_fps: str
    gamma: str
    sound_roll: str
    shot_type: str  # W, M, CU, ECU, I, B, OTS, 2S
    movement: str   # FIX, PAN, TILT, DOLLY, ZOOM, HH, TRACK, CRANE, GIMBAL
    rating: int     # 0-5
    circle: bool    # Circle take (selected take)
    ok: bool
    tags: list
    description: str
    note: str
    # Matched file path (filled by match_media)
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    duration_sec: Optional[float] = None


@dataclass
class SlateProject:
    """Full project data from Slate app."""
    project: str
    date: str
    settings: dict
    entries: list  # list of SlateEntry


def parse_json(filepath: str) -> SlateProject:
    """Parse a Slate JSON export."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    entries = []
    for e in data.get('entries', []):
        entries.append(SlateEntry(
            type=e.get('type', 'take'),
            scene=e.get('scene', ''),
            scene_name=e.get('scene_name', ''),
            shot=e.get('shot', ''),
            shot_name=e.get('shot_name', ''),
            take=e.get('take'),
            time_start=e.get('time_start', ''),
            time_end=e.get('time_end', ''),
            clip=e.get('clip', ''),
            camera=e.get('camera', 'A'),
            fps=e.get('fps', '23.976'),
            capture_fps=e.get('capture_fps', ''),
            gamma=e.get('gamma', ''),
            sound_roll=e.get('sound_roll', ''),
            shot_type=e.get('shot_type', ''),
            movement=e.get('movement', ''),
            rating=int(e.get('rating', 0)),
            circle=bool(e.get('circle', False)),
            ok=bool(e.get('ok', False)),
            tags=e.get('tags', []),
            description=e.get('description', ''),
            note=e.get('note', ''),
        ))

    return SlateProject(
        project=data.get('project', ''),
        date=data.get('date', ''),
        settings=data.get('settings', {}),
        entries=entries,
    )


def parse_csv(filepath: str) -> SlateProject:
    """Parse a Slate CSV export."""
    entries = []
    date = ''
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not date:
                date = row.get('date', '')
            tags_str = row.get('tags', '')
            tags = [t.strip() for t in tags_str.split(';') if t.strip()]
            entries.append(SlateEntry(
                type='take' if row.get('take') else 'event',
                scene=row.get('scene', ''),
                scene_name=row.get('scene_name', ''),
                shot=row.get('shot', ''),
                shot_name=row.get('shot_name', ''),
                take=row.get('take') or None,
                time_start=row.get('time_start', ''),
                time_end=row.get('time_end', ''),
                clip=row.get('clip', ''),
                camera=row.get('camera', 'A'),
                fps=row.get('fps', '23.976'),
                capture_fps=row.get('capture_fps', ''),
                gamma=row.get('gamma', ''),
                sound_roll=row.get('sound_roll', ''),
                shot_type=row.get('shot_type', ''),
                movement=row.get('movement', ''),
                rating=int(row.get('rating', 0) or 0),
                circle=row.get('circle', '') == 'Y',
                ok=row.get('ok', '') == 'OK',
                tags=tags,
                description=row.get('description', ''),
                note=row.get('note', ''),
            ))

    return SlateProject(
        project='',
        date=date,
        settings={},
        entries=entries,
    )


def match_media(project: SlateProject, media_dir: str) -> dict:
    """
    Match slate entries to actual media files on disk.

    FX3 naming: A001C001_yymmddxx.MP4
    We match on the clip prefix (e.g. 'A001C001').

    Returns dict with match stats.
    """
    media_path = Path(media_dir)
    if not media_path.exists():
        print(f"Warning: Media directory not found: {media_dir}")
        return {'matched': 0, 'unmatched': 0, 'total': len(project.entries)}

    # Build index of media files by clip prefix
    media_index = {}
    extensions = {'.mp4', '.mxf', '.mov', '.avi', '.mts'}
    for f in media_path.rglob('*'):
        if f.suffix.lower() in extensions:
            # Extract clip prefix: A001C001 from A001C001_240315AB.MP4
            stem = f.stem
            match = re.match(r'^([A-Z]\d{3}C\d{3})', stem)
            if match:
                prefix = match.group(1)
                media_index[prefix] = f

    matched = 0
    unmatched = 0
    for entry in project.entries:
        clip = entry.clip
        if clip and clip in media_index:
            entry.file_path = str(media_index[clip])
            entry.file_size = media_index[clip].stat().st_size
            matched += 1
        else:
            unmatched += 1
            if clip:
                print(f"  No match: {clip} ({entry.scene}/{entry.shot}/{entry.take or 'event'})")

    return {'matched': matched, 'unmatched': unmatched, 'total': len(project.entries)}


def get_circle_takes(project: SlateProject) -> list:
    """Get all circle takes (selected best takes)."""
    return [e for e in project.entries if e.circle]


def get_best_takes(project: SlateProject) -> list:
    """
    Get the best take per scene/shot combination.
    Priority: circle > highest rating > OK tag > first take.
    """
    groups = {}
    for e in project.entries:
        if e.type != 'take':
            continue
        key = f"{e.scene}_{e.shot}"
        if key not in groups:
            groups[key] = []
        groups[key].append(e)

    best = []
    for key, takes in sorted(groups.items()):
        # Circle takes first
        circles = [t for t in takes if t.circle]
        if circles:
            best.append(circles[0])
            continue
        # Highest rating
        rated = sorted([t for t in takes if t.rating > 0], key=lambda t: -t.rating)
        if rated:
            best.append(rated[0])
            continue
        # OK tagged
        ok_takes = [t for t in takes if t.ok or 'ok' in t.tags]
        if ok_takes:
            best.append(ok_takes[-1])  # last OK take
            continue
        # Fallback: last take
        best.append(takes[-1])

    return best


def export_report(project: SlateProject, output_path: str = None):
    """Print a human-readable report of the slate data."""
    lines = []
    lines.append(f"=== Slate Report ===")
    lines.append(f"Project: {project.project}")
    lines.append(f"Date: {project.date}")
    lines.append(f"Total entries: {len(project.entries)}")
    lines.append(f"Takes: {sum(1 for e in project.entries if e.type=='take')}")
    lines.append(f"Events: {sum(1 for e in project.entries if e.type=='event')}")
    lines.append(f"Circle takes: {sum(1 for e in project.entries if e.circle)}")
    lines.append('')

    # Best takes
    best = get_best_takes(project)
    lines.append(f"--- Best Takes ({len(best)}) ---")
    for e in best:
        star = '★' if e.circle else ' '
        rating = f"{'★'*e.rating}{'☆'*(5-e.rating)}" if e.rating else '     '
        st = f"[{e.shot_type}]" if e.shot_type else ''
        matched = '✓' if e.file_path else '✗'
        lines.append(f"  {star} {e.scene}/{e.shot}/{e.take} {rating} {st} clip:{e.clip} {matched} {e.description or e.note or ''}")

    lines.append('')
    lines.append("--- All Entries ---")
    for i, e in enumerate(project.entries):
        star = '★' if e.circle else ' '
        tp = 'T' if e.type == 'take' else 'E'
        lines.append(f"  {i+1:3d}. {star} [{tp}] {e.scene}/{e.shot}/{e.take or '-'} clip:{e.clip} cam:{e.camera} r:{e.rating} {e.shot_type or ''} {e.movement or ''} {'OK' if e.ok else ''}")

    report = '\n'.join(lines)
    if output_path:
        with open(output_path, 'w') as f:
            f.write(report)
        print(f"Report saved to {output_path}")
    else:
        print(report)

    return report


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 parse_slate.py <slate_file> [media_dir]")
        print("  slate_file: .json or .csv from Slate app")
        print("  media_dir:  path to media files for matching (optional)")
        sys.exit(1)

    slate_file = sys.argv[1]
    media_dir = sys.argv[2] if len(sys.argv) > 2 else None

    # Parse
    if slate_file.endswith('.json'):
        project = parse_json(slate_file)
    elif slate_file.endswith('.csv'):
        project = parse_csv(slate_file)
    else:
        print(f"Unsupported format: {slate_file}")
        sys.exit(1)

    print(f"Loaded {len(project.entries)} entries from {slate_file}")

    # Match media
    if media_dir:
        stats = match_media(project, media_dir)
        print(f"Media matching: {stats['matched']}/{stats['total']} matched, {stats['unmatched']} unmatched")

    # Report
    export_report(project)
