"""
Estado global compartido del pipeline.
"""
import threading

_state_lock = threading.Lock()
_taxonomy_lock = threading.Lock()

_state = {
    "running": False,
    "stop_requested": False,
    "total_csv": 0,
    "total_global_processed": 0,
    "total_lote": 0,
    "processed": 0,
    "succeeded": 0,
    "failed": 0,
    "error": None,
}
