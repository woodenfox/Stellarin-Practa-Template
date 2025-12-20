import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerTranscriptionRoutes } from "./replit_integrations/transcription";

export async function registerRoutes(app: Express): Promise<Server> {
  registerTranscriptionRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
