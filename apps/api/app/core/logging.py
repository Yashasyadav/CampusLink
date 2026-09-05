import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    """Configures structured application logging."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Quell noisy third-party loggers if needed
    logging.getLogger("uvicorn.access").setLevel(log_level)


logger = logging.getLogger("campuslink")
