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

  const TEND_API_BASE = "https://tend-cards-api.replit.app/api";

  app.get("/api/tend/today", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId is required" });
      }
      const response = await fetch(`${TEND_API_BASE}/tend/today?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error fetching tend status:", error);
      res.status(500).json({ error: "Failed to fetch tend status" });
    }
  });

  app.post("/api/tend/draw", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId is required" });
      }
      const response = await fetch(`${TEND_API_BASE}/tend/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error drawing tend card:", error);
      res.status(500).json({ error: "Failed to draw tend card" });
    }
  });

  app.post("/api/tend/complete", async (req, res) => {
    try {
      const { userId, note } = req.body;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId is required" });
      }
      const response = await fetch(`${TEND_API_BASE}/tend/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, note }),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error completing tend card:", error);
      res.status(500).json({ error: "Failed to complete tend card" });
    }
  });

  app.get("/api/tend/history", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "userId is required" });
      }
      const response = await fetch(`${TEND_API_BASE}/tend/history?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error fetching tend history:", error);
      res.status(500).json({ error: "Failed to fetch tend history" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
