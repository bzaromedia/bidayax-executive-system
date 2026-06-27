export type SafeErrorResponse = {
  readonly error: string;
  readonly code: string;
  readonly status: number;
};

export function createSafeErrorResponse({
  code,
  fallbackMessage,
  isValidationError = false,
  status = 500
}: {
  readonly code: string;
  readonly fallbackMessage: string;
  readonly isValidationError?: boolean;
  readonly status?: number;
}): SafeErrorResponse {
  return {
    code,
    error: isValidationError ? fallbackMessage : "The request could not be completed safely.",
    status
  };
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

