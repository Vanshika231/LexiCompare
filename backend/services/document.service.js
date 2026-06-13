const Document = require("../models/Document.model");
const { indexDocument } = require("./rag.service");
const saveDocuments = async (files, userId) => {
  const docs = files.map((file) => ({
    name: file.originalname,
    originalName: file.originalname,
    filePath: file.path,
    size: file.size,
    uploadedBy: userId,
    status: "uploaded",
  }));

  // Save documents
  const saved = await Document.insertMany(docs);

  // Index each document and update status
  await Promise.all(
    saved.map(async (doc) => {
      try {
        await indexDocument(doc._id.toString(), doc.filePath);

        await Document.findByIdAndUpdate(doc._id, {
          status: "ready",
        });
      } catch (err) {
  console.error(`Failed to index ${doc.originalName}:`, err.message);

  await Document.findByIdAndUpdate(doc._id, {
    status: "failed",
  });
}
    })
  );

  return await Document.find({
    _id: { $in: saved.map((d) => d._id) },
  });
};

const getUserDocuments = async (userId) => {
  return Document.find({ uploadedBy: userId }).sort({ createdAt: -1 });
};

const getUserDocumentById = async (docId, userId) => {
  const doc = await Document.findOne({ _id: docId, uploadedBy: userId });

  if (!doc) {
    const error = new Error("Document not found.");
    error.statusCode = 404;
    throw error;
  }

  return doc;
};

module.exports = { saveDocuments, getUserDocuments, getUserDocumentById };