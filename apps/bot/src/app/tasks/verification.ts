import { task } from "@commandkit/tasks";

import verificationConfig from "@/config/verification.config";

export default task({
  name: verificationConfig.task.name,
  schedule: verificationConfig.task.schedule,
  immediate: true,
  async execute(_ctx) {
    console.log(`Executing task: ${verificationConfig.task.name}`);
    console.log(`Schedule: ${verificationConfig.task.schedule}`);
  },
});
