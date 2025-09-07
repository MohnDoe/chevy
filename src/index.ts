import { Client, GatewayIntentBits } from "discord.js";
import { CommandKit } from "commandkit";
import path from "node:path";

import dotenv from "dotenv";
dotenv.config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
  ],
});

new CommandKit({
  client,
  commandsPath: path.join(__dirname, "commands"),
  eventsPath: path.join(__dirname, "events"),
  validationsPath: path.join(__dirname, "validations"),
  devGuildIds: [process.env.DISCORD_DEV_GUILD_ID!],
  devUserIds: [process.env.DISCORD_DEV_USER_ID!],
  bulkRegister: true,
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
