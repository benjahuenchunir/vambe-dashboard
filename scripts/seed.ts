/**
 * Seeds the `clients` table with an initial "already processed" batch, so
 * the dashboard has data on first load instead of starting empty.
 *
 * Run once, after applying supabase/schema.sql and setting up .env.local:
 *   pnpm exec tsx scripts/seed.ts
 */
import { processNextBatch, getProcessingStatus } from "../lib/store";

const SEED_SIZE = 120;

async function main() {
  const before = await getProcessingStatus();
  if (before.totalProcesados > 0) {
    console.log(`La tabla ya tiene ${before.totalProcesados} clientes — no se hace seed de nuevo.`);
    return;
  }

  console.log(`Insertando ${SEED_SIZE} clientes de ejemplo...`);
  const inserted = await processNextBatch(SEED_SIZE);
  console.log(`Listo: ${inserted.length} clientes insertados.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
