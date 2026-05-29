"""Smoke-test for scene_parser. Delete after verifying."""
import sys, json
sys.path.insert(0, ".")

from app.services.scene_parser import parse_scenes

SAMPLE = """
INT. COFFEE SHOP - DAY

A busy downtown cafe. MAYA (30s, intense) sits alone, laptop open.
A half-empty cup of coffee grows cold beside her.

BARISTA
Can I get you anything else?

MAYA
Just the check.

She closes the laptop. Something is wrong.

EXT. STREET - CONTINUOUS

Maya bursts through the door into blinding sunlight.
She stops. Looks left. Looks right.

MAYA
(under her breath)
He was here.

She pulls out her phone, dials. No answer.

INT. POLICE STATION - NIGHT

Fluorescent lights hum overhead.
DETECTIVE COLE (50s, rumpled) spreads photos across a desk.

COLE
She filed the report three weeks ago.

OFFICER
And nobody followed up?

COLE
Nobody followed up.

He stares at the photo of Maya.

EXT. PARKING GARAGE - NIGHT

Dark. Only the flicker of a broken light.
Footsteps echo.
"""

scenes = parse_scenes(SAMPLE)
print(f"Found {len(scenes)} scenes\n")
for s in scenes:
    print(f"Scene {s['scene_number']}: {s['scene_header']}")
    print(f"  lines={s['line_count']}  dialogue_ratio={s['dialogue_ratio']}  "
          f"is_slow={s['is_slow']}  is_dialogue_heavy={s['is_dialogue_heavy']}")
    print()

assert len(scenes) == 4, f"Expected 4 scenes, got {len(scenes)}"
assert scenes[0]["scene_header"].startswith("INT.")
assert scenes[1]["scene_header"].startswith("EXT.")
assert scenes[0]["is_slow"] is True, "7 lines < 8 threshold → slow"
assert scenes[2]["is_slow"] is False, "Police station has 9 lines → not slow"
assert scenes[3]["is_slow"] is True, "Parking garage only 2 lines → slow"
assert 0.0 <= scenes[0]["dialogue_ratio"] <= 1.0
print("All assertions passed.")
