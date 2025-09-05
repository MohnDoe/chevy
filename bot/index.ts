const fs = require("node:fs");
const path = require("node:path");
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { ChevyClient } from "./types/ChevyClient";

import dotenv from "dotenv";
dotenv.config();

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
}) as ChevyClient;

client.commands = new Collection();

const commandsFoldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(commandsFoldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(commandsFoldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file: string) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const contextsPath = path.join(__dirname, "contexts");
const contextFiles = fs
  .readdirSync(contextsPath)
  .filter((file: string) => file.endsWith(".ts"));
  
for (const file of contextFiles) {
  const filePath = path.join(contextsPath, file);
  const context = require(filePath);
  // Set a new item in the Collection with the key as the context name and the value as the exported module
  if ("data" in context && "execute" in context) {
    client.commands.set(context.data.name, context);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file: string) => file.endsWith(".ts"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args: any[]) => event.execute(...args));
  } else {
    client.on(event.name, (...args: any[]) => event.execute(...args));
  }
}

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
