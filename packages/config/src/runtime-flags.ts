export function readBooleanFlag(
  value: string | undefined,
  fallback: boolean
) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

export function readStringFlag(value: string | undefined) {
  if (value === undefined || value.trim() === "") {
    return null;
  }

  return value;
}

export function maskSecret(value: string | null | undefined) {
  if (!value) {
    return "not_set";
  }

  return "set";
}

export function maskPhoneNumber(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  const lastFour = digits.slice(-4);

  return lastFour ? `***-***-${lastFour}` : "masked";
}

