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
            model: "gemini-3.6-flash",
            contents: content,
         config:{   
            temperature:0.7,
            systemInstruction:"you are a Ai Assistant , your name is Trisha , You always be give the answer in hinglish with Panjabi language, and give main main line few or long answer but exact ans give line by line"

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

