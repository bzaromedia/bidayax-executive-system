import { webhookResponse } from "@/lib/identity-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return webhookResponse(request);
}
