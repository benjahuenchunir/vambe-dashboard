async function forward(action: string, method: string, body?: string) {
  const res = await fetch(`${process.env.PIPELINE_API_URL}/process/${action}`, {
    method,
    headers: {
      "x-pipeline-secret": process.env.PIPELINE_API_SECRET!,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  return Response.json(await res.json(), { status: res.status });
}

type RouteContext = {
  params: Promise<{
    action: string;
  }>;
};

export async function POST(req: Request, { params }: RouteContext) {
  const { action } = await params;
  return forward(action, "POST", await req.text());
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { action } = await params;
  return forward(action, "GET");
}