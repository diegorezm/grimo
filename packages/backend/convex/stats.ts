import { monthlySummaryQuerySchema } from "@grimo/core";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { parse } from "./model/errors";
import { requireViewer } from "./model/readers";
import { monthlySummary, yearOverview } from "./model/stats";

/** Books, pages, top genre and goal progress for a year. */
export const overview = query({
  args: { year: v.number() },
  handler: async (ctx, { year }) => {
    const viewer = await requireViewer(ctx);
    return yearOverview(ctx, viewer, year);
  },
});

/** Data for the shareable "resumo do mês" card. Clients render the card. */
export const monthly = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const { month } = parse(monthlySummaryQuerySchema, args);
    return monthlySummary(ctx, viewer, month);
  },
});
