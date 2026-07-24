import { validateComposeSafetyFile } from "../compose-safety.ts";

const filePath = process.argv[2];
const actualProjectName = process.argv[3];
const expectedProjectName = process.argv[4];

if (!filePath || !actualProjectName) {
  console.error("Usage: compose-safety <rendered-compose-file> <actual-project-name> [expected-project-name]");
  process.exit(1);
}

const results = validateComposeSafetyFile(filePath, actualProjectName, expectedProjectName);
console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.status === "FAILED")) {
  process.exit(2);
}
