const Query = require("../models/Query.model");
const { getUserDocumentById } = require("./document.service");
const { indexDocument, getRelevantChunks } = require("./rag.service");
const { generateAnswer } = require("./llm.service");

const createQuery = async (documentId, question, userId) => {
  // 1. Validate document ownership
  const doc = await getUserDocumentById(documentId, userId);

  // 2. Clean input
  const cleanQuestion = question.trim();

  // 3. Retrieve chunks
  let chunks = getRelevantChunks(documentId, cleanQuestion);

  // 4. If chunks not found (e.g., server restart), re-index
  if (!chunks || chunks.length === 0) {
    await indexDocument(documentId, doc.filePath);
    chunks = getRelevantChunks(documentId, cleanQuestion);
  }

  // 5. Limit number of chunks (important for performance + cost)
  chunks = chunks.slice(0, 3);

  let answer;

  // 6. Generate answer using LLM
  if (chunks.length > 0) {
    try {
      answer = await generateAnswer(cleanQuestion, chunks);
    } catch (err) {
      console.error("LLM error:", err.message);
      answer = "Error generating answer. Please try again.";
    }
  } else {
    answer = "No relevant information found in the document.";
  }

  // 7. Save query + answer in DB
  const query = await Query.create({
    document: documentId,
    question: cleanQuestion,
    answer,
    askedBy: userId,
  });

  // 8. Return response
  return {
    question: query.question,
    answer: query.answer,
  };
};

const getQueriesByDocument = async (documentId, userId) => {
  // Validate document ownership
  await getUserDocumentById(documentId, userId);

  // Fetch query history
  return Query.find({  document: documentId, askedBy: userId }).sort({
    createdAt: -1,
  });
};

module.exports = { createQuery, getQueriesByDocument };