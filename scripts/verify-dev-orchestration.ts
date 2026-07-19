import { readFileSync } from "node:fs";
import { join } from "node:path";

type PackageJson = {
  readonly scripts?: Record<string, string>;
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

const root = process.cwd();
const rootPackageJson = readJson<PackageJson>(join(root, "package.json"));
const cardPackageJson = readJson<PackageJson>(join(root, "apps", "card", "package.json"));
const dashboardPackageJson = readJson<PackageJson>(join(root, "apps", "dashboard", "package.json"));

const expectedRootDev =
  "pnpm -r --parallel --stream --filter @bidayax/card --filter @bidayax/dashboard dev";
const expectedRootDevAll = "pnpm -r --parallel --stream --if-present dev";
const errors: string[] = [];

if (rootPackageJson.scripts?.dev !== expectedRootDev) {
  errors.push(`Root dev script must equal: ${expectedRootDev}`);
}

if (rootPackageJson.scripts?.["dev:all"] !== expectedRootDevAll) {
  errors.push(`Root dev:all script must equal: ${expectedRootDevAll}`);
}

for (const [name, command] of Object.entries(rootPackageJson.scripts ?? {})) {
  if (!name.startsWith("dev")) {
    continue;
  }

  if (command.includes("turbo run dev")) {
    errors.push(`Root script ${name} must not invoke turbo run dev on Windows.`);
  }

  if (name === "dev" && /\bpnpm\s+dev\b/.test(command)) {
    errors.push("Root dev script must not recursively invoke itself.");
  }
}

if (!cardPackageJson.scripts?.dev) {
  errors.push("@bidayax/card must expose a dev script.");
}

if (!dashboardPackageJson.scripts?.dev) {
  errors.push("@bidayax/dashboard must expose a dev script.");
}

if (errors.length > 0) {
  console.error(
    JSON.stringify({
      component: "dev-orchestration-verifier",
      errors,
      event: "dev_orchestration_verification_failed",
      status: "failed"
    })
  );
  process.exit(1);
}

console.info(
  JSON.stringify({
    component: "dev-orchestration-verifier",
    devAllScript: rootPackageJson.scripts?.["dev:all"],
    devScript: rootPackageJson.scripts?.dev,
    event: "dev_orchestration_verification_passed",
    status: "passed"
  })
);
