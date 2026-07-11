import {
  getSettingsPayload,
  postSettingsPayload,
  type SettingsKind
} from "@/lib/card-customization-settings-api";

export const runtime = "nodejs";

const settingsKind = "card-customization" satisfies SettingsKind;

type RouteContext = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const params = await context.params;

  return getSettingsPayload(request, params.slug, settingsKind);
}

export async function POST(request: Request, context: RouteContext) {
  const params = await context.params;

  return postSettingsPayload(request, params.slug, settingsKind);
}
