import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Endpoints

app.get("/", (req, res) => {
  res.json("This is the root route. Move along please");
});

app.post("/chat", async function (req, res) {
  const prompt = req.body.userPrompt;
  console.log(prompt);

  if (!prompt) {
    res.json("No prompt given");
  } else {
    const craftedPrompt = `Provide the return date and UK streaming service for the TV show "${prompt}". Format the response as a JSON object with properties 'seriesTitle', 'returnDate', and 'ukStreamingService'. The 'returnDate' should be "Not yet announced" if it is unknown. The 'ukStreamingService' should be a single string containing the primary platform(s) (e.g., "Netflix", "BBC iPlayer", or "Disney+ and Hulu"). Do not include any other text or formatting.`;
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "you are a helpful assistant",
      },
    });

    console.log("Geminis response is", geminiResponse.text);

    res.json(geminiResponse.text);
  }
});

app.listen(8080, function () {
  console.log("Running on port 8080");
});
