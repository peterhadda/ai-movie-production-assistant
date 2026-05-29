import time

import anthropic

from app.core.config import settings

_MODEL = "claude-sonnet-4-5"


class AIServiceError(Exception):
    """Raised when the Anthropic API call fails."""


def call_claude(prompt: str, max_tokens: int = 1000) -> tuple[str, int, int]:
    """Send a prompt to Claude and return (response_text, input_tokens, output_tokens)."""
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        t0 = time.perf_counter()
        message = client.messages.create(
            model=_MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        t1 = time.perf_counter()
    except anthropic.APIConnectionError as exc:
        raise AIServiceError(f"Could not reach Anthropic API: {exc}") from exc
    except anthropic.AuthenticationError as exc:
        raise AIServiceError("Anthropic API key is invalid or missing.") from exc
    except anthropic.RateLimitError as exc:
        raise AIServiceError("Anthropic rate limit exceeded — try again shortly.") from exc
    except anthropic.APIStatusError as exc:
        raise AIServiceError(
            f"Anthropic API returned status {exc.status_code}: {exc.message}"
        ) from exc

    response_text = message.content[0].text
    input_tokens  = message.usage.input_tokens
    output_tokens = message.usage.output_tokens

    _ = t1 - t0  # latency available for callers that want to log it via MLflow

    return response_text, input_tokens, output_tokens
