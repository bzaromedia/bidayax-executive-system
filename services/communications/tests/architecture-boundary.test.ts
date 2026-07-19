import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { forbiddenCommunicationsImports } from "../src/adapters";

function walk(directory: string): readonly string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    return stats.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

describe("communications architecture boundary", () => {
  it("does not import telephony implementations or provider SDKs", () => {
    const sourceRoot = resolve(process.cwd(), "src");
    const sourceFiles = walk(sourceRoot).filter((file) => file.endsWith(".ts"));
    const importSpecifiers = sourceFiles.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const matches = source.matchAll(
        /\b(?:import|export)\b[\s\S]*?\bfrom\s+["']([^"']+)["']/g
      );

      return Array.from(matches, (match) => match[1]);
    });

    for (const forbiddenImport of forbiddenCommunicationsImports) {
      for (const specifier of importSpecifiers) {
        expect(specifier).not.toContain(forbiddenImport);
      }
    }
  });
});