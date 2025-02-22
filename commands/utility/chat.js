const { SlashCommandBuilder } = require("discord.js");
const OpenAIWorker = require("C:/Users/bayni/OneDrive/Desktop/project_hina/openaiWorker"); // ✅ Correct path

module.exports = {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Talk to Hina (GPT-3.5)")
    .addStringOption((option) =>
      option.setName("message")
        .setDescription("What do you want to ask?")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const userMessage = interaction.options.getString("message");
    const aiWorker = new OpenAIWorker(); // ✅ Now it will work

    try {
      const response = await aiWorker.getResponse(userMessage);
      await interaction.editReply(response);
    } catch (error) {
      console.error("❌ OpenAI Error:", error);
      await interaction.editReply("❌ Failed to get a response from AI.");
    }
  }
};
