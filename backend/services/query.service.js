const Query = require("../models/Query.model");

const { getUserDocumentById } = require("./document.service");

const {
  indexDocument,
  getRelevantChunks,
} = require("./rag.service");

const { generateAnswer } = require("./llm.service");

const createQuery = async (documentId, question, userId) => {
  const doc = await getUserDocumentById(documentId, userId);

  const cleanQuestion = question.trim();

  let chunks = await getRelevantChunks(documentId, cleanQuestion);

  // re-index after restart
  if (chunks.length === 0) {
    await indexDocument(documentId, doc.filePath);

    chunks = await getRelevantChunks(documentId, cleanQuestion);
  }

  let answer;

  if (chunks.length > 0) {
    answer = await generateAnswer(cleanQuestion, chunks);
  } else {
    answer = "No relevant information found in the document.";
  }

  const query = await Query.create({
    document: documentId,
    question: cleanQuestion,
    answer,
    askedBy: userId,
  });

  return {
    question: query.question,
    answer: query.answer,
  };
};

const getQueriesByDocument = async (documentId, userId) => {
  await getUserDocumentById(documentId, userId);

  return Query.find({
    document: documentId,
    askedBy: userId,
  }).sort({
    createdAt: -1,
  });
};

module.exports = {
  createQuery,
  getQueriesByDocument,
};