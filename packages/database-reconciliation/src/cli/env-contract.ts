import { validateEnvironmentFile } from "../environment-contract.ts";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Environment file path is required.");
  process.exit(1);
}

const results = validateEnvironmentFile(filePath);
console.log(JSON.stringify(results, null, 2));

const blockingClassifications = new Set([
  "PRESENT_INVALID",
  "PRESENT_EMPTY",
  "MISSING_REQUIRED",
  "DEPRECATED",
  "RENAMED",
  "LIVE_ONLY",
  "REQUIRES_SECRET_PROVISIONING",
  "REQUIRES_OPERATOR_DECISION"
]);

if (results.some((result) => blockingClassifications.has(result.classification))) {
  process.exit(2);
}
