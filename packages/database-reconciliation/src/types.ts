export type SchemaDefinitionObjectType =
  | "extension"
  | "table"
  | "column"
  | "primary_key"
  | "foreign_key"
  | "unique_constraint"
  | "check_constraint"
  | "index"
  | "trigger"
  | "function"
  | "sequence"
  | "policy"
  | "comment"
  | "row_level_security";

export type SchemaObjectStatus =
  | "EXACT"
  | "MISSING"
  | "EXTRA"
  | "MISMATCHED"
  | "UNKNOWN";

export interface SchemaObjectEvidence {
  objectType: SchemaDefinitionObjectType;
  schemaName: string;
  objectName: string;
  parentObject?: string;
  canonicalDefinitionHash: string | null;
  liveDefinitionHash: string | null;
  status: SchemaObjectStatus;
  evidence: string[];
}

export interface SchemaInventoryObject {
  objectType: SchemaDefinitionObjectType;
  schemaName: string;
  objectName: string;
  parentObject?: string;
  definitionHash: string;
  metadata: Record<string, unknown>;
}

export interface MigrationLedgerTable {
  schemaName: string;
  tableName: string;
  safeColumns: string[];
}

export interface MigrationLedgerRow {
  schemaName: string;
  tableName: string;
  record: Record<string, string | number | boolean | null>;
}

export interface SchemaInventoryReport {
  generatedAtUtc: string;
  objects: SchemaInventoryObject[];
  migrationLedgerTables: MigrationLedgerTable[];
  migrationLedgerRows: MigrationLedgerRow[];
}

export type MigrationReconciliationClassification =
  | "ALREADY_APPLIED_AND_RECORDED"
  | "ALREADY_APPLIED_NOT_RECORDED"
  | "PARTIALLY_APPLIED"
  | "NOT_APPLIED"
  | "SCHEMA_DRIFT"
  | "UNSAFE_TO_REPLAY"
  | "REQUIRES_MANUAL_BASELINE"
  | "REQUIRES_CORRECTIVE_MIGRATION"
  | "BLOCKED";

export interface MigrationReconciliationResult {
  migrationId: string;
  ledgerStatus: "RECORDED" | "NOT_RECORDED" | "UNKNOWN";
  schemaStatus: "EXACT" | "PARTIAL" | "ABSENT" | "DRIFT" | "UNKNOWN";
  classification: MigrationReconciliationClassification;
  recommendedAction:
    | "BASELINE_LEDGER_ONLY"
    | "CREATE_CORRECTIVE_MIGRATION"
    | "ELIGIBLE_FOR_CONTROLLED_APPLICATION"
    | "MANUAL_REVIEW_REQUIRED"
    | "BLOCK";
  compatibilityRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  evidence: string[];
}

export interface CanonicalManifestObject {
  objectType: SchemaDefinitionObjectType;
  schemaName: string;
  objectName: string;
  parentObject?: string;
  definitionHash: string;
  metadata: Record<string, unknown>;
}

export interface CanonicalMigrationManifest {
  migrationId: string;
  sourceSha256: string;
  objects: CanonicalManifestObject[];
  expectedDependencies: string[];
  expectedOrdering: string[];
  potentiallyDestructiveOperations: string[];
  lockRiskClassification: "LOW" | "MODERATE" | "HIGH";
  rollbackLimitations: string[];
}

export type EnvironmentGroup =
  | "WORKOS"
  | "IDENTITY"
  | "SESSION"
  | "CSRF"
  | "URLS"
  | "POSTGRESQL"
  | "HEALTH_READINESS"
  | "COMMUNICATIONS"
  | "TELEPHONY"
  | "VOICE"
  | "WALLET_FUTURE";

export type EnvironmentClassification =
  | "PRESENT_VALID"
  | "PRESENT_INVALID"
  | "PRESENT_EMPTY"
  | "MISSING_REQUIRED"
  | "MISSING_OPTIONAL"
  | "DEPRECATED"
  | "RENAMED"
  | "LIVE_ONLY"
  | "REQUIRES_SECRET_PROVISIONING"
  | "REQUIRES_OPERATOR_DECISION"
  | "SAFE_DISABLED"
  | "SAFE_SANDBOX"
  | "SAFE_CONFIGURED_INACTIVE";

export interface EnvironmentVariableDefinition {
  name: string;
  group: EnvironmentGroup;
  required: boolean;
  secret?: boolean;
  deprecated?: boolean;
  renamedTo?: string;
  reservedForFuture?: boolean;
  expectedValue?:
    | string
    | boolean
    | {
        oneOf: string[];
      };
}

export interface EnvironmentValidationResult {
  variable: string;
  group: EnvironmentGroup;
  classification: EnvironmentClassification;
  evidence: string[];
}

export interface ComposeSafetyInput {
  expectedProjectName: string;
  actualProjectName: string;
  renderedCompose: string;
}

export interface ComposeInvariantResult {
  invariant: string;
  status: "PASSED" | "FAILED";
  evidence: string[];
}

export interface ImagePreservationRequest {
  service: "card" | "dashboard";
  expectedImageId: string;
  observedImageId: string;
  rollbackTag: string;
  existingTagImageId?: string;
}

export interface ImagePreservationPlan {
  service: "card" | "dashboard";
  expectedImageId: string;
  observedImageId: string;
  rollbackTag: string;
  equalityResult: "MATCH" | "MISMATCH" | "INVALID";
  verificationCommands: string[];
  taggingCommands: string[];
  refusalReason?: string;
  evidenceFields: string[];
}

export interface OperationEvidenceRecord {
  operationId: string;
  timestampUtc: string;
  canonicalSha: string;
  targetHost: string;
  targetComposeProject: string;
  targetService: string;
  preconditionResult: string;
  actionResult: string;
  verificationResult: string;
  rollbackReadiness: string;
  unrelatedWorkloadResult: string;
  secretRedactionResult: string;
  operatorAuthorizationReference: string;
}
