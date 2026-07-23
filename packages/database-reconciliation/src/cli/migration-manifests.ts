import { join } from "node:path";

import { buildCanonicalMigrationManifest } from "../migration-parser.js";

const repoRoot = process.cwd();
const migrationIds = [
  "0014_create_settings_persistence_layer.sql",
  "0015_create_identity_provider_integration.sql",
  "0016_create_telephony_domain_foundation.sql",
  "0017_create_cryptographic_trust_layer.sql"
];

const manifests = migrationIds.map((migrationId) =>
  buildCanonicalMigrationManifest(migrationId, join(repoRoot, "database", "migrations", migrationId))
);

console.log(JSON.stringify(manifests, null, 2));
