import type { VoiceProfile } from "@bidayax/types";

export function resolveVoiceProfile({
  defaultLanguage,
  language,
  profiles,
  tenantId
}: {
  readonly defaultLanguage: string;
  readonly language?: string | null;
  readonly profiles: readonly VoiceProfile[];
  readonly tenantId: string;
}) {
  const requestedLanguage = language ?? defaultLanguage;
  const tenantProfiles = profiles.filter((profile) => profile.tenantId === tenantId);

  return (
    tenantProfiles.find((profile) => profile.language === requestedLanguage) ??
    tenantProfiles.find((profile) => profile.language === defaultLanguage) ??
    null
  );
}
