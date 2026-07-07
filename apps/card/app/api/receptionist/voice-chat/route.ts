import { handleReceptionistRequestRoute } from "@/lib/receptionist-route-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleReceptionistRequestRoute(request, "voice_chat");
}
