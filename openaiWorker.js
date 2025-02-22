const OpenAI = require("openai");
const fs = require('fs');
require("dotenv").config();

class OpenAIWorker {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getResponse(queryStr) {
    const messages = JSON.parse(fs.readFileSync('hina_data.json', 'utf8'));

    try {
      const chatCompletion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo", // model
        messages: [...messages, { role: "user", content: queryStr }],
      }); 

      return chatCompletion.choices[0].message.content;
    } catch (error) {
      console.error("❌ AI Error:", error);
      return "❌ Sorry, I couldn't process your request.";
    }
  }
}

module.exports = OpenAIWorker;
