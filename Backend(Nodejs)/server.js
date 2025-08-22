import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Simple chat route
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    // Call Ollama locally
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3", // change if you pulled a different model
        prompt: `You are Pritam Kumar, a CS student. Answer as yourself.\nUser asked: ${userMessage}`
      })
    });

    const data = await response.json();
    res.json({ reply: data.response });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Start server
app.listen(3000, () => {
  console.log("🚀 Backend running at http://localhost:3000");
});
