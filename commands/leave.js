const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leave the current voice channel and remove all songs from the queue.'),
    async execute(interaction) {
        var { musicQueue, updateQueue } = require("../index.js")
        if (!interaction.member.voice.channel) return interaction.reply({ content: 'Please enter a voice channel to use this feature!', ephemeral: true });
        if (!interaction.member.voice.channel.joinable) return interaction.reply({ content: 'Unable to join your current voice channel!', ephemeral: true });

        getVoiceConnection(interaction.guildId).destroy()
        musicQueue[interaction.guildId].queue = []
        musicQueue[interaction.guildId].currentIndex = 0
        musicQueue[interaction.guildId].following = null;
        //interaction.update(interaction)
        interaction.reply({ content: 'Leaving your current channel!', ephemeral: true });
        updateQueue(interaction.guildId)
    }
}