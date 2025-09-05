import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
const path = require("node:path");
dotenv.config();
const fs = require("node:fs");
const env = process.env.NODE_ENV || "development";

const skipDev = env === "production";

const commandsPath = path.join(__dirname, "commands");
const contextsPath = path.join(__dirname, "contexts");

const commands = [];
const contexts = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file: string) => file.endsWith(".ts"));

const contextFiles = fs
  .readdirSync(contextsPath)
  .filter((file: string) => file.endsWith(".ts"));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
console.log("Building command list :");
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.wip && skipDev) {
    console.log(" - SKIPPED : " + file);
  } else {
    if (command.wip) {
      console.log(" - DEV : " + file);
    } else {
      console.log(" - READY : " + file);
    }
    commands.push(command.data.toJSON());
    console.debug(command.data.toJSON());
  }
}

console.log("Building context list :");
for (const file of contextFiles) {
  const filePath = path.join(contextsPath, file);
  const context = require(filePath);
  if (context.wip && skipDev) {
    console.log(" - SKIPPED : " + file);
  } else {
    if (context.wip) {
      console.log(" - DEV : " + file);
    } else {
      console.log(" - READY : " + file);
    }
    contexts.push(context.data.toJSON());
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
      commands.map((c) => c.name)
    );

    console.log(
      `Started refreshing ${contexts.length} application contexts.`,
      contexts.map((c) => c.name)
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = (await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      {
        body: [...commands, ...contexts],
      }
    )) as { length: number };

    console.log(
      `Successfully reloaded ${data.length} application (/) commands and contexts.`
    );
    process.exit(0);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
    process.exit(1);
  }
})();
