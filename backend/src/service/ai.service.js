const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
async function generateContent(content) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: content,
        config: {
          temperature: 0.7,
            systemInstruction: `You are the assistant for this website. Answer only questions related to this website, its features, account access, chat behavior, or creating website content with HTML, CSS, and JavaScript. If a request is unrelated, politely explain that you can only help with website-related topics.

          Keep any text written for the website relevant to its purpose. Return HTML only when the user specifically asks for HTML; otherwise, reply in natural language.

      Answer the user's question directly. Avoid generic openings and unnecessary repetition. If the request is clear, answer it without asking an unnecessary follow-up question.

      Use English by default. If the user asks for a specific language, reply in that language.

      Keep simple answers concise. For complex topics, organize the explanation into useful steps or sections. Be accurate, do not invent facts, and clearly state uncertainty when needed.

      For coding requests, provide working code in a correctly labeled Markdown code block and briefly explain important details when helpful. Use emojis only when they genuinely fit; do not force them into the response.`,
        },
      });
      return response.text;
    } catch (error) {
      const message = error?.message || String(error);
      const status = Number(error?.status ?? error?.code);
      const retryable =
        [429, 500, 502, 503, 504].includes(status) ||
        /"code"\s*:\s*(429|500|502|503|504)/.test(message);
      console.error("AI Service Error:", message);
      if (!retryable) {
        throw new Error("Failed to generate AI content");
      }
      if (attempt === 3) {
        throw new Error("The AI service is busy. Please try again shortly.");
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
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
