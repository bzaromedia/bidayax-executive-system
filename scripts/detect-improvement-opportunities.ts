import pg from "pg";

type Opportunity = {
  readonly baselineValue: number;
  readonly evidenceSummary: string;
  readonly opportunityType: string;
  readonly severity: string;
  readonly sourceMetric: string;
  readonly status: string;
  readonly subsystem: string;
};

function detectImprovementOpportunities(evidence: {
  readonly averageApiLatencyMs: number;
  readonly apiRequestCount: number;
  readonly errorCount: number;
  readonly safetyGateBlockCount: number;
  readonly cardViewCount: number;
  readonly cardActionCount: number;
  readonly configurationErrorCount: number;
  readonly telephonyReadinessFailureCount: number;
}): readonly Opportunity[] {
  const opportunities: Opportunity[] = [];

  if (evidence.apiRequestCount >= 5 && evidence.averageApiLatencyMs > 750) {
    opportunities.push({
      baselineValue: evidence.averageApiLatencyMs,
      evidenceSummary: `Average API latency is ${Math.round(evidence.averageApiLatencyMs)}ms across ${evidence.apiRequestCount} measured requests.`,
      opportunityType: "performance",
      severity: evidence.averageApiLatencyMs > 1500 ? "high" : "medium",
      sourceMetric: "api_latency_ms",
      status: "detected",
      subsystem: "system"
    });
  }

  if (evidence.safetyGateBlockCount >= 3) {
    opportunities.push({
      baselineValue: evidence.safetyGateBlockCount,
      evidenceSummary: `${evidence.safetyGateBlockCount} safety gate blocks were recorded.`,
      opportunityType: "safety_gate",
      severity: evidence.safetyGateBlockCount >= 10 ? "high" : "medium",
      sourceMetric: "safety_gate_blocks",
      status: "detected",
      subsystem: "security"
    });
  }

  if (evidence.errorCount >= 3) {
    opportunities.push({
      baselineValue: evidence.errorCount,
      evidenceSummary: `${evidence.errorCount} normalized error telemetry records were detected.`,
      opportunityType: "reliability",
      severity: evidence.errorCount >= 20 ? "high" : "medium",
      sourceMetric: "telemetry_error_events",
      status: "detected",
      subsystem: "system"
    });
  }

  if (evidence.cardViewCount >= 20) {
    const conversionRate = evidence.cardActionCount / evidence.cardViewCount;

    if (conversionRate < 0.08) {
      opportunities.push({
        baselineValue: Number(conversionRate.toFixed(4)),
        evidenceSummary: `${evidence.cardViewCount} card views produced ${evidence.cardActionCount} action events.`,
        opportunityType: "conversion",
        severity: conversionRate < 0.03 ? "high" : "medium",
        sourceMetric: "card_action_conversion",
        status: "detected",
        subsystem: "card"
      });
    }
  }

  if (evidence.configurationErrorCount >= 2) {
    opportunities.push({
      baselineValue: evidence.configurationErrorCount,
      evidenceSummary: `${evidence.configurationErrorCount} configuration-related errors suggest documentation needs clarification.`,
      opportunityType: "documentation",
      severity: "medium",
      sourceMetric: "configuration_error_count",
      status: "detected",
      subsystem: "documentation"
    });
  }

  if (evidence.telephonyReadinessFailureCount >= 2) {
    opportunities.push({
      baselineValue: evidence.telephonyReadinessFailureCount,
      evidenceSummary: `${evidence.telephonyReadinessFailureCount} telephony readiness failures were recorded.`,
      opportunityType: "telephony_readiness",
      severity: "high",
      sourceMetric: "telephony_readiness_failures",
      status: "detected",
      subsystem: "telephony"
    });
  }

  return opportunities;
}

const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  console.error(
    JSON.stringify({
      component: "improvement-detector",
      event: "database_url_missing",
      status: "not_ready"
    })
  );
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 1,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

try {
  const result = await pool.query<{
    readonly average_api_latency_ms: string | number | null;
    readonly api_request_count: string | number;
    readonly error_count: string | number;
    readonly safety_gate_block_count: string | number;
    readonly card_view_count: string | number;
    readonly card_action_count: string | number;
    readonly configuration_error_count: string | number;
    readonly telephony_readiness_failure_count: string | number;
  }>(
    `
      select
        coalesce((select avg(metric_value) from telemetry_metrics where metric_name in ('api_latency_ms', 'dashboard_query_duration_ms')), 0) as average_api_latency_ms,
        (select count(*)::bigint from telemetry_events where event_name in ('api_request_completed', 'api_request_failed')) as api_request_count,
        (select count(*)::bigint from telemetry_error_events) as error_count,
        (select count(*)::bigint from telemetry_safety_gate_events where decision = 'blocked') as safety_gate_block_count,
        (select count(*)::bigint from telemetry_events where event_name = 'interaction_event_created' and metadata->>'eventType' = 'card_view') as card_view_count,
        (select count(*)::bigint from telemetry_events where event_name = 'interaction_event_created' and metadata->>'eventType' in ('vcard_download', 'call_click', 'email_click', 'website_click')) as card_action_count,
        (select count(*)::bigint from telemetry_error_events where error_category = 'configuration' or safe_message ilike '%configuration%' or safe_message ilike '%DATABASE_URL%') as configuration_error_count,
        (select count(*)::bigint from telemetry_events where event_name = 'telephony_readiness_checked' and status in ('blocked', 'failure', 'degraded')) as telephony_readiness_failure_count
    `
  );
  const row = result.rows[0];
  const numeric = (value: string | number | null) =>
    value === null ? 0 : typeof value === "number" ? value : Number.parseFloat(value);
  const opportunities = detectImprovementOpportunities({
    apiRequestCount: numeric(row.api_request_count),
    averageApiLatencyMs: numeric(row.average_api_latency_ms),
    cardActionCount: numeric(row.card_action_count),
    cardViewCount: numeric(row.card_view_count),
    configurationErrorCount: numeric(row.configuration_error_count),
    errorCount: numeric(row.error_count),
    safetyGateBlockCount: numeric(row.safety_gate_block_count),
    telephonyReadinessFailureCount: numeric(row.telephony_readiness_failure_count)
  });

  for (const opportunity of opportunities) {
    await pool.query(
      `
        insert into improvement_opportunities (
          subsystem,
          opportunity_type,
          evidence_summary,
          source_metric,
          baseline_value,
          severity,
          status
        )
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        opportunity.subsystem,
        opportunity.opportunityType,
        opportunity.evidenceSummary,
        opportunity.sourceMetric,
        opportunity.baselineValue,
        opportunity.severity,
        opportunity.status
      ]
    );
  }

  console.info(
    JSON.stringify({
      component: "improvement-detector",
      event: "improvement_opportunities_detected",
      opportunityCount: opportunities.length,
      status: "success"
    })
  );
} catch {
  console.error(
    JSON.stringify({
      component: "improvement-detector",
      event: "improvement_detection_failed",
      status: "failure"
    })
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
