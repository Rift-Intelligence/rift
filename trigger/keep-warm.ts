// keep-warm is TEMPORARILY DISABLED during the Trigger.dev us-east-1 incident
// (2026-06-22). The region degradation triggers a concurrency-accounting bug
// where queued runs are miscounted against the concurrency limit, blocking
// agent-long runs. This every-5-minutes scheduled task was piling up queued
// runs and feeding that bug, so it is disabled.
//
// RE-ENABLE once the incident is resolved (restore the block below) to bring
// back the warm-container cold-start optimization:
//
// import { schedules } from "@trigger.dev/sdk";
// export const keepWarmTask = schedules.task({
//   id: "keep-warm",
//   cron: "*/5 * * * *",
//   maxDuration: 5,
//   machine: { preset: "medium-1x" },
//   run: async () => {
//     // intentional noop
//   },
// });
export {};
