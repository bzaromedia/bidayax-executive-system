import { rebuildContactGraph } from "./graph-queries";

export {
  buildGraphFromEvents,
  type BuildGraphFromEventsInput
} from "./build-graph-from-events";
export { graphEdgeTypes } from "./graph-edge-types";
export {
  executiveStableKey,
  graphNodeTypes,
  interactionEventStableKey,
  intentScoreStableKey,
  sessionStableKey,
  visitorStableKey
} from "./graph-node-types";
export {
  createEngagementSummary,
  createGraphSnapshot
} from "./graph-snapshot";
export {
  type RebuildContactGraphOptions,
  type RebuildContactGraphResult
} from "./graph-queries";
export { rebuildContactGraph } from "./graph-queries";

function logGraphCliEvent(
  level: "info" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "executive-contact-graph-cli",
      event,
      ...details
    })
  );
}

if (process.argv[1]?.endsWith("index.js")) {
  rebuildContactGraph()
    .then((result) => {
      logGraphCliEvent("info", "database_write_success", {
        edgeCount: result.edges.length,
        nodeCount: result.nodes.length,
        snapshotCount: result.snapshots.length
      });
    })
    .catch(() => {
      logGraphCliEvent("error", "database_write_failure");
      process.exitCode = 1;
    });
}
