import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// News sources rotate through shards so every feed is refreshed every
// ~4 hours without any single run hitting Convex action limits.
const NEWS_SHARD_COUNT = 4;

for (let shard = 0; shard < NEWS_SHARD_COUNT; shard++) {
  crons.hourly(
    `refresh news shard ${shard}/${NEWS_SHARD_COUNT}`,
    { minuteUTC: shard * 13 }, // staggered minutes to spread load
    internal.news.refreshNewsShard,
    { shard, shardCount: NEWS_SHARD_COUNT },
  );
}

// Prune Dispatch stories older than 90 days, every day at 04:07 UTC.
crons.daily(
  "prune old news items",
  { hourUTC: 4, minuteUTC: 7 },
  internal.newsPrune._prune,
  {},
);

export default crons;
