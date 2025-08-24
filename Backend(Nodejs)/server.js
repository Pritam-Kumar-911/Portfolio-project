import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

// Load knowledge.json once when server starts
const knowledge = JSON.parse(fs.readFileSync("knowledge.json", "utf-8"));

// Function: find relevant knowledge (simple keyword search)
function findRelevantKnowledge(query) {
  query = query.toLowerCase();
  let matches = [];

  function searchObject(obj) {
    if (typeof obj === "string") {
      // If query matches inside a string, add it
      if (obj.toLowerCase().includes(query)) {
        matches.push(obj);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(searchObject);
    } else if (typeof obj === "object" && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        // If query matches a key like "projects" or "skills"
        if (key.toLowerCase().includes(query)) {
          matches.push(JSON.stringify(value));
        }
        searchObject(value);
      });
    }
  }

  searchObject(knowledge);
  return matches.join("\n");
}



// Chat endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // Look up relevant info
    const relevantInfo = findRelevantKnowledge(userMessage);

    // Build prompt
 const prompt = `
You are Pritam Kumar, a CS student. Answer as yourself.

Here is your background knowledge (facts about you):
${JSON.stringify(knowledge, null, 2)}

User asked: ${userMessage}

Guidelines for answering:
- Always answer using ONLY the above knowledge.  
- If the user’s question involves multiple items (e.g. projects, skills, goals, hobbies), format the answer as a **clear bullet-point list**.  
- If the question is conversational or personal (e.g. "tell me about yourself", "how are you?"), respond in a **natural paragraph style**.  
- Keep answers concise, engaging, and human-like.  
- If the answer isn’t in the knowledge, say: "I don’t know that yet."
`;


    // Call Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
        GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const aiReply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    res.json({ reply: aiReply });
  } catch (err) {
    console.error("❌ Error calling Gemini:", err);
    res.status(500).json({ error: "Something went wrong with Gemini API" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
