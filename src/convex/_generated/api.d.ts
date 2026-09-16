/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as creditBids from "../creditBids.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as dealRoom from "../dealRoom.js";
import type * as featured from "../featured.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as jobsInternal from "../jobsInternal.js";
import type * as jobsQuery from "../jobsQuery.js";
import type * as listings from "../listings.js";
import type * as news from "../news.js";
import type * as newsInternal from "../newsInternal.js";
import type * as newsPrune from "../newsPrune.js";
import type * as newsQuery from "../newsQuery.js";
import type * as newsletter from "../newsletter.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as referrals from "../referrals.js";
import type * as salaryBids from "../salaryBids.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as visitors from "../visitors.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  "auth/emailOtp": typeof auth_emailOtp;
  creditBids: typeof creditBids;
  credits: typeof credits;
  crons: typeof crons;
  dealRoom: typeof dealRoom;
  featured: typeof featured;
  http: typeof http;
  jobs: typeof jobs;
  jobsInternal: typeof jobsInternal;
  jobsQuery: typeof jobsQuery;
  listings: typeof listings;
  news: typeof news;
  newsInternal: typeof newsInternal;
  newsPrune: typeof newsPrune;
  newsQuery: typeof newsQuery;
  newsletter: typeof newsletter;
  notifications: typeof notifications;
  payments: typeof payments;
  referrals: typeof referrals;
  salaryBids: typeof salaryBids;
  seed: typeof seed;
  users: typeof users;
  visitors: typeof visitors;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
