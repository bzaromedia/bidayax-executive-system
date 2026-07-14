import type {
  TelephonyAppointmentRequest,
  TelephonyCallbackRequest,
  CallSession,
  PhoneNumber,
  TelephonyAuditEvent,
  TelephonyUsageLedgerEntry,
  VoiceProfile
} from "@bidayax/types";

export type TelephonyDomainRepository = {
  readonly savePhoneNumber: (phoneNumber: PhoneNumber) => Promise<PhoneNumber>;
  readonly saveCallSession: (session: CallSession) => Promise<CallSession>;
  readonly saveTelephonyCallbackRequest: (request: TelephonyCallbackRequest) => Promise<TelephonyCallbackRequest>;
  readonly saveTelephonyAppointmentRequest: (request: TelephonyAppointmentRequest) => Promise<TelephonyAppointmentRequest>;
  readonly saveVoiceProfile: (profile: VoiceProfile) => Promise<VoiceProfile>;
  readonly appendUsageLedgerEntry: (
    entry: TelephonyUsageLedgerEntry
  ) => Promise<TelephonyUsageLedgerEntry>;
  readonly appendAuditEvent: (event: TelephonyAuditEvent) => Promise<TelephonyAuditEvent>;
  readonly listCallSessionsForTenant: (tenantId: string) => Promise<readonly CallSession[]>;
  readonly listAuditEventsForTenant: (tenantId: string) => Promise<readonly TelephonyAuditEvent[]>;
};

export function createInMemoryTelephonyDomainRepository(): TelephonyDomainRepository {
  const phoneNumbers = new Map<string, PhoneNumber>();
  const sessions = new Map<string, CallSession>();
  const callbacks = new Map<string, TelephonyCallbackRequest>();
  const appointments = new Map<string, TelephonyAppointmentRequest>();
  const voiceProfiles = new Map<string, VoiceProfile>();
  const usageEntries = new Map<string, TelephonyUsageLedgerEntry>();
  const auditEvents = new Map<string, TelephonyAuditEvent>();

  return {
    async appendAuditEvent(event) {
      if (auditEvents.has(event.eventId)) {
        throw new Error(`Telephony audit event already exists: ${event.eventId}.`);
      }

      auditEvents.set(event.eventId, event);
      return event;
    },
    async appendUsageLedgerEntry(entry) {
      if (usageEntries.has(entry.ledgerEntryId)) {
        throw new Error(`Telephony usage ledger entry already exists: ${entry.ledgerEntryId}.`);
      }

      usageEntries.set(entry.ledgerEntryId, entry);
      return entry;
    },
    async listAuditEventsForTenant(tenantId) {
      return [...auditEvents.values()]
        .filter((event) => event.tenantId === tenantId)
        .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
    },
    async listCallSessionsForTenant(tenantId) {
      return [...sessions.values()]
        .filter((session) => session.tenantId === tenantId)
        .sort((left, right) => left.sessionId.localeCompare(right.sessionId));
    },
    async saveTelephonyAppointmentRequest(request) {
      appointments.set(request.appointmentRequestId, request);
      return request;
    },
    async saveTelephonyCallbackRequest(request) {
      callbacks.set(request.callbackRequestId, request);
      return request;
    },
    async saveCallSession(session) {
      sessions.set(session.sessionId, session);
      return session;
    },
    async savePhoneNumber(phoneNumber) {
      phoneNumbers.set(phoneNumber.phoneNumberId, phoneNumber);
      return phoneNumber;
    },
    async saveVoiceProfile(profile) {
      voiceProfiles.set(profile.voiceProfileId, profile);
      return profile;
    }
  };
}
