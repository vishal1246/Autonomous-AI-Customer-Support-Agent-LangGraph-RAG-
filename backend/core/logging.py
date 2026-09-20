"""
app/core/logging.py — Centralized Logging Configuration

Sets up structured logging for the entire application.
All modules should use `get_logger(__name__)` instead of bare `print()`.

Usage:
    from backend.core.logging import get_logger
    logger = get_logger(__name__)
    logger.info("Processing email", extra={"email_id": "EMAIL-001"})
"""

import logging
import sys


def configure_logging(level: str = "INFO") -> None:
    """
    Configure the root logger with a consistent format.
    Call once at application startup (in main.py).
    """
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format=log_format,
        datefmt=date_format,
        stream=sys.stdout,
        force=True,  # override any existing handlers
    )

    # Silence noisy third-party loggers
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Return a named logger. Pass __name__ from the calling module.

    Example:
        logger = get_logger(__name__)
        logger.info("[agent] Processing email thread_id=%s", thread_id)
    """
    return logging.getLogger(name)
