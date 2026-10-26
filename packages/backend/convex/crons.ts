import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Open Library caches only grow otherwise: drop what is past its TTL.
crons.daily(
  "purge expired book caches",
  { hourUTC: 6, minuteUTC: 0 },
  internal.books.purgeExpiredCaches,
);

export default crons;
