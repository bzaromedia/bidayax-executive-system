import { handleTrustRequest } from "@/lib/trust-api";
export const runtime = "nodejs";
type Context = { readonly params: Promise<{ readonly operation: string }> };
export async function GET(request: Request, context: Context) { return handleTrustRequest(request, (await context.params).operation); }
export async function POST(request: Request, context: Context) { return handleTrustRequest(request, (await context.params).operation); }

