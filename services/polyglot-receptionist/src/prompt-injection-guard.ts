const unsafeInstructionPatterns = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /reveal\s+(the\s+)?(secret|api\s*key|token|password)/i,
  /bypass\s+(policy|safety|guardrails?)/i,
  /jailbreak/i,
  /prompt\s*injection/i,
  /<script\b/i,
  /javascript:/i,
  /data:text\/html/i
] as const;

export type PromptInjectionAssessment = {
  readonly blocked: boolean;
  readonly sanitizedText: string;
  readonly reasonCodes: readonly string[];
};

export function sanitizeReceptionistText(value: string) {
  return Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127 ? " " : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function assessPromptInjection(value: string): PromptInjectionAssessment {
  const sanitizedText = sanitizeReceptionistText(value);
  const reasonCodes = unsafeInstructionPatterns.flatMap((pattern) =>
    pattern.test(sanitizedText) ? ["prompt_attack_pattern"] : []
  );

  return {
    blocked: reasonCodes.length > 0,
    reasonCodes: [...new Set(reasonCodes)],
    sanitizedText
  };
}

