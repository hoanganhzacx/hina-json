const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play an audio file in the current voice channel')
    .addStringOption(option =>
      option.setName('file')
        .setDescription('The audio file to play (example: sound.mp3)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const audioFile = interaction.options.getString('file');

    // Path to the audio file (adjust as needed)
    const audioFilePath = path.join(__dirname, '../../audio/', audioFile);

    // Get the current voice connection
    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      return interaction.reply('❌ I am not connected to a voice channel. Use `/join` first.');
    }

    try {
      // Create an audio player and resource
      const player = createAudioPlayer();
      const resource = createAudioResource(audioFilePath);

      connection.subscribe(player); // Link player to the voice connection
      player.play(resource);

      player.on(AudioPlayerStatus.Playing, () => {
        interaction.reply(`🎵 Now playing: **${audioFile}**`);
      });

      player.on(AudioPlayerStatus.Idle, () => {
        console.log('Playback finished.');
      });

      player.on('error', error => {
        console.error('Error playing audio:', error);
        interaction.followUp('❌ An error occurred while playing the audio.');
      });

    } catch (error) {
      console.error('Error playing sound:', error);
      await interaction.reply('❌ Failed to play the audio file.');
    }
  }
};
