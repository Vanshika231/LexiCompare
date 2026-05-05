const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a professional legal document assistant with expertise in analysing and explaining legal texts.

RULES:
- Answer using ONLY the provided document context. Never guess or infer beyond it.
- If the answer is incomplete, ambiguous, or not present in the context, respond exactly: Not found in document.
- The context may contain multiple sections separated by '---'. Use all sections collectively without repeating them.
- Do not repeat or paraphrase the context back to the user.
- Do not add disclaimers or legal advice warnings.
- Avoid repetition and redundant phrasing.

OUTPUT FORMAT:
- If answer is found:
  - Start with a short direct answer (1–2 lines)
  - Then, if needed, include 2–5 bullet points with key details
- If not found:
  - Respond exactly: Not found in document.

FORMATTING:
- Use clear, professional language.
- Keep answers concise and structured.
- Bold only key entities such as dates, obligations, clause names, or parties.
- Avoid long paragraphs (no walls of text).`;

const generateAnswer = async (question, chunks) => {
  const context = chunks.join("\n\n---\n\n");

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Document Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 512,
    });

    return response.choices?.[0]?.message?.content?.trim() || "No answer generated.";
  } catch (err) {
    console.error("OpenAI error:", err.message);
    return "Error generating answer.";
  }
};

module.exports = { generateAnswer };