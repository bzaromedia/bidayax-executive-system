import type { CallSession, TelephonyAuditEvent } from "@bidayax/types";

export type ProviderOperationResult = {
  readonly accepted: boolean;
  readonly providerReference?: string | null;
  readonly reasonCodes: readonly string[];
};

export type TelephonyProviderContext = {
  readonly tenantId: string;
  readonly cardId: string;
  readonly sessionId?: string;
};

export type CallProvider = {
  readonly requestInboundAnswer: (
    context: TelephonyProviderContext,
    session: CallSession
  ) => Promise<ProviderOperationResult>;
  readonly requestOutboundDial: (
    context: TelephonyProviderContext,
    session: CallSession
  ) => Promise<ProviderOperationResult>;
  readonly requestTransfer: (
    context: TelephonyProviderContext,
    destination: string
  ) => Promise<ProviderOperationResult>;
  readonly requestHangup: (
    context: TelephonyProviderContext
  ) => Promise<ProviderOperationResult>;
};

export type MessagingProvider = {
  readonly sendMessage: (
    context: TelephonyProviderContext,
    destination: string,
    message: string
  ) => Promise<ProviderOperationResult>;
};

export type RecordingProvider = {
  readonly requestRecordingStart: (
    context: TelephonyProviderContext
  ) => Promise<ProviderOperationResult>;
  readonly requestRecordingStop: (
    context: TelephonyProviderContext
  ) => Promise<ProviderOperationResult>;
};

export type ConferenceProvider = {
  readonly createConference: (
    context: TelephonyProviderContext,
    participantReferences: readonly string[]
  ) => Promise<ProviderOperationResult>;
};

export type WebhookProvider = {
  readonly verifyWebhook: (input: {
    readonly headers: Record<string, string | undefined>;
    readonly rawBody: string;
  }) => Promise<{ readonly valid: boolean; readonly reasonCodes: readonly string[] }>;
  readonly normalizeWebhook: (input: {
    readonly headers: Record<string, string | undefined>;
    readonly rawBody: string;
  }) => Promise<{ readonly auditEvent: TelephonyAuditEvent | null }>;
};

export type TelephonyProvider = {
  readonly providerName: string;
  readonly calls: CallProvider;
  readonly messaging?: MessagingProvider;
  readonly recording?: RecordingProvider;
  readonly conference?: ConferenceProvider;
  readonly webhooks: WebhookProvider;
};

export function assertProviderImplementationDisabled(): ProviderOperationResult {
  return {
    accepted: false,
    providerReference: null,
    reasonCodes: ["PHASE_6_PROVIDER_INTERFACE_ONLY", "PRODUCTION_CALLING_DISABLED"]
  };
}
