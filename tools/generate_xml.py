#!/usr/bin/env python3
"""
generate_xml.py - Generate Premiere Pro FCP XML from Slate data + media files.

Creates a complete FCP XML 7 file that can be directly imported into
Adobe Premiere Pro, with:
- Bin structure organized by Scene
- Clips with logging metadata (scene, shot, take, good)
- Markers on circle takes and tagged clips
- Multi-camera grouping info
- An auto-assembled "Best Takes" sequence

Usage:
    python3 generate_xml.py slate_2026-04-04.json /path/to/media/ output.xml
    python3 generate_xml.py slate_2026-04-04.json /path/to/media/ output.xml --sequence
"""

import sys
import os
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent
from parse_slate import parse_json, parse_csv, match_media, get_best_takes


def esc(text):
    """Escape for XML content."""
    if not text:
        return ''
    return str(text).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def frames_from_seconds(seconds, fps):
    """Convert seconds to frame count."""
    return int(round(seconds * fps))


def tc_string(seconds, fps):
    """Convert seconds to timecode string HH:MM:SS:FF."""
    total_frames = int(round(seconds * fps))
    ff = total_frames % int(fps)
    total_seconds = total_frames // int(fps)
    ss = total_seconds % 60
    mm = (total_seconds // 60) % 60
    hh = total_seconds // 3600
    return f"{hh:02d}:{mm:02d}:{ss:02d}:{ff:02d}"


def create_rate_element(parent, fps):
    """Add a <rate> element."""
    rate = SubElement(parent, 'rate')
    ntsc = fps in [23.976, 29.97, 59.94]
    timebase = round(fps) if ntsc else int(fps)
    SubElement(rate, 'timebase').text = str(timebase)
    if ntsc:
        SubElement(rate, 'ntsc').text = 'TRUE'
    return rate


def get_label_color(entry):
    """Determine Premiere label color from entry metadata."""
    if entry.circle:
        return 'Mango'  # Orange/yellow for circle takes
    if entry.ok or 'ok' in entry.tags:
        return 'Iris'   # Blue for OK takes
    if 'ng' in entry.tags:
        return 'Rose'   # Red for NG
    if entry.rating >= 4:
        return 'Caribbean'  # Teal for high-rated
    if 'important' in entry.tags or 'highlight' in entry.tags:
        return 'Lavender'
    return ''


def get_marker_color(entry):
    """Get marker color string."""
    if entry.circle:
        return 'Yellow'
    if entry.ok or 'ok' in entry.tags:
        return 'Green'
    if 'ng' in entry.tags:
        return 'Red'
    if 'important' in entry.tags:
        return 'Blue'
    if 'highlight' in entry.tags:
        return 'Purple'
    return 'Cyan'


def build_clip_element(parent, entry, idx, fps, file_url=None):
    """Build a <clip> element for a single entry."""
    clip = SubElement(parent, 'clip', id=f'clip-{idx+1}')

    clip_name = entry.clip or f'clip_{idx+1}'
    SubElement(clip, 'name').text = clip_name

    duration_sec = 0
    if entry.time_end and entry.time_start:
        try:
            from datetime import datetime
            ts = datetime.fromisoformat(entry.time_start.replace('Z', '+00:00'))
            te = datetime.fromisoformat(entry.time_end.replace('Z', '+00:00'))
            duration_sec = (te - ts).total_seconds()
        except:
            pass

    duration_frames = frames_from_seconds(duration_sec, fps) if duration_sec > 0 else int(fps * 10)
    SubElement(clip, 'duration').text = str(duration_frames)
    create_rate_element(clip, fps)

    # Logging info - this is what Premiere uses for scene/shot/take metadata
    logging = SubElement(clip, 'logginginfo')
    scene_str = entry.scene
    if entry.scene_name:
        scene_str += ' ' + entry.scene_name
    SubElement(logging, 'scene').text = esc(scene_str)

    shot_take = entry.shot or ''
    if entry.take:
        shot_take += ' ' + entry.take
    SubElement(logging, 'shottake').text = esc(shot_take)

    # Build a rich log note with all AI-relevant info
    log_parts = []
    if entry.description:
        log_parts.append(entry.description)
    if entry.shot_type:
        log_parts.append(f'ShotType:{entry.shot_type}')
    if entry.movement:
        log_parts.append(f'Movement:{entry.movement}')
    if entry.note:
        log_parts.append(f'Note:{entry.note}')
    SubElement(logging, 'lognote').text = esc(' | '.join(log_parts))
    SubElement(logging, 'good').text = 'TRUE' if (entry.circle or entry.ok) else 'FALSE'

    desc_parts = []
    if entry.shot_type:
        desc_parts.append(entry.shot_type)
    if entry.movement:
        desc_parts.append(entry.movement)
    if entry.description:
        desc_parts.append(entry.description)
    SubElement(logging, 'description').text = esc(' | '.join(desc_parts))

    # Labels (color coding in Premiere)
    label = get_label_color(entry)
    if label:
        labels = SubElement(clip, 'labels')
        SubElement(labels, 'label').text = label

    # Comments (up to 4 master comments + 2 clip comments)
    comments = SubElement(clip, 'comments')
    SubElement(comments, 'mastercomment1').text = f'Rating: {entry.rating}/5'
    SubElement(comments, 'mastercomment2').text = f'Camera: {entry.camera} | Gamma: {entry.gamma}'
    SubElement(comments, 'mastercomment3').text = ', '.join(entry.tags) if entry.tags else ''
    SubElement(comments, 'mastercomment4').text = entry.sound_roll or ''
    if entry.capture_fps and entry.capture_fps != entry.fps:
        SubElement(comments, 'clipcommenta').text = f'Capture FPS: {entry.capture_fps} (slow-motion)'

    # Markers
    if entry.tags or entry.circle or entry.rating >= 4:
        marker = SubElement(clip, 'marker')
        if entry.circle:
            SubElement(marker, 'name').text = 'CIRCLE TAKE'
        elif entry.ok:
            SubElement(marker, 'name').text = 'OK'
        elif entry.rating >= 4:
            SubElement(marker, 'name').text = f'Rating {entry.rating}'
        else:
            SubElement(marker, 'name').text = entry.tags[0] if entry.tags else ''
        SubElement(marker, 'comment').text = esc(entry.description or entry.note or '')
        SubElement(marker, 'in').text = '0'
        SubElement(marker, 'out').text = '-1'
        SubElement(marker, 'color').text = get_marker_color(entry)

    # Media reference
    media = SubElement(clip, 'media')
    video = SubElement(media, 'video')
    SubElement(video, 'duration').text = str(duration_frames)
    create_rate_element(video, fps)

    if file_url:
        track = SubElement(video, 'track')
        clipitem = SubElement(track, 'clipitem', id=f'clipitem-{idx+1}')
        SubElement(clipitem, 'name').text = clip_name
        SubElement(clipitem, 'duration').text = str(duration_frames)
        create_rate_element(clipitem, fps)
        SubElement(clipitem, 'in').text = '0'
        SubElement(clipitem, 'out').text = str(duration_frames)
        SubElement(clipitem, 'start').text = '0'
        SubElement(clipitem, 'end').text = str(duration_frames)
        file_elem = SubElement(clipitem, 'file', id=f'file-{idx+1}')
        SubElement(file_elem, 'name').text = clip_name
        SubElement(file_elem, 'pathurl').text = file_url

    return clip


def build_sequence(parent, name, entries, fps, start_tc='01:00:00:00'):
    """Build a <sequence> element from a list of entries."""
    seq = SubElement(parent, 'sequence')
    SubElement(seq, 'name').text = name
    def _dur(e):
        if e.time_end and e.time_start:
            try:
                from datetime import datetime
                ts = datetime.fromisoformat(e.time_start.replace('Z', '+00:00'))
                te = datetime.fromisoformat(e.time_end.replace('Z', '+00:00'))
                return max(1, (te - ts).total_seconds())
            except:
                pass
        return 10
    total_frames = sum(frames_from_seconds(_dur(e), fps) for e in entries) if entries else 0

    SubElement(seq, 'duration').text = str(total_frames)
    create_rate_element(seq, fps)

    # Timecode
    tc = SubElement(seq, 'timecode')
    create_rate_element(tc, fps)
    SubElement(tc, 'string').text = start_tc

    media = SubElement(seq, 'media')
    video = SubElement(media, 'video')
    track = SubElement(video, 'track')

    timeline_pos = 0
    for i, entry in enumerate(entries):
        from datetime import datetime
        dur_sec = 10
        try:
            if entry.time_end:
                ts = datetime.fromisoformat(entry.time_start.replace('Z', '+00:00'))
                te = datetime.fromisoformat(entry.time_end.replace('Z', '+00:00'))
                dur_sec = max(1, (te - ts).total_seconds())
        except:
            pass

        dur_frames = frames_from_seconds(dur_sec, fps)
        clipitem = SubElement(track, 'clipitem', id=f'seqclip-{i+1}')
        SubElement(clipitem, 'name').text = entry.clip or f'clip_{i+1}'
        SubElement(clipitem, 'duration').text = str(dur_frames)
        create_rate_element(clipitem, fps)
        SubElement(clipitem, 'in').text = '0'
        SubElement(clipitem, 'out').text = str(dur_frames)
        SubElement(clipitem, 'start').text = str(timeline_pos)
        SubElement(clipitem, 'end').text = str(timeline_pos + dur_frames)

        # Reference to file if matched
        if entry.file_path:
            file_elem = SubElement(clipitem, 'file', id=f'seqfile-{i+1}')
            SubElement(file_elem, 'name').text = entry.clip
            SubElement(file_elem, 'pathurl').text = 'file:///' + entry.file_path.replace('\\', '/')

        # Add marker on clip in sequence
        if entry.circle or entry.rating >= 4:
            marker = SubElement(clipitem, 'marker')
            SubElement(marker, 'name').text = 'CIRCLE' if entry.circle else f'R{entry.rating}'
            SubElement(marker, 'comment').text = esc(entry.description or '')
            SubElement(marker, 'in').text = '0'
            SubElement(marker, 'out').text = '-1'
            SubElement(marker, 'color').text = 'Yellow' if entry.circle else 'Green'

        timeline_pos += dur_frames

    return seq


def generate_xml(project, fps=None, include_sequence=False, output_path=None):
    """
    Generate a complete FCP XML 7 document.

    Args:
        project: SlateProject instance
        fps: Override frame rate (otherwise uses project settings)
        include_sequence: Whether to include an auto-assembled sequence
        output_path: Where to write the XML file
    """
    if fps is None:
        fps = float(project.settings.get('fps', '23.976') if project.settings else '23.976')

    root = Element('xmeml', version='5')

    # Top-level bin
    top_bin = SubElement(root, 'bin')
    SubElement(top_bin, 'name').text = f'{project.project} - {project.date}'
    children = SubElement(top_bin, 'children')

    # Organize clips by scene into sub-bins
    scenes = {}
    for i, entry in enumerate(project.entries):
        scene_key = entry.scene
        if scene_key not in scenes:
            scenes[scene_key] = []
        scenes[scene_key].append((i, entry))

    for scene_key in sorted(scenes.keys()):
        scene_entries = scenes[scene_key]
        scene_name = scene_entries[0][1].scene_name
        bin_name = f"{scene_key} {scene_name}" if scene_name else scene_key

        scene_bin = SubElement(children, 'bin')
        SubElement(scene_bin, 'name').text = bin_name
        scene_children = SubElement(scene_bin, 'children')

        for idx, entry in scene_entries:
            file_url = None
            if entry.file_path:
                file_url = 'file:///' + entry.file_path.replace('\\', '/')
            build_clip_element(scene_children, entry, idx, fps, file_url)

    # Auto-assembled sequence from best takes
    if include_sequence:
        best = get_best_takes(project)
        if best:
            build_sequence(children, f'{project.project} - Best Takes', best, fps)

    # Write
    tree = ElementTree(root)
    indent(tree, space='  ')

    if output_path:
        # Write with XML declaration
        with open(output_path, 'wb') as f:
            f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
            f.write(b'<!DOCTYPE xmeml>\n')
            tree.write(f, encoding='unicode' if sys.version_info >= (3, 8) else 'utf-8',
                       xml_declaration=False)
        print(f"FCP XML written to {output_path}")
        print(f"  Scenes: {len(scenes)}")
        print(f"  Clips: {len(project.entries)}")
        if include_sequence:
            print(f"  Sequence: Best Takes ({len(best)} clips)")
    else:
        # Print to stdout
        import io
        buf = io.StringIO()
        buf.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        buf.write('<!DOCTYPE xmeml>\n')
        tree.write(buf, encoding='unicode', xml_declaration=False)
        print(buf.getvalue())

    return root


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 generate_xml.py <slate_file> <media_dir> [output.xml] [--sequence]")
        print("")
        print("  slate_file:  .json or .csv export from Slate app")
        print("  media_dir:   path to media files (for file matching)")
        print("  output.xml:  output path (optional, prints to stdout)")
        print("  --sequence:  include auto-assembled 'Best Takes' sequence")
        sys.exit(1)

    slate_file = sys.argv[1]
    media_dir = sys.argv[2]
    output_path = None
    include_sequence = False

    for arg in sys.argv[3:]:
        if arg == '--sequence':
            include_sequence = True
        elif not arg.startswith('-'):
            output_path = arg

    # Parse slate data
    if slate_file.endswith('.json'):
        project = parse_json(slate_file)
    elif slate_file.endswith('.csv'):
        project = parse_csv(slate_file)
    else:
        print(f"Unsupported format: {slate_file}")
        sys.exit(1)

    print(f"Loaded {len(project.entries)} entries")

    # Match media files
    stats = match_media(project, media_dir)
    print(f"Media: {stats['matched']}/{stats['total']} matched")

    # Generate XML
    generate_xml(project, include_sequence=include_sequence, output_path=output_path)
