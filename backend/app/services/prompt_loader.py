import re
from pathlib import Path

_PROMPTS_ROOT = Path(__file__).parent.parent.parent / "prompts"
_PLACEHOLDER = re.compile(r"\{\{(\w+)\}\}")


def load_prompt(name: str, version: str, variables: dict[str, str]) -> str:
    """Read prompts/{version}/{name}.txt and substitute {{KEY}} placeholders."""
    path = _PROMPTS_ROOT / version / f"{name}.txt"

    try:
        template = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise FileNotFoundError(
            f"Prompt template not found: prompts/{version}/{name}.txt"
        )

    missing = {key for key in _PLACEHOLDER.findall(template) if key not in variables}
    if missing:
        raise KeyError(
            f"Prompt '{name}' v{version} has unresolved placeholders: "
            + ", ".join(f"{{{{{k}}}}}" for k in sorted(missing))
        )

    return _PLACEHOLDER.sub(lambda m: str(variables[m.group(1)]), template)
