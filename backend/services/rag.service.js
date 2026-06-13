const fs = require("fs/promises");
const pdfParse = require("pdf-parse");

const {
  embedChunks,
  embedText,
  rankChunks,
} = require("./embedding.service");

// documentId -> [{chunk, embedding}]
const chunkStore = {};

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const TOP_K = 3;

const extractTextFromPDF = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);

  return data.text;
};

const splitIntoChunks = (text) => {
  const chunks = [];

  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + CHUNK_SIZE).trim());

    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks.filter((chunk) => chunk.length > 0);
};

const indexDocument = async (documentId, filePath) => {
  const text = await extractTextFromPDF(filePath);

  const chunks = splitIntoChunks(text);

  const embeddings = await embedChunks(chunks);

  chunkStore[documentId] = chunks.map((chunk, index) => ({
    chunk,
    embedding: embeddings[index],
  }));

  return chunks.length;
};

const getRelevantChunks = async (documentId, question) => {
  const stored = chunkStore[documentId];

  if (!stored || stored.length === 0) {
    return [];
  }

  const queryEmbedding = await embedText(question);

  return rankChunks(stored, queryEmbedding, TOP_K);
};

module.exports = {
  indexDocument,
  getRelevantChunks,
};