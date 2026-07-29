"""
Estado global compartido del pipeline.
"""
import threading

_state_lock = threading.Lock()
_taxonomy_lock = threading.Lock()

_state: dict = {
    "running": False,
    "stop_requested": False,
    "total": 0,
    "processed": 0,
    "succeeded": 0,
    "failed": 0,
    "error": None,
}
