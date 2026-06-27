export type TwimlResponseOptions = {
  readonly testMode: boolean;
  readonly message?: string;
  readonly gatherDigits?: boolean;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function generateSafeTwimlResponse({
  gatherDigits = false,
  message,
  testMode
}: TwimlResponseOptions) {
  const safeMessage =
    message ??
    (testMode
      ? "BidayaX reception test mode is active. This call will end safely."
      : "BidayaX reception is being prepared. This call will end safely.");
  const say = `<Say>${escapeXml(safeMessage)}</Say>`;

  if (testMode && gatherDigits) {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<Response>",
      '<Gather numDigits="1" timeout="3">',
      say,
      "</Gather>",
      "<Hangup/>",
      "</Response>"
    ].join("");
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Response>",
    say,
    "<Hangup/>",
    "</Response>"
  ].join("");
}

