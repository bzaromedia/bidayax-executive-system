import { validateComposeSafetyFile } from "../compose-safety.js";

const filePath = process.argv[2];
const actualProjectName = process.argv[3];

if (!filePath || !actualProjectName) {
  console.error("Usage: compose-safety <rendered-compose-file> <actual-project-name>");
  process.exit(1);
}

console.log(JSON.stringify(validateComposeSafetyFile(filePath, actualProjectName), null, 2));
