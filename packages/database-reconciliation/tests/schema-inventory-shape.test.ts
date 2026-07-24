import { describe, expect, it } from "vitest";

import { createSchemaInventorySql } from "../src/schema-inventory.js";

describe("schema inventory queries", () => {
  it("exposes the required inventory categories", () => {
    const queries = createSchemaInventorySql();

    expect(Object.keys(queries).sort()).toEqual([
      "columns",
      "comments",
      "constraints",
      "extensions",
      "functions",
      "indexes",
      "policies",
      "rowLevelSecurity",
      "sequences",
      "tables",
      "triggers"
    ]);
  });
});
