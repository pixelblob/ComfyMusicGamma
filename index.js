const Discord = require('discord.js');
const { Collection } = Discord
const client = new Discord.Client({ intents: ["GUILD_VOICE_STATES", "GUILDS", "GUILD_MESSAGES", "GUILD_INTEGRATIONS", "GUILD_PRESENCES"], partials: ["CHANNEL"] });
const musicQueue = require("./events/ready")
const { token } = require('./config.json');
const fs = require('fs');

client.buttons = new Collection();
client.commands = new Collection();
client.events = new Collection();

module.exports = {
    musicQueue,
}

//Register the bots events (Including the ready event so the bot can actually start :/)
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
        client.events.set(event.name, event);
    } else {
        client.on(event.name, (...args) => event.execute(...args));
        client.events.set(event.name, event);
    }
}




client.login(token)