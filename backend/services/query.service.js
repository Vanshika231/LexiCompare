const Query = require("../models/Query.model");
const { getUserDocumentById } = require("./document.service");
const {
  indexDocument,
  getRelevantChunks,
} = require("./rag.service");
const { generateAnswer } = require("./llm.service");


const createQuery = async (
  documentId,
  question,
  userId
) => {

  // verify document belongs to user
  const doc = await getUserDocumentById(
    documentId,
    userId
  );


  const cleanQuestion = question.trim();


  let chunks = await getRelevantChunks(
    documentId,
    cleanQuestion
  );


  // If embeddings missing, create them
  if (!chunks || chunks.length === 0) {

    await indexDocument(
      documentId,
      doc.filePath
    );

    chunks = await getRelevantChunks(
      documentId,
      cleanQuestion
    );
  }



  let answer;


  if (chunks.length > 0) {

    try {

      answer = await generateAnswer(
        cleanQuestion,
        chunks
      );

    } catch (err) {

      console.error(
        "LLM Error:",
        err.message
      );

      answer =
        "Failed to generate answer.";

    }


  } else {

    answer =
      "No relevant information found.";

  }



  // IMPORTANT:
  // Query model needs "document"
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



const getQueriesByDocument = async (
  documentId,
  userId
) => {

  await getUserDocumentById(
    documentId,
    userId
  );


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