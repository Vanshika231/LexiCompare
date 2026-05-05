const mongoose = require("mongoose");

const querySchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: [true, "Document reference is required."],
    },
    question: {
      type: String,
      required: [true, "Question is required."],
      trim: true,
      minlength: [5, "Question must be at least 5 characters."],
    },
    answer: {
      type: String,
      default: null,
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Query", querySchema);