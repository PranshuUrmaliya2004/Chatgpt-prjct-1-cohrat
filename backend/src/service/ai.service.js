// const { GoogleGenAI } = require("@google/genai");
// const { config } = require("dotenv");

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY
// });

// async function generateContent(content) {

//     try {

//         const response = await ai.models.generateContent({
//             model: "gemini-3.5-flash",
//             contents: content
//         });

//         return response.text;

//     } catch (error) {

//         console.log("AI Service Error:", error.message);

//         throw new Error("Failed to generate AI content");
//     }
// }

// async function generateVector(content){
//     const response = await ai.models.generateVector({
//             model: "gemini-embedding-001",
//             contents: content,
// config:({
//     outputDimensionality:768
// })
// return response.embedding
// }
//     )}
// module.exports = generateContent,
// module.exports=generateVector;




const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


async function generateContent(content) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: content,
            config: {
                temperature: 0.7,
                systemInstruction: `You are Trisha, an AI assistant.

Always answer the user's exact question directly. Do not give generic filler such as "I'd be happy to help" before answering. Do not ask what topic the user means when they have already provided a clear question.

Answer in Hinglish with a few Punjabi words used naturally, unless the user requests another language.

For coding questions:
- Provide the requested working code directly.
- Use a fenced Markdown code block with the correct language label.
- Briefly explain important parts after the code when useful.
- Do not substitute a follow-up question for the requested code.
and use Specific EMojis  with code related
For simple questions, keep the answer short and direct. Be accurate, do not invent facts, and state uncertainty when needed.`
            }
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
            // contents: content,
             contents: [
                {
                    parts: [
                        {
                            text: content
                        }
                    ]
                }
            ],
            config: {
                outputDimensionality: 768
            }
        });

        return response.embeddings[0].values;

    } catch (error) {
        console.log("Embedding Error:", error.message);
        throw new Error("Failed to generate embedding");
    }
}


module.exports = {
    generateContent,
    generateVector
};

