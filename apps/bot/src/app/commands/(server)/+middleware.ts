import { getAutoShareConfig } from "@/features/core/server.service";
import { Logger, type MiddlewareContext } from "commandkit";

export async function beforeExecute(ctx: MiddlewareContext) {
  Logger.info("Identifying server auto-share config.");
  const start = new Date();
  const serverAutoShareConfig = await getAutoShareConfig(
    ctx.interaction.guildId!,
  );
  const end = new Date();

  Logger.info(
    `Identifying server auto-share config took ${end.getTime() - start.getTime()}ms.`,
  );

  ctx.store.set("serverAutoShareConfig", serverAutoShareConfig);
}
