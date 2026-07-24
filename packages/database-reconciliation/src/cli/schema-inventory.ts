import { collectSchemaInventory } from "../schema-inventory.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required in the process environment.");
  process.exit(1);
}

const report = await collectSchemaInventory(connectionString);
console.log(JSON.stringify(report, null, 2));
