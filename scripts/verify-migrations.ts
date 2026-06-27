import { readdir } from "node:fs/promises";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "database", "migrations");
const migrationPattern = /^(\d{4})_[a-z0-9_]+\.sql$/;

const files = (await readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

const errors: string[] = [];
const seenNumbers = new Set<string>();

for (const file of files) {
  const match = migrationPattern.exec(file);

  if (!match) {
    errors.push(`${file} does not match 0000_name.sql.`);
    continue;
  }

  const number = match[1];

  if (seenNumbers.has(number)) {
    errors.push(`Migration number ${number} is duplicated.`);
  }

  seenNumbers.add(number);
}

const expectedNumbers = Array.from(seenNumbers).sort();

expectedNumbers.forEach((number, index) => {
  const expected = String(index + 1).padStart(4, "0");

  if (number !== expected) {
    errors.push(`Expected migration ${expected}, found ${number}.`);
  }
});

if (errors.length > 0) {
  console.error(
    JSON.stringify({
      component: "migration-verifier",
      errors,
      event: "migration_verification_failed",
      status: "failed"
    })
  );
  process.exit(1);
}

console.info(
  JSON.stringify({
    component: "migration-verifier",
    event: "migration_verification_passed",
    migrationCount: files.length,
    status: "passed"
  })
);

