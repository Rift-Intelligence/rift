import { schedules } from "@trigger.dev/sdk";

// Runs every 5 minutes to keep the worker container alive and prevent cold starts.
// All Trigger.dev tasks share the same worker build, so keeping any task running
// means the next agent-long dispatch can reuse a warm container.
export const keepWarmTask = schedules.task({
  id: "keep-warm",
  cron: "*/5 * * * *",
  maxDuration: 5,
  machine: { preset: "medium-1x" },
  run: async () => {
    // intentional noop
  },
});
