import re


_SCENE_HEADER_RE = re.compile(r"^(INT|EXT|INT\./EXT|EXT\./INT)[\.\s]", re.IGNORECASE)
_ALL_CAPS_RE = re.compile(r"^[A-Z][A-Z\s\.\-\']+$")


def _is_scene_header(line: str) -> bool:
    return bool(_SCENE_HEADER_RE.match(line.strip()))


def _is_character_name(line: str) -> bool:
    stripped = line.strip()
    return bool(stripped and _ALL_CAPS_RE.match(stripped) and len(stripped) <= 40)


def _dialogue_ratio(lines: list[str]) -> float:
    non_empty = [l for l in lines if l.strip()]
    if not non_empty:
        return 0.0

    dialogue_lines = 0
    prev_was_character = False

    for line in non_empty:
        if _is_character_name(line):
            prev_was_character = True
            continue
        if prev_was_character and len(line.strip()) > 20:
            dialogue_lines += 1
            prev_was_character = False
        else:
            prev_was_character = False

    return dialogue_lines / len(non_empty)


def parse_scenes(raw_text: str) -> list[dict]:
    # Step A — clean
    text = raw_text.strip().replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")

    # Step B & C — detect headers and group lines into scene blocks
    scenes_raw: list[tuple[str, list[str]]] = []
    current_header: str | None = None
    current_lines: list[str] = []

    for line in lines:
        if _is_scene_header(line):
            if current_header is not None:
                scenes_raw.append((current_header, current_lines))
            current_header = line.strip()
            current_lines = []
        else:
            if current_header is not None:
                current_lines.append(line)

    if current_header is not None:
        scenes_raw.append((current_header, current_lines))

    # Step D — calculate per-scene metrics
    result: list[dict] = []
    for idx, (header, body_lines) in enumerate(scenes_raw, start=1):
        non_empty = [l for l in body_lines if l.strip()]
        line_count = len(non_empty)
        ratio = _dialogue_ratio(body_lines)

        result.append({
            "scene_number": idx,
            "scene_header": header,
            "raw_text": "\n".join(body_lines).strip(),
            "line_count": line_count,
            "dialogue_ratio": round(ratio, 3),
            "is_dialogue_heavy": ratio > 0.65,
            "is_slow": line_count < 8,
        })

    return result
