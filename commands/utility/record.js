const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const prism = require('prism-media');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const recordings = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('record')
    .setDescription('Manage voice recording')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Start recording your audio')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stop')
        .setDescription('Stop recording and save your audio')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      return interaction.reply('❌ I am not connected to a voice channel. Use /join first.');
    }

    const receiver = connection.receiver;

    if (subcommand === 'start') {
      if (recordings.has(userId)) {
        return interaction.reply('❌ You are already being recorded.');
      }

      const timestamp = Date.now();
      const recordingsDir = path.join(__dirname, '../../recordings/');
      const audioFilePath = path.join(recordingsDir, `${userId}-${timestamp}.pcm`);

      // Ensure the recordings directory exists
      if (!fs.existsSync(recordingsDir)) {
        fs.mkdirSync(recordingsDir, { recursive: true });
      }

      try {
        // Subscribe to the user's audio stream
        const audioStream = receiver.subscribe(userId, { end: { behavior: 'manual' } });
        const outputStream = fs.createWriteStream(audioFilePath);
        const decoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });

        // Extra error handling for improved robustness
        audioStream.on('error', err => console.error(`Audio stream error for user ${userId}:`, err));
        decoder.on('error', err => console.error(`Decoder error for user ${userId}:`, err));
        outputStream.on('error', err => console.error(`File write error for user ${userId}:`, err));

        // Pipe the audio stream through the decoder and into a file
        audioStream.pipe(decoder).pipe(outputStream);

        recordings.set(userId, { audioStream, outputStream, audioFilePath });
        console.log(`Started recording audio for user ${userId}`);
        return interaction.reply('✅ Started recording your audio.');
      } catch (error) {
        console.error(`Error starting recording for user ${userId}:`, error);
        return interaction.reply('❌ Failed to start recording due to an internal error.');
      }
    }

    if (subcommand === 'stop') {
      if (!recordings.has(userId)) {
        return interaction.reply('❌ You are not being recorded.');
      }

      const { audioStream, outputStream, audioFilePath } = recordings.get(userId);

      // Stop and clean up the streams
      audioStream.destroy();
      outputStream.end();
      recordings.delete(userId);

      // Convert the PCM file to MP3 with enhanced quality settings
      const mp3FilePath = audioFilePath.replace('.pcm', '.mp3');

      ffmpeg()
        .input(audioFilePath)
        .inputOptions(['-f s16le', '-ar 48000', '-ac 2'])
        .audioCodec('libmp3lame')
        .audioBitrate('320k')
        .audioFilters([
          'loudnorm=I=-16:TP=-1.5:LRA=11', // Normalize loudness
          'highpass=f=100',                // Remove low-frequency rumble
          'lowpass=f=15000'                // Remove excessive high frequencies
        ])
        .output(mp3FilePath)
        .on('end', () => {
          console.log(`Converted and enhanced audio to MP3: ${mp3FilePath}`);
          // Remove the original PCM file after successful conversion
          fs.unlink(audioFilePath, err => {
            if (err) console.error(`Error deleting PCM file for user ${userId}:`, err);
            else console.log(`Deleted PCM file: ${audioFilePath}`);
          });
        })
        .on('error', err => console.error('Error converting to MP3:', err))
        .run();

      console.log(`Stopped recording audio for user ${userId}`);
      return interaction.reply('✅ Stopped recording. Your audio has been saved as MP3.');
    }
  }
};
