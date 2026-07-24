import { sha256, stableJson } from "./hash.ts";
import { normalizeSchemaObject } from "./schema-normalization.ts";
import type { CanonicalManifestObject, SchemaInventoryObject } from "./types.ts";

export function buildSchemaDefinitionHash(object: CanonicalManifestObject | SchemaInventoryObject): string {
  return sha256(stableJson(normalizeSchemaObject(object)));
}
