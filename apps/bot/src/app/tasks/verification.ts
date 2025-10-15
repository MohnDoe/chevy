import { task } from "@commandkit/tasks";

import verificationConfig from "@/config/verification.config";
import {
  executePrivateVerifications,
  executeVerificationTask,
} from "@/features/hevy/verification.service";

export default task({
  name: verificationConfig.task.name,
  schedule: verificationConfig.task.schedule,
  async execute(_ctx) {
    console.log(`Executing task: ${verificationConfig.task.name}`);
    console.log(`Schedule: ${verificationConfig.task.schedule}`);
    await executeVerificationTask();
    await executePrivateVerifications();
  },
});
