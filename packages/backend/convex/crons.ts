import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Open Library caches only grow otherwise: drop what is past its TTL.
crons.daily(
  "purge expired book caches",
  { hourUTC: 6, minuteUTC: 0 },
  internal.books.purgeExpiredCaches,
);

// Closed reports keep the reported text for 180 days (docs/legal/ropa.md).
crons.daily(
  "erase old report text",
  { hourUTC: 6, minuteUTC: 30 },
  internal.moderation.eraseOldReportText,
);

export default crons;
