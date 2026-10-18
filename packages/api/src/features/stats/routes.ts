import { monthlySummaryQuerySchema } from "@grimo/core";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../env";
import { requireUser } from "../../lib/context";
import { getMonthlySummary, getYearOverview } from "./service";

export const statsRoutes = new Hono<AppEnv>()
  .get(
    "/overview",
    zValidator("query", z.object({ year: z.coerce.number().int().optional() })),
    async (c) => {
      const user = requireUser(c);
      const year = c.req.valid("query").year ?? new Date().getUTCFullYear();
      return c.json(await getYearOverview(c.get("db"), user.id, year));
    },
  )
  // Data for the shareable "resumo do mês" card. Clients render the card.
  .get("/monthly", zValidator("query", monthlySummaryQuerySchema), async (c) => {
    const user = requireUser(c);
    return c.json(await getMonthlySummary(c.get("db"), user.id, c.req.valid("query").month));
  });
