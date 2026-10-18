import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import type { Database } from "./index";
import * as schema from "./schema";

/** Cloudflare D1. Migrations are applied by `wrangler d1 migrations apply`. */
export function createD1Db(d1: D1Database): Database {
  return drizzle(d1, { schema });
}
