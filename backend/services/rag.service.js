const fs = require("fs/promises");
const pdfParse = require("pdf-parse");
const mongoose = require("mongoose");
const Chunk = require("../models/Chunk.model");
const Document = require("../models/Document.model");


const {
  embedChunks,
  embedText,

} = require("./embedding.service");


const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const TOP_K = 3;


// ---------------------------------------------------------------------------
// PDF parsing
// ---------------------------------------------------------------------------

const extractTextFromPDF = async (filePath) => {
  try {
    const buffer = await fs.readFile(filePath);

    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF contains no readable text");
    }

    return data.text;

  } catch (err) {
    console.error("PDF extraction failed:", err.message);
    throw err;
  }
};


// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

const splitIntoChunks = (text) => {
  const chunks = [];

  let start = 0;

  while (start < text.length) {

    const chunk = text
      .slice(start, start + CHUNK_SIZE)
      .trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
};



// ---------------------------------------------------------------------------
// Indexing document
// PDF -> chunks -> embeddings -> MongoDB
// ---------------------------------------------------------------------------



const indexDocument = async (documentId, filePath) => {

  try {

    await Document.findByIdAndUpdate(
      documentId,
      {
        status:"processing",
        errorMessage:null
      }
    );


    await Chunk.deleteMany({
      documentId
    });


    const text =
      await extractTextFromPDF(filePath);


    const chunks =
      splitIntoChunks(text);


    const embeddings =
      await embedChunks(chunks);



    const docs =
      chunks.map((chunk,i)=>({

        documentId,

        chunkIndex:i,

        text:chunk,

        embedding:embeddings[i]

      }));


    await Chunk.insertMany(docs);



    await Document.findByIdAndUpdate(
      documentId,
      {
        status:"ready"
      }
    );


    return chunks.length;


  } catch(err){


    await Document.findByIdAndUpdate(
      documentId,
      {
        status:"failed",
        errorMessage:err.message
      }
    );


    throw err;
  }

};


// ---------------------------------------------------------------------------
// Retrieval
// question -> embedding -> similarity search
// ---------------------------------------------------------------------------

const getRelevantChunks = async (
  documentId,
  question
) => {

  const queryEmbedding =
    await embedText(question);


  const results =
    await Chunk.aggregate([

      {
        $vectorSearch: {

          index: "vector_index",

          path: "embedding",

          queryVector: queryEmbedding,

          numCandidates: 100,

          limit: TOP_K,

          filter: {
            documentId:
              new mongoose.Types.ObjectId(documentId)
          }

        }
      },


      {
        $project: {

          _id:0,

          text:1,

          score:{
            $meta:"vectorSearchScore"
          }

        }
      }


    ]);


  return results.map(
    item => item.text
  );

};


// ---------------------------------------------------------------------------

module.exports = {
  indexDocument,
  getRelevantChunks,
};