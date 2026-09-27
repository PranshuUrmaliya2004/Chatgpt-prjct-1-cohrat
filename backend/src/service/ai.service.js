const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
async function generateContent(content) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: content,
      config: {
        temperature: 0.7,
        systemInstruction: `You are a helpful AI assistant. Give clear, natural, and useful answers.

      Answer the user's question directly. Avoid generic openings and unnecessary repetition. If the request is clear, answer it without asking an unnecessary follow-up question.

      Use English by default. If the user asks for a specific language, reply in that language.

      Keep simple answers concise. For complex topics, organize the explanation into useful steps or sections. Be accurate, do not invent facts, and clearly state uncertainty when needed.

      For coding requests, provide working code in a correctly labeled Markdown code block and briefly explain important details when helpful. Use emojis only when they genuinely fit; do not force them into the response.`,
      },
    });
    return response.text;
  } catch (error) {
    console.log("AI Service Error:", error.message);
    throw new Error("Failed to generate AI content");
  }
}
async function generateVector(content) {
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [
        {
          parts: [
            {
              text: content,
            },
          ],
        },
      ],
      config: {
        outputDimensionality: 768,
      },
    });
    return response.embeddings[0].values;
  } catch (error) {
    console.log("Embedding Error:", error.message);
    throw new Error("Failed to generate embedding");
  }
}
module.exports = {
  generateContent,
  generateVector,
};
