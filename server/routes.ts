import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerTranscriptionRoutes } from "./replit_integrations/transcription";
import { storage } from "./storage";
import { insertRiceContributionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  registerTranscriptionRoutes(app);

  app.post("/api/devices/register", async (req, res) => {
    try {
      const { anonymousId } = req.body;
      if (!anonymousId || typeof anonymousId !== "string") {
        return res.status(400).json({ error: "anonymousId is required" });
      }
      const device = await storage.registerDevice(anonymousId);
      res.json(device);
    } catch (error) {
      console.error("Error registering device:", error);
      res.status(500).json({ error: "Failed to register device" });
    }
  });

  app.post("/api/rice/contribute", async (req, res) => {
    try {
      const parsed = insertRiceContributionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid contribution data",
          details: parsed.error.errors 
        });
      }
      const contribution = await storage.addRiceContribution(parsed.data);
      res.json(contribution);
    } catch (error) {
      console.error("Error adding rice contribution:", error);
      res.status(500).json({ error: "Failed to add contribution" });
    }
  });

  app.get("/api/rice/total", async (req, res) => {
    try {
      const total = await storage.getTotalRice();
      res.json({ total });
    } catch (error) {
      console.error("Error getting total rice:", error);
      res.status(500).json({ error: "Failed to get total rice" });
    }
  });

  app.get("/api/rice/device/:anonymousId", async (req, res) => {
    try {
      const { anonymousId } = req.params;
      const total = await storage.getDeviceRice(anonymousId);
      res.json({ total });
    } catch (error) {
      console.error("Error getting device rice:", error);
      res.status(500).json({ error: "Failed to get device rice" });
    }
  });

  app.get("/api/stats/community", async (req, res) => {
    try {
      const [totalRice, totalMeditators] = await Promise.all([
        storage.getTotalRice(),
        storage.getTotalMeditators(),
      ]);
      res.json({ totalRice, totalMeditators });
    } catch (error) {
      console.error("Error getting community stats:", error);
      res.status(500).json({ error: "Failed to get community stats" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
