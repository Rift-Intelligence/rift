/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as admin from "../admin.js";
import type * as apiKeys from "../apiKeys.js";
import type * as artifacts from "../artifacts.js";
import type * as auth from "../auth.js";
import type * as authCleanup from "../authCleanup.js";
import type * as chatStreams from "../chatStreams.js";
import type * as chats from "../chats.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as emailCanonical from "../emailCanonical.js";
import type * as extraUsage from "../extraUsage.js";
import type * as extraUsageActions from "../extraUsageActions.js";
import type * as feedback from "../feedback.js";
import type * as fileActions from "../fileActions.js";
import type * as fileAggregate from "../fileAggregate.js";
import type * as fileStorage from "../fileStorage.js";
import type * as github from "../github.js";
import type * as http from "../http.js";
import type * as imageStorage from "../imageStorage.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_utils from "../lib/utils.js";
import type * as localSandbox from "../localSandbox.js";
import type * as maintenanceRelink from "../maintenanceRelink.js";
import type * as mcpServers from "../mcpServers.js";
import type * as messages from "../messages.js";
import type * as notes from "../notes.js";
import type * as otpRateLimit from "../otpRateLimit.js";
import type * as projects from "../projects.js";
import type * as rateLimitStatus from "../rateLimitStatus.js";
import type * as redisPubsub from "../redisPubsub.js";
import type * as referrals from "../referrals.js";
import type * as s3Actions from "../s3Actions.js";
import type * as s3Cleanup from "../s3Cleanup.js";
import type * as s3Utils from "../s3Utils.js";
import type * as sharedChats from "../sharedChats.js";
import type * as skills from "../skills.js";
import type * as subscriptions from "../subscriptions.js";
import type * as teamExtraUsage from "../teamExtraUsage.js";
import type * as teamExtraUsageActions from "../teamExtraUsageActions.js";
import type * as tempStreams from "../tempStreams.js";
import type * as unitEconomics from "../unitEconomics.js";
import type * as unitEconomicsLib from "../unitEconomicsLib.js";
import type * as usageLogs from "../usageLogs.js";
import type * as userCustomization from "../userCustomization.js";
import type * as userDeletion from "../userDeletion.js";
import type * as userSuspensions from "../userSuspensions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  admin: typeof admin;
  apiKeys: typeof apiKeys;
  artifacts: typeof artifacts;
  auth: typeof auth;
  authCleanup: typeof authCleanup;
  chatStreams: typeof chatStreams;
  chats: typeof chats;
  constants: typeof constants;
  crons: typeof crons;
  emailCanonical: typeof emailCanonical;
  extraUsage: typeof extraUsage;
  extraUsageActions: typeof extraUsageActions;
  feedback: typeof feedback;
  fileActions: typeof fileActions;
  fileAggregate: typeof fileAggregate;
  fileStorage: typeof fileStorage;
  github: typeof github;
  http: typeof http;
  imageStorage: typeof imageStorage;
  "lib/logger": typeof lib_logger;
  "lib/utils": typeof lib_utils;
  localSandbox: typeof localSandbox;
  maintenanceRelink: typeof maintenanceRelink;
  mcpServers: typeof mcpServers;
  messages: typeof messages;
  notes: typeof notes;
  otpRateLimit: typeof otpRateLimit;
  projects: typeof projects;
  rateLimitStatus: typeof rateLimitStatus;
  redisPubsub: typeof redisPubsub;
  referrals: typeof referrals;
  s3Actions: typeof s3Actions;
  s3Cleanup: typeof s3Cleanup;
  s3Utils: typeof s3Utils;
  sharedChats: typeof sharedChats;
  skills: typeof skills;
  subscriptions: typeof subscriptions;
  teamExtraUsage: typeof teamExtraUsage;
  teamExtraUsageActions: typeof teamExtraUsageActions;
  tempStreams: typeof tempStreams;
  unitEconomics: typeof unitEconomics;
  unitEconomicsLib: typeof unitEconomicsLib;
  usageLogs: typeof usageLogs;
  userCustomization: typeof userCustomization;
  userDeletion: typeof userDeletion;
  userSuspensions: typeof userSuspensions;
  users: typeof users;
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

export declare const components: {
  fileCountByUser: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"fileCountByUser">;
};
