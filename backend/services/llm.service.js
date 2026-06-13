const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a professional legal document assistant.

Rules:
- Answer ONLY using the provided document context.
- If the answer is not present, reply exactly:
Not found in document.
- Keep answers concise.
- Use bullet points where appropriate.
`;

const generateAnswer = async (question, chunks) => {
  const context = chunks.join("\n\n---\n\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
${SYSTEM_PROMPT}

Document Context:
${context}

Question:
${question}
`,
    });

    return response.text || "No answer generated.";
  } catch (err) {
    console.error("Gemini Error:", err);

    if (err.message) {
      return err.message;
    }

    return "Error generating answer.";
  }
};

module.exports = {
  generateAnswer,
};