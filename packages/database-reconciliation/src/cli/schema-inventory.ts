import { collectSchemaInventory } from "../schema-inventory.js";

const connectionString = process.argv[2] ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL or an explicit connection string argument is required.");
  process.exit(1);
}

const report = await collectSchemaInventory(connectionString);
console.log(JSON.stringify(report, null, 2));
