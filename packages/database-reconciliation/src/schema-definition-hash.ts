import { sha256, stableJson } from "./hash.js";
import { normalizeSchemaObject } from "./schema-normalization.js";
import type { CanonicalManifestObject, SchemaInventoryObject } from "./types.js";

export function buildSchemaDefinitionHash(object: CanonicalManifestObject | SchemaInventoryObject): string {
  return sha256(stableJson(normalizeSchemaObject(object)));
}
