import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Open Library caches only grow otherwise: drop what is past its TTL.
crons.daily(
  "purge expired book caches",
  { hourUTC: 6, minuteUTC: 0 },
  internal.books.purgeExpiredCaches,
);

// New books get their spine painted in the colors of their cover.
crons.interval("paint book spines", { minutes: 3 }, internal.books.paintSpines, {});

export default crons;
