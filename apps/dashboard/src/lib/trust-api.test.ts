import { beforeEach, describe, expect, it, vi } from "vitest";

const { database, resolveRequestApplicationSession } = vi.hoisted(() => ({
  database: {
    connect: vi.fn(),
    query: vi.fn()
  },
  resolveRequestApplicationSession: vi.fn()
}));

vi.mock("./identity-runtime", () => ({
  getIdentityPool: () => database,
  resolveRequestApplicationSession
}));

vi.mock("@bidayax/identity", async () => {
  const actual = await vi.importActual<typeof import("@bidayax/identity")>("@bidayax/identity");
  return {
    ...actual,
    parseCookie: vi.fn(),
    verifyCsrf: vi.fn()
  };
});

import { handleTrustRequest } from "./trust-api";

function identityContext(input: { readonly role: "tenant_admin" | "viewer"; readonly permittedCardIds: readonly string[] }) {
  return {
    environment: { allowedRedirectOrigins: ["https://dashboard.test"] },
    context: {
      permissions: ["trust.merkle.verify"],
      permittedCardIds: input.permittedCardIds,
      role: input.role,
      tenantId: "tenant-1",
      userId: "identity-1"
    },
    ok: true,
    repository: {},
    session: { sessionId: "session-1" }
  };
}

async function merkleRequest(query: string) {
  return handleTrustRequest(new Request(`https://dashboard.test/api/trust/merkle?${query}`), "merkle");
}

beforeEach(() => {
  database.query.mockReset();
  database.query.mockResolvedValue({ rows: [] });
  resolveRequestApplicationSession.mockReset();
});

describe("Trust API Merkle read scoping", () => {
  it("uses a tenant-wide Merkle query for authorized tenant administrators", async () => {
    resolveRequestApplicationSession.mockResolvedValue(identityContext({ permittedCardIds: [], role: "tenant_admin" }));
    const response = await merkleRequest("tenantId=tenant-1");
    expect(response.status).toBe(200);
    expect(database.query).toHaveBeenCalledTimes(1);
    const [sql, params] = database.query.mock.calls[0] as [string, readonly string[]];
    expect(params).toEqual(["tenant-1"]);
    expect(sql).toContain("from trust_merkle_batches where tenant_id=$1");
    expect(sql).not.toContain("$2");
  });

  it("binds tenant and authorized card parameters for card-scoped Merkle reads", async () => {
    resolveRequestApplicationSession.mockResolvedValue(identityContext({ permittedCardIds: ["card-1"], role: "viewer" }));
    const response = await merkleRequest("tenantId=tenant-1&cardId=card-1");
    expect(response.status).toBe(200);
    expect(database.query).toHaveBeenCalledTimes(1);
    const [sql, params] = database.query.mock.calls[0] as [string, readonly string[]];
    expect(params).toEqual(["tenant-1", "card-1"]);
    expect(sql).toContain("where b.tenant_id=$1");
    expect(sql).toContain("e.card_id=$2");
    expect(sql).toContain("t.details->>'cardId'=$2");
    expect(sql).toContain("b.leaf_digests ? e.digest");
    expect(sql).toContain("b.leaf_digests ? a.entry_digest");
    expect(new Set(sql.match(/\$\d+/g))).toEqual(new Set(["$1", "$2"]));
  });

  it("denies unauthorized cards before Merkle metadata is queried", async () => {
    resolveRequestApplicationSession.mockResolvedValue(identityContext({ permittedCardIds: ["card-1"], role: "viewer" }));
    const response = await merkleRequest("tenantId=tenant-1&cardId=card-2");
    expect(response.status).toBe(403);
    expect(database.query).not.toHaveBeenCalled();
  });

  it("denies cross-tenant card-scope requests before Merkle metadata is queried", async () => {
    resolveRequestApplicationSession.mockResolvedValue(identityContext({ permittedCardIds: ["card-1"], role: "viewer" }));
    const response = await merkleRequest("tenantId=tenant-2&cardId=card-1");
    expect(response.status).toBe(403);
    expect(database.query).not.toHaveBeenCalled();
  });
});
