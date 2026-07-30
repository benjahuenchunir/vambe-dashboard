import argparse
from services.pipeline import run_pipeline

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Categoriza transcripciones de Vambe con un LLM.")
    parser.add_argument("--limit", type=int, help="Procesa como máximo N filas pendientes en esta corrida.")
    parser.add_argument("--workers", type=int, default=1, help="Número de peticiones en paralelo (default: 1).")
    return parser.parse_args()

def run() -> None:
    args = parse_args()
    run_pipeline(args.limit, args.workers)


if __name__ == "__main__":
    run()