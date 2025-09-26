import { task } from "@commandkit/tasks";

import autoShareConfig from "@/config/autoShare.config";
import { executeAutoShare } from "@/features/autoShare/autoShare.service";
import { Logger } from "commandkit";

export default task({
  name: autoShareConfig.task.name,
  schedule: autoShareConfig.task.schedule,
  immediate: true,
  async execute(ctx) {
    Logger.info("Executing auto share task");
    await executeAutoShare();
  },
});
