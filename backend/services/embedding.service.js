const { GoogleGenAI } = require("@google/genai");

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EMBEDDING_MODEL = "gemini-embedding-001";
/**
 * Generate an embedding vector for a single text string.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
const embedText = async (text) => {
  const response = await genAI.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });
  const vector = response.embeddings[0].values;

console.log("Embedding size:", vector.length);

return vector;
};

/**
 * Generate embeddings for an array of text chunks.
 * Batched sequentially to respect API rate limits.
 * @param {string[]} chunks
 * @returns {Promise<number[][]>}
 */
const embedChunks = async (chunks) => {
  const embeddings = [];
  for (const chunk of chunks) {
    const vector = await embedText(chunk);
    embeddings.push(vector);
  }
  return embeddings;
};

/**
 * Cosine similarity between two vectors.
 * Returns a value in [-1, 1] — higher means more similar.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

/**
 * Rank stored chunk objects against a query embedding.
 * @param {{ text: string, embedding: number[] }[]} chunks
 * @param {number[]} queryEmbedding
 * @param {number} topK
 * @returns {string[]} top-K chunk texts ordered by similarity descending
 */
const rankChunks = (chunks, queryEmbedding, topK = 3) => {
  return chunks
    .map(({ text, embedding }) => ({
      text,
      score: cosineSimilarity(queryEmbedding, embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((entry) => entry.text);
};

module.exports = { embedText, embedChunks, cosineSimilarity, rankChunks };