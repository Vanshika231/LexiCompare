const { createQuery, getQueriesByDocument } = require("../services/query.service");

const askQuery = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({ error: "documentId and question are required." });
    }

    if (question.trim().length < 5) {
      return res.status(400).json({ error: "Question must be at least 5 characters." });
    }

    const result = await createQuery(documentId, question.trim(), req.user.id);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const getQueries = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const queries = await getQueriesByDocument(documentId, req.user.id);
    return res.status(200).json({ count: queries.length, queries });
  } catch (err) {
    next(err);
  }
};

module.exports = { askQuery, getQueries };