import { NextResponse } from "next/server";
import { getClients } from "@/lib/store";
import { computeMetrics } from "@/lib/metrics";

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json({ metrics: computeMetrics(clients) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
