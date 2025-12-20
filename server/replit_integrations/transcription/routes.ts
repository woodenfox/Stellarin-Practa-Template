import type { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export function registerTranscriptionRoutes(app: Express): void {
  app.post("/api/transcribe", async (req: Request, res: Response) => {
    try {
      const { audioBase64, mimeType = "audio/m4a" } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text: "Please transcribe this audio recording accurately. Return only the transcription text, without any additional commentary or formatting.",
              },
            ],
          },
        ],
      });

      const transcription = response.text || "";

      res.json({ transcription });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });
}
