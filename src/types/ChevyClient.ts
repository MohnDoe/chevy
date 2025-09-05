import { Client, Collection } from "discord.js";

export interface ChevyClient extends Client {
  commands: Collection<string, any>;
}