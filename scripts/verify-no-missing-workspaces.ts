import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, normalize } from "node:path";

type PackageJson = {
  readonly name?: string;
  readonly scripts?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
};

const workspaceRoots = ["apps", "packages", "services"];
const root = process.cwd();
const errors: string[] = [];

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function listPackageJsonPaths() {
  const paths: string[] = [join(root, "package.json")];

  for (const workspaceRoot of workspaceRoots) {
    const absoluteRoot = join(root, workspaceRoot);

    if (!existsSync(absoluteRoot)) {
      continue;
    }

    for (const entry of readdirSync(absoluteRoot)) {
      const packageJsonPath = join(absoluteRoot, entry, "package.json");

      if (existsSync(packageJsonPath) && statSync(packageJsonPath).isFile()) {
        paths.push(packageJsonPath);
      }
    }
  }

  return paths;
}

const packageJsonPaths = listPackageJsonPaths();
const workspacePackageNames = new Set<string>();
const packages = new Map<string, PackageJson>();

for (const packageJsonPath of packageJsonPaths) {
  const packageJson = readJson<PackageJson>(packageJsonPath);
  packages.set(packageJsonPath, packageJson);

  if (packageJson.name) {
    workspacePackageNames.add(packageJson.name);
  }
}

for (const [packageJsonPath, packageJson] of packages) {
  const dependencySets = [
    packageJson.dependencies ?? {},
    packageJson.devDependencies ?? {},
    packageJson.peerDependencies ?? {}
  ];

  for (const dependencySet of dependencySets) {
    for (const [dependencyName, version] of Object.entries(dependencySet)) {
      if (version.startsWith("workspace:") && !workspacePackageNames.has(dependencyName)) {
        errors.push(
          `${normalize(packageJsonPath)} references missing workspace dependency ${dependencyName}.`
        );
      }
    }
  }
}

const rootPackageJson = readJson<PackageJson>(join(root, "package.json"));

for (const [scriptName, scriptCommand] of Object.entries(rootPackageJson.scripts ?? {})) {
  const scriptFileMatches = scriptCommand.matchAll(/\bscripts\/([A-Za-z0-9._-]+)/g);

  for (const match of scriptFileMatches) {
    const scriptPath = join(root, "scripts", match[1]);

    if (!existsSync(scriptPath)) {
      errors.push(`Root script ${scriptName} references missing file scripts/${match[1]}.`);
    }
  }

  const filterMatches = scriptCommand.matchAll(/--filter\s+(@[A-Za-z0-9._/-]+)/g);

  for (const match of filterMatches) {
    if (!workspacePackageNames.has(match[1])) {
      errors.push(`Root script ${scriptName} references missing workspace package ${match[1]}.`);
    }
  }
}

const typeIndexPath = join(root, "packages", "types", "src", "index.ts");

if (existsSync(typeIndexPath)) {
  const typeIndex = readFileSync(typeIndexPath, "utf8");
  const exportMatches = typeIndex.matchAll(/from\s+"\.\/([^"]+)"/g);

  for (const match of exportMatches) {
    const exportPath = join(root, "packages", "types", "src", `${match[1]}.ts`);

    if (!existsSync(exportPath)) {
      errors.push(`packages/types/src/index.ts exports missing module ${match[1]}.`);
    }
  }
}

if (errors.length > 0) {
  console.error(
    JSON.stringify({
      component: "workspace-verifier",
      errors,
      event: "workspace_verification_failed",
      status: "failed"
    })
  );
  process.exit(1);
}

console.info(
  JSON.stringify({
    checkedPackages: packageJsonPaths.length,
    component: "workspace-verifier",
    event: "workspace_verification_passed",
    status: "passed"
  })
);
