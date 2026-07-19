export type SuppressionDecision = {
  readonly suppressed: boolean;
  readonly reasonCodes: readonly string[];
  readonly suppressionId: string | null;
  readonly expiresAt: string | null;
};
