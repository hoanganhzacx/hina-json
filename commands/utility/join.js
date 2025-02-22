const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins a Voice Channel')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Select the voice channel to join')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    ),

  async execute(interaction) {
    const voiceChannel = interaction.options.getChannel('channel');

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply('❌ Please select a valid voice channel.');
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false, // Bot will not deafen itself
      });

      await interaction.reply(`✅ Successfully joined **${voiceChannel.name}**!`);
    } catch (error) {
      console.error('Error joining voice channel:', error);
      await interaction.reply('❌ Failed to join the voice channel.');
    }
  }
};
