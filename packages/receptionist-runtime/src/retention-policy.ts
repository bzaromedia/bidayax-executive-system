import type { RuntimeRetentionPolicy, RuntimeRetentionResolution } from "./types";

export const defaultRuntimeRetentionPolicy: RuntimeRetentionPolicy = {
  auditEventRetentionDays: 365,
  rawAudioRetentionAllowed: false,
  recordingRetentionDays: 0,
  transcriptPreviewRetentionDays: 30
};

export function resolveRuntimeRetentionPolicy(policy?: RuntimeRetentionPolicy): RuntimeRetentionResolution {
  const resolved = {
    ...defaultRuntimeRetentionPolicy,
    ...policy
  };
  const reasonCodes: string[] = [];

  if (resolved.rawAudioRetentionAllowed) {
    reasonCodes.push("RAW_AUDIO_RETENTION_BLOCKED_IN_PHASE_9");
  }

  if (resolved.recordingRetentionDays > 0 && !resolved.rawAudioRetentionAllowed) {
    reasonCodes.push("RECORDING_RETENTION_METADATA_ONLY");
  }

  if (resolved.transcriptPreviewRetentionDays > resolved.auditEventRetentionDays) {
    reasonCodes.push("TRANSCRIPT_RETENTION_EXCEEDS_AUDIT_RETENTION");
  }

  return {
    allowed: !reasonCodes.includes("RAW_AUDIO_RETENTION_BLOCKED_IN_PHASE_9"),
    policy: resolved,
    reasonCodes: reasonCodes.length > 0 ? reasonCodes : ["RETENTION_POLICY_VALIDATED"]
  };
}
