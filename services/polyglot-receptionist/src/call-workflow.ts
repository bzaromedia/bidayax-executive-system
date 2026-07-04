import { randomUUID } from "node:crypto";
import type {
  CallIntent,
  CallerProfile,
  ExecutiveSlug,
  LanguageProfile,
  ReceptionistAction,
  ReceptionistCallEvent,
  ReceptionistStatus,
  ReceptionistRequest,
  SupportedReceptionistLanguage
} from "@bidayax/types";
import { supportedReceptionistLanguages } from "@bidayax/types";
import { calculateCallbackPriorityScore } from "./callback-priority-score";
import {
  createDefaultExecutiveReceptionistPolicy,
  decideExecutiveAvailability
} from "./executive-availability-policy";
import { createMultilingualConversationMemory, toCallSummary } from "./conversation-memory";
import { decideReceptionistEscalation } from "./escalation-decision";
import { routePolyglotCallIntent } from "./polyglot-intent-routing";
import { resolveVoiceProviderStatus } from "./provider-interfaces";
import { classifySpamAndAbuseRisk } from "./spam-abuse-risk";
import { calculateVoiceTrustScore } from "./voice-trust-score";
import { runReceptionistWorkflow } from "./workflow-engine";

export type SimulatedInboundCallInput = {
  readonly executiveSlug: ExecutiveSlug;
  readonly executiveName: string;
  readonly callerPhone: string;
  readonly callerName?: string | null;
  readonly callerEmail?: string | null;
  readonly callerCompany?: string | null;
  readonly transcript: string;
  readonly preferredLanguage?: string | null;
  readonly detectedDialect?: string | null;
  readonly preferredTime?: string | null;
  readonly consent: boolean;
  readonly providerCallId?: string | null;
  readonly handoffEmail?: string | null;
  readonly requestCountForWindow?: number;
  readonly now?: string;
};

export type ReceptionistPreparedLedgerRecord = {
  readonly eventType: "receptionist_inbound_call_processed";
  readonly executiveSlug: ExecutiveSlug;
  readonly metadata: Record<string, string | number | boolean | null>;
};

export type ReceptionistContactGraphUpdate = {
  readonly executiveSlug: ExecutiveSlug;
  readonly callerPhone: string;
  readonly callerName: string | null;
  readonly company: string | null;
  readonly relationshipWeight: number;
  readonly reasonCodes: readonly string[];
};

export type SimulatedInboundCallResult = {
  readonly callEvent: ReceptionistCallEvent;
  readonly providerStatus: ReceptionistStatus;
  readonly languageProfile: LanguageProfile;
  readonly receptionistAction: ReceptionistAction;
  readonly trust: ReturnType<typeof calculateVoiceTrustScore>;
  readonly callbackPriority: ReturnType<typeof calculateCallbackPriorityScore>;
  readonly eventLedgerRecord: ReceptionistPreparedLedgerRecord;
  readonly contactGraphUpdate: ReceptionistContactGraphUpdate;
  readonly summary: ReturnType<typeof toCallSummary>;
  readonly workflowRun: ReturnType<typeof runReceptionistWorkflow>;
  readonly humanApproval: ReturnType<typeof decideReceptionistEscalation>;
  readonly blockedReasonCodes: readonly string[];
};

const languageHints: readonly {
  readonly language: SupportedReceptionistLanguage;
  readonly pattern: RegExp;
  readonly dialect?: string;
}[] = [
  { language: "Spanish", pattern: /\b(hola|reunión|llamada|gracias)\b/i },
  { language: "French", pattern: /\b(bonjour|réunion|appel|merci)\b/i },
  { language: "Arabic", pattern: /[\u0600-\u06FF]/, dialect: "Gulf Arabic" },
  { language: "Mandarin", pattern: /[\u4E00-\u9FFF]/ },
  { language: "Hindi", pattern: /[\u0900-\u097F]/ },
  { language: "Russian", pattern: /[\u0400-\u04FF]/ }
];

function detectCallLanguage(input: {
  readonly transcript: string;
  readonly preferredLanguage?: string | null;
  readonly detectedDialect?: string | null;
}): LanguageProfile {
  const preferredLanguage = supportedReceptionistLanguages.find(
    (language) => language.toLowerCase() === input.preferredLanguage?.toLowerCase()
  );

  if (preferredLanguage) {
    return {
      confidence: 0.92,
      defaulted: false,
      detectedDialect: input.detectedDialect ?? null,
      detectedLanguage: preferredLanguage
    };
  }

  const matched = languageHints.find((hint) => hint.pattern.test(input.transcript));

  if (matched) {
    return {
      confidence: 0.78,
      defaulted: false,
      detectedDialect: input.detectedDialect ?? matched.dialect ?? null,
      detectedLanguage: matched.language
    };
  }

  return {
    confidence: 0.55,
    defaulted: true,
    detectedDialect: input.detectedDialect ?? null,
    detectedLanguage: "English"
  };
}

function estimateUrgencyScore(intent: CallIntent, transcript: string) {
  const text = transcript.toLowerCase();
  const urgent = /\b(urgent|asap|immediately|emergency|critical|today)\b/.test(text);
  const intentScore = intent === "emergency" ? 85 : intent === "legal" || intent === "investor" ? 70 : 45;

  return Math.min(100, intentScore + (urgent ? 20 : 0));
}

function requestTypeFromAction(action: ReceptionistAction): ReceptionistRequest["requestType"] {
  if (action === "book_meeting") {
    return "schedule_meeting";
  }

  if (action === "request_callback" || action === "transfer_call") {
    return "request_callback";
  }

  if (action === "qualify_lead") {
    return "qualify_lead";
  }

  if (action === "request_human_approval") {
    return "route_message";
  }

  return "general_inquiry";
}

function createCallerProfile(input: SimulatedInboundCallInput): CallerProfile {
  return {
    callerId: `caller-${input.callerPhone.replace(/\D/g, "").slice(-10) || randomUUID()}`,
    company: input.callerCompany ?? null,
    email: input.callerEmail ?? null,
    lastContactAt: null,
    name: input.callerName ?? null,
    phone: input.callerPhone,
    repeatContactCount: input.callerCompany ? 1 : 0,
    verifiedIdentity: Boolean(input.callerEmail && input.callerCompany)
  };
}

export function runSimulatedInboundCallWorkflow(
  input: SimulatedInboundCallInput
): SimulatedInboundCallResult {
  const createdAt = input.now ?? new Date().toISOString();
  const languageProfile = detectCallLanguage(input);
  const spamRisk = classifySpamAndAbuseRisk({
    callerPhone: input.callerPhone,
    transcript: input.transcript,
    ...(input.requestCountForWindow === undefined ? {} : { requestCountForWindow: input.requestCountForWindow })
  });
  const intentRouting = routePolyglotCallIntent({ transcript: spamRisk.sanitizedTranscript });
  const caller = createCallerProfile(input);
  const trust = calculateVoiceTrustScore({
    caller,
    companyMatchesExecutiveContext: Boolean(input.callerCompany),
    intent: spamRisk.blocked ? "spam" : intentRouting.intent,
    languageConfidence: languageProfile.confidence,
    sentiment: "neutral",
    spamRiskScore: spamRisk.score
  });
  const policy = createDefaultExecutiveReceptionistPolicy(input.executiveSlug);
  const requestedMeeting = /\b(meeting|calendar|schedule|appointment)\b/i.test(input.transcript);
  const requestedCallback = /\b(call back|callback|return call|phone me)\b/i.test(input.transcript);
  const availability = decideExecutiveAvailability({
    intent: spamRisk.blocked ? "spam" : intentRouting.intent,
    policy,
    requestedCallback,
    requestedMeeting,
    trust
  });
  const urgencyScore = estimateUrgencyScore(intentRouting.intent, input.transcript);
  const callbackPriority = calculateCallbackPriorityScore({
    existingClient: Boolean(input.callerCompany),
    intent: spamRisk.blocked ? "spam" : intentRouting.intent,
    trust,
    urgencyScore
  });
  const memory = createMultilingualConversationMemory({
    actionTaken: availability.action,
    confidenceScore: intentRouting.confidence,
    detectedLanguage: languageProfile.detectedLanguage,
    intent: spamRisk.blocked ? "spam" : intentRouting.intent,
    transcript: spamRisk.sanitizedTranscript
  });
  const humanApproval = decideReceptionistEscalation({
    intent: spamRisk.blocked ? "spam" : intentRouting.intent,
    requestedAction: availability.action,
    trust,
    urgencyScore
  });
  const receptionistRequest: ReceptionistRequest = {
    consent: input.consent as true,
    email: input.callerEmail ?? "caller@example.invalid",
    executiveSlug: input.executiveSlug,
    message: spamRisk.sanitizedTranscript,
    name: input.callerName ?? "Unknown caller",
    phone: input.callerPhone,
    preferredLanguage: languageProfile.detectedLanguage === "Unknown" ? "English" : languageProfile.detectedLanguage === "Russian" || languageProfile.detectedLanguage === "German" || languageProfile.detectedLanguage === "Portuguese" || languageProfile.detectedLanguage === "Cantonese" || languageProfile.detectedLanguage === "Japanese" || languageProfile.detectedLanguage === "Korean" ? "English" : languageProfile.detectedLanguage,
    requestType: requestTypeFromAction(availability.action),
    ...(input.callerCompany ? { company: input.callerCompany } : {}),
    ...(languageProfile.detectedDialect ? { dialect: languageProfile.detectedDialect } : {}),
    ...(input.preferredTime ? { preferredTime: input.preferredTime } : {})
  };
  const providerStatus = resolveVoiceProviderStatus({
    realtimeAgentConfigured: false,
    speechToTextConfigured: false,
    telephonyConfigured: false,
    textToSpeechConfigured: false,
    translationConfigured: false
  });
  const workflowRun = runReceptionistWorkflow({
    executiveName: input.executiveName,
    handoffEmail: input.handoffEmail ?? "contact@theexecutivecard.com",
    providerConfig: {
      calendarConfigured: false,
      calendarDispatchEnabled: false,
      emailConfigured: false,
      emailDispatchEnabled: false,
      telephonyConfigured: false,
      telephonyDispatchEnabled: false
    },
    request: receptionistRequest,
    source: "inbound_call"
  });
  const actionTaken = spamRisk.blocked ? "block_spam" : availability.action;
  const callEvent: ReceptionistCallEvent = {
    actionTaken,
    callerPhone: input.callerPhone,
    createdAt,
    detectedLanguage: languageProfile.detectedLanguage,
    executiveId: input.executiveSlug,
    followUpRequired: actionTaken !== "block_spam",
    id: input.providerCallId ?? `call-${randomUUID()}`,
    intent: spamRisk.blocked ? "spam" : intentRouting.intent,
    summary: memory.summary,
    transcriptEnglish: memory.translatedTranscript ?? memory.summary,
    transcriptOriginal: memory.originalTranscript,
    trustScore: trust.score,
    urgencyScore,
    ...(languageProfile.detectedDialect ? { detectedDialect: languageProfile.detectedDialect } : {})
  };

  return {
    blockedReasonCodes: [...new Set([...spamRisk.reasonCodes, ...workflowRun.blockedReasonCodes])],
    callEvent,
    callbackPriority,
    contactGraphUpdate: {
      callerName: caller.name,
      callerPhone: caller.phone,
      company: caller.company,
      executiveSlug: input.executiveSlug,
      reasonCodes: trust.reasonCodes,
      relationshipWeight: Math.max(1, Math.round((trust.score + urgencyScore) / 20))
    },
    eventLedgerRecord: {
      eventType: "receptionist_inbound_call_processed",
      executiveSlug: input.executiveSlug,
      metadata: {
        actionTaken,
        callbackPriorityScore: callbackPriority.score,
        intent: callEvent.intent,
        providerStatus: providerStatus.status,
        trustScore: trust.score,
        urgencyScore
      }
    },
    humanApproval,
    languageProfile,
    providerStatus: spamRisk.blocked ? "blocked_by_policy" : workflowRun.providerStatus,
    receptionistAction: actionTaken,
    summary: toCallSummary(memory),
    trust,
    workflowRun
  };
}
