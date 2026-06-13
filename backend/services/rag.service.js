const fs = require("fs/promises");
const pdfParse = require("pdf-parse");
// In-memory store: { documentId: [chunk, chunk, ...] }
const chunkStore = {};

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100; // improves context continuity
const TOP_K = 3;

// -----------------------------
// 1. Extract text from PDF
// -----------------------------
const extractTextFromPDF = async (filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("Empty PDF content");
    }

    return data.text.toLowerCase(); // normalize early
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err.message}`);
  }
};

// -----------------------------
// 2. Split text into chunks (with overlap)
// -----------------------------
const splitIntoChunks = (text) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + CHUNK_SIZE;
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // move forward with overlap
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
};

// -----------------------------
// 3. Index document
// -----------------------------
const indexDocument = async (documentId, filePath) => {
  const text = await extractTextFromPDF(filePath);
  const chunks = splitIntoChunks(text);

  chunkStore[documentId] = chunks;

  return chunks.length;
};

// -----------------------------
// 4. Score chunks
// -----------------------------
const scoreChunk = (chunk, question) => {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const uniqueWords = [...new Set(words)];
  const lowerChunk = chunk.toLowerCase();

  let score = 0;

  for (const word of uniqueWords) {
    if (lowerChunk.includes(word)) {
      score += 1;
    }
  }

  return score;
};

// -----------------------------
// 5. Retrieve relevant chunks
// -----------------------------
const getRelevantChunks = (documentId, question) => {
  const chunks = chunkStore[documentId];

  if (!chunks || chunks.length === 0) {
    return [];
  }

  const scored = chunks.map((chunk) => ({
    chunk,
    score: scoreChunk(chunk, question),
  }));

  return scored
    .filter((c) => c.score > 0) // remove useless chunks
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .map((c) => c.chunk);
};

module.exports = {
  indexDocument,
  getRelevantChunks,
};