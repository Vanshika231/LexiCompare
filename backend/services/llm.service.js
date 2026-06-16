const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


const generateAnswer = async (question, chunks) => {

  const context = chunks.join("\n\n");


  const prompt = `
You are a helpful assistant.

Answer the question only using the provided context.

Context:
${context}

Question:
${question}

If the answer is not present in the context, say:
"I could not find this information in the document."
`;


  try {

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    });


    return response.text;


  } catch (error) {

    console.error(
      "LLM ERROR:",
      error.message
    );

    return "AI service temporarily unavailable. Please try again.";

  }

};


module.exports = {
  generateAnswer
};