import { task } from "@commandkit/tasks";

import autoShareConfig from "@/config/autoShare.config";
import { executeAutoShare } from "@/features/autoShare/autoShare.service";

export default task({
  name: autoShareConfig.task.name,
  schedule: autoShareConfig.task.schedule,
  async execute(_ctx) {
    console.log("Executing autoShare task");
    await executeAutoShare();
  },
});
