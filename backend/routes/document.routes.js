const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const upload = require("../config/multer");
const {
  uploadDocuments,
  getDocuments,
  getDocumentById,
} = require("../controllers/document.controller");

router.post("/upload", protect, upload.array("files", 10), uploadDocuments);
router.get("/", protect, getDocuments);
router.get("/:id", protect, getDocumentById);

module.exports = router;