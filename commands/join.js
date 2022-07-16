const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('join vc'),
    async execute(interaction) {
        const { musicQueue, playUrl, client, updateQueue } = require("../index.js") 
        const { EndBehaviorType, createAudioPlayer, joinVoiceChannel, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus, getVoiceConnection, NoSubscriberBehavior, PlayerSubscription } = require('@discordjs/voice');
        if (!interaction.member.voice.channel) return interaction.reply({ content: 'Please enter a voice channel to use this feature!', ephemeral: true });
        if (!interaction.member.voice.channel.joinable) return interaction.reply({ content: 'Unable to join your current voice channel!', ephemeral: true });

        var queue = musicQueue[interaction.guildId]

        var voice = getVoiceConnection(interaction.guildId)
        if (voice) voice.destroy()

        var channel = interaction.member.voice.channel

        var vc = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });
        musicQueue[interaction.guildId].player = player
        if (queue.queue[queue.currentIndex]) playUrl(queue.queue[queue.currentIndex].url, interaction.member.voice.channel)
        interaction.reply({ content: 'Joining your voice channel!', ephemeral: true });
        updateQueue(interaction.guildId)
    }
}