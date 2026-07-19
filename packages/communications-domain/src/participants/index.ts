export const communicationParticipantKinds = [
  "external_contact",
  "executive",
  "tenant_user",
  "system",
  "adapter"
] as const;

export type CommunicationParticipantKind =
  (typeof communicationParticipantKinds)[number];

export type CommunicationParticipant = {
  readonly participantId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly kind: CommunicationParticipantKind;
  readonly displayName: string | null;
  readonly e164Number: string | null;
  readonly email: string | null;
  readonly locale: string | null;
  readonly trustReference: string | null;
};
