import { defineConfig } from "drizzle-kit";

// Only generates SQL. Migrations are applied by wrangler (see apps/api/wrangler.jsonc).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema/index.ts",
  out: "./migrations",
});
