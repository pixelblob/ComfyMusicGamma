const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILD_VOICE_STATES", "GUILDS", "GUILD_MESSAGES", "GUILD_INTEGRATIONS", "GUILD_PRESENCES"], partials: ["CHANNEL"] });
const { token } = require('./config.json');