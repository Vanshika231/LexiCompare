require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const documentRoutes = require("./routes/document.routes");
const queryRoutes = require("./routes/query.routes");

const app = express();

// 🔐 Check important env variables
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);

// Routes (basic)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/documents", documentRoutes);
app.use("/api/query", queryRoutes); 



const PORT = process.env.PORT || 5000;

// 🚀 Start server only after DB connects
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();