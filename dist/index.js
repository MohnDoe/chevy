"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Entry point for the Discord bot
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages, discord_js_1.GatewayIntentBits.MessageContent] });
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});
client.on('messageCreate', message => {
    if (message.author.bot)
        return;
    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});
client.login(process.env.DISCORD_TOKEN);
