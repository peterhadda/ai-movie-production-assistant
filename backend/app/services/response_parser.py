import json
import logging
import re

logger = logging.getLogger(__name__)

_JSON_BLOCK = re.compile(r"\{.*\}", re.DOTALL)


class ParseError(Exception):
    """Raised when a Claude response cannot be parsed as JSON."""

    def __init__(self, message: str, raw_text: str) -> None:
        super().__init__(message)
        self.raw_text = raw_text


def parse_json_response(raw_text: str) -> dict:
    """Parse a JSON object out of a Claude response string.

    Attempts direct parse first, then falls back to extracting the outermost
    {...} block in case the model added surrounding text or markdown fences.
    """
    cleaned = raw_text.strip()

    # Pass 1 — direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Pass 2 — extract the first { ... last } substring
    match = _JSON_BLOCK.search(cleaned)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    logger.error("Failed to parse Claude response as JSON:\n%s", raw_text)
    raise ParseError(
        "Claude response did not contain valid JSON after two parse attempts.",
        raw_text=raw_text,
    )
