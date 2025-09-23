import { task } from "@commandkit/tasks";
import { Logger } from "commandkit";

import autoShareConfig from "@/config/autoShare.config";

export default task({
  name: autoShareConfig.task.name,
  schedule: autoShareConfig.task.schedule,
  async execute(ctx) {
    Logger.info(
      `Running ${autoShareConfig.task.name} tasks. Schedule : ${autoShareConfig.task.schedule}`
    );
  },
});
