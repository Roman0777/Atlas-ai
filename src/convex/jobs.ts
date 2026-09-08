"use node";

import { action, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

// ---------- Source adapters ----------

type NormalizedJob = {
  source: string;
  externalId: string;
  title: string;
  companyName: string;
  location?: string;
  isRemote: boolean;
  url: string;
  description?: string;
  salaryMin?: number;
  salaryMax?: number;
  category?: string;
  tags?: string[];
  postedAt?: number;
};

/** JSearch via RapidAPI — aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter. */
async function fetchJSearch(
  query: string,
  apiKey: string,
): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({
    query,
    page: "1",
    num_pages: "1",
    date_posted: "week",
  });
  const res = await fetch(
    `https://jsearch.p.rapidapi.com/search?${params}`,
    {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
    },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? []).map((j: {
    job_id?: string;
    employer_name?: string | null;
    job_title?: string | null;
    job_city?: string | null;
    job_state?: string | null;
    job_country?: string | null;
    job_is_remote?: boolean;
    job_apply_link?: string | null;
    job_google_link?: string | null;
    job_description?: string | null;
    job_min_salary?: number | null;
    job_max_salary?: number | null;
    job_employment_type?: string | null;
    job_highlights?: { Qualifications?: string[] } | null;
    job_posted_at_timestamp?: number | null;
  }) => ({
    source: "jsearch",
    externalId: j.job_id ?? `${j.employer_name}-${j.job_title}-${j.job_posted_at_timestamp ?? Date.now()}`,
    title: j.job_title ?? "Untitled",
    companyName: j.employer_name ?? "Unknown",
    location: j.job_city || j.job_state || j.job_country || undefined,
    isRemote: j.job_is_remote === true,
    url: j.job_apply_link ?? j.job_google_link ?? "#",
    description: j.job_description ?? undefined,
    salaryMin: j.job_min_salary ?? undefined,
    salaryMax: j.job_max_salary ?? undefined,
    category: j.job_employment_type ?? undefined,
    tags: j.job_highlights?.Qualifications?.slice(0, 5),
    postedAt: j.job_posted_at_timestamp
      ? j.job_posted_at_timestamp * 1000
      : undefined,
  }));
}

/** Remotive — free public API for remote tech jobs. No auth needed. */
async function fetchRemotive(): Promise<NormalizedJob[]> {
  const res = await fetch("https://remotive.com/api/remote-jobs?limit=100");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.jobs ?? []).map((j: {
    id: string;
    title?: string | null;
    company_name?: string | null;
    candidate_required_location?: string | null;
    url?: string | null;
    description?: string | null;
    salary_min?: number | null;
    salary_max?: number | null;
    category?: string | null;
    tags?: string[] | null;
    publication_date?: string | null;
  }) => ({
    source: "remotive",
    externalId: String(j.id),
    title: j.title ?? "Untitled",
    companyName: j.company_name ?? "Unknown",
    location: j.candidate_required_location || undefined,
    isRemote: true,
    url: j.url ?? "#",
    description: j.description ?? undefined,
    salaryMin: j.salary_min ?? undefined,
    salaryMax: j.salary_max ?? undefined,
    category: j.category ?? undefined,
    tags: j.tags?.slice(0, 5),
    postedAt: j.publication_date
      ? new Date(j.publication_date).getTime()
      : undefined,
  }));
}

/** Arbeitnow — free public API for global jobs. No auth needed. */
async function fetchArbeitnow(): Promise<NormalizedJob[]> {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? []).map((j: {
    id: string;
    title?: string | null;
    company_name?: string | null;
    location?: string | null;
    remote?: boolean;
    url?: string | null;
    application_url?: string | null;
    description?: string | null;
    tags?: string[] | null;
    created_at?: string | null;
  }) => ({
    source: "arbeitnow",
    externalId: String(j.id),
    title: j.title ?? "Untitled",
    companyName: j.company_name ?? "Unknown",
    location: j.location || undefined,
    isRemote: j.remote === true,
    url: j.url ?? j.application_url ?? "#",
    description: j.description ?? undefined,
    category: undefined,
    tags: j.tags?.slice(0, 5),
    postedAt: j.created_at
      ? new Date(j.created_at).getTime()
      : undefined,
  }));
}

// ---------- Helpers ----------

/** Upsert a batch of normalized jobs into the database. */
async function upsertBatch(
  ctx: ActionCtx,
  jobs: NormalizedJob[],
): Promise<number> {
  let count = 0;
  for (const job of jobs) {
    const existing = await ctx.runQuery(
      internal.jobsInternal._getBySourceAndExternal,
      { source: job.source, externalId: job.externalId },
    );
    if (existing && existing.length > 0) {
      await ctx.runMutation(internal.jobsInternal._updateJob, {
        id: existing[0]._id,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        isRemote: job.isRemote,
        url: job.url,
        description: job.description,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        category: job.category,
        tags: job.tags,
        postedAt: job.postedAt,
        fetchedAt: Date.now(),
      });
    } else {
      await ctx.runMutation(internal.jobsInternal._insertJob, {
        source: job.source,
        externalId: job.externalId,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        isRemote: job.isRemote,
        url: job.url,
        description: job.description,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        category: job.category,
        tags: job.tags,
        postedAt: job.postedAt,
        fetchedAt: Date.now(),
      });
    }
    count++;
  }
  return count;
}

/** Upsert sync metadata for a source. */
async function upsertSyncMeta(
  ctx: ActionCtx,
  source: string,
  jobCount: number,
): Promise<void> {
  const existing = await ctx.runQuery(
    internal.jobsInternal._getSyncMeta,
    { source },
  );
  if (existing) {
    await ctx.runMutation(internal.jobsInternal._updateSyncMeta, {
      id: existing._id,
      jobCount,
    });
  } else {
    await ctx.runMutation(internal.jobsInternal._insertSyncMeta, {
      source,
      lastSyncAt: Date.now(),
      jobCount,
    });
  }
}

// ---------- Public action ----------

/** Fetch jobs from all sources and upsert into the database. */
export const refreshJobs = action({
  args: {},
  handler: async (ctx) => {
    const results: { source: string; count: number }[] = [];

    // 1. JSearch (needs RAPIDAPI_KEY)
    const jsearchKey = process.env.RAPIDAPI_KEY;
    if (jsearchKey) {
      const queries = [
        "software engineer remote",
        "product manager tech",
        "designer startup",
        "data scientist",
        "devops engineer",
      ];
      const allJSearch: NormalizedJob[] = [];
      for (const q of queries) {
        const jobs = await fetchJSearch(q, jsearchKey);
        allJSearch.push(...jobs);
        await new Promise((r) => setTimeout(r, 200));
      }
      const seen = new Set<string>();
      const deduped = allJSearch.filter((j) => {
        if (seen.has(j.externalId)) return false;
        seen.add(j.externalId);
        return true;
      });
      const count = await upsertBatch(ctx, deduped);
      results.push({ source: "jsearch", count });
    }

    // 2. Remotive (free, no auth)
    try {
      const remotiveJobs = await fetchRemotive();
      const count = await upsertBatch(ctx, remotiveJobs);
      results.push({ source: "remotive", count });
    } catch {
      // Remotive may be temporarily down, skip
    }

    // 3. Arbeitnow (free, no auth)
    try {
      const arbeitnowJobs = await fetchArbeitnow();
      const count = await upsertBatch(ctx, arbeitnowJobs);
      results.push({ source: "arbeitnow", count });
    } catch {
      // Skip on failure
    }

    // Update sync metadata
    for (const r of results) {
      await upsertSyncMeta(ctx, r.source, r.count);
    }

    return results;
  },
});
