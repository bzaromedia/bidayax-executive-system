import { validateEnvironmentFile } from "../environment-contract.js";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Environment file path is required.");
  process.exit(1);
}

console.log(JSON.stringify(validateEnvironmentFile(filePath), null, 2));
