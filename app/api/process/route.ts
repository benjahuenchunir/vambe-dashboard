import { NextResponse } from "next/server";
import { getProcessingStatus, processNextBatch } from "@/lib/store";

const DEFAULT_BATCH_SIZE = 25;
const MAX_BATCH_SIZE = 100;

/**
 * Triggers categorization of the next pending batch of transcripts.
 * See `lib/store.ts#processNextBatch` for what to swap in for the real LLM call.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = Math.min(Math.max(1, Number(body.batchSize) || DEFAULT_BATCH_SIZE), MAX_BATCH_SIZE);

    const statusBefore = await getProcessingStatus();
    if (statusBefore.totalPendientes === 0) {
      return NextResponse.json(
        { newClients: [], status: statusBefore, message: "No hay registros pendientes por procesar." },
        { status: 200 }
      );
    }

    const newClients = await processNextBatch(batchSize);
    const status = await getProcessingStatus();

    return NextResponse.json({ newClients, status });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
