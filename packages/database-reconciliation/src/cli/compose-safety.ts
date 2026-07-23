import { validateComposeSafetyFile } from "../compose-safety.js";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Compose file path is required.");
  process.exit(1);
}

console.log(JSON.stringify(validateComposeSafetyFile(filePath), null, 2));
