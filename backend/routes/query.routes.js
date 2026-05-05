const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { askQuery, getQueries } = require("../controllers/query.controller");

router.post("/", protect, askQuery);
router.get("/:documentId", protect, getQueries);

module.exports = router;