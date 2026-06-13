const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Generate embedding for one text
const embedText = async (text) => {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
  });

  return response.embeddings[0].values;
};

// Generate embeddings for multiple chunks
const embedChunks = async (chunks) => {
  return Promise.all(chunks.map(embedText));
};

// Cosine similarity
const cosineSimilarity = (a, b) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  return denominator === 0 ? 0 : dot / denominator;
};

// Rank chunks by semantic similarity
const rankChunks = (stored, queryEmbedding, topK = 3) => {
  return stored
    .map(({ chunk, embedding }) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
};

module.exports = {
  embedText,
  embedChunks,
  cosineSimilarity,
  rankChunks,
};