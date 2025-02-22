const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leaves the voice channel'),

  async execute(interaction) {
    // Get the bot's connection to the guild (server)
    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      return interaction.reply('❌ I am not connected to any voice channel.');
    }

    try {
      connection.destroy(); // Leave the voice channel
      await interaction.reply('✅ Successfully left the voice channel.');
    } catch (error) {
      console.error('Error leaving voice channel:', error);
      await interaction.reply('❌ Failed to leave the voice channel.');
    }
  }
};
