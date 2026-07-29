import { NextResponse } from "next/server";
import { getClients } from "@/lib/store";

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
