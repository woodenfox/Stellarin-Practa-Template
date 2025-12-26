import type { Express } from "express";
import { createServer, type Server } from "node:http";
import * as fs from "fs";
import * as path from "path";
import { PassThrough } from "node:stream";
import archiver from "archiver";
import AdmZip from "adm-zip";

const CONFIG_PATH = path.resolve(process.cwd(), "practa.config.json");
const TEMPLATE_REPO = "woodenfox/Stellarin-Practa-Template";
const PROTECTED_PATHS = ["client/my-practa", "practa.config.json"];

interface PractaMetadata {
  type: string;
  name: string;
  description: string;
  author: string;
  version: string;
  estimatedDuration?: number;
}

function validateMetadata(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Invalid data format"] };
  }
  
  const metadata = data as Record<string, unknown>;
  
  if (!metadata.type || typeof metadata.type !== "string") {
    errors.push("type is required and must be a string");
  } else if (!/^[a-z][a-z0-9-]*$/.test(metadata.type)) {
    errors.push("type must be lowercase with hyphens only (e.g., 'my-practa')");
  }
  
  if (!metadata.name || typeof metadata.name !== "string") {
    errors.push("name is required and must be a string");
  }
  
  if (!metadata.description || typeof metadata.description !== "string") {
    errors.push("description is required and must be a string");
  }
  
  if (!metadata.author || typeof metadata.author !== "string") {
    errors.push("author is required and must be a string");
  }
  
  if (!metadata.version || typeof metadata.version !== "string") {
    errors.push("version is required and must be a string");
  } else if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) {
    errors.push("version must follow semantic versioning (e.g., '1.0.0')");
  }
  
  if (metadata.estimatedDuration !== undefined) {
    if (typeof metadata.estimatedDuration !== "number" || metadata.estimatedDuration < 0) {
      errors.push("estimatedDuration must be a positive number");
    }
  }
  
  return { valid: errors.length === 0, errors };
}

function readConfig(): PractaMetadata | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading practa.config.json:", error);
  }
  return null;
}

function writeConfig(metadata: PractaMetadata): boolean {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(metadata, null, 2) + "\n");
    return true;
  } catch (error) {
    console.error("Error writing practa.config.json:", error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/practa/metadata", (req, res) => {
    const config = readConfig();
    if (config) {
      res.json(config);
    } else {
      res.status(404).json({ error: "Configuration not found" });
    }
  });

  app.put("/api/practa/metadata", (req, res) => {
    const validation = validateMetadata(req.body);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: "Validation failed", 
        errors: validation.errors 
      });
    }
    
    const metadata: PractaMetadata = {
      type: req.body.type,
      name: req.body.name,
      description: req.body.description,
      author: req.body.author,
      version: req.body.version,
      estimatedDuration: req.body.estimatedDuration,
    };
    
    if (writeConfig(metadata)) {
      res.json(metadata);
    } else {
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  app.get("/api/practa/download-zip", (req, res) => {
    const practaDir = path.resolve(process.cwd(), "client/my-practa");
    
    if (!fs.existsSync(practaDir)) {
      return res.status(404).json({ error: "Practa directory not found" });
    }

    const config = readConfig();
    const filename = config ? `${config.type}-${config.version}.zip` : "practa.zip";

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      res.status(500).json({ error: "Failed to create archive" });
    });

    archive.pipe(res);
    archive.directory(practaDir, "my-practa");
    
    if (fs.existsSync(CONFIG_PATH)) {
      archive.file(CONFIG_PATH, { name: "practa.config.json" });
    }
    
    archive.finalize();
  });

  app.post("/api/practa/submit", async (req, res) => {
    const SUBMIT_URL = process.env.PRACTA_SUBMIT_URL || "https://api.stellarin.app/practa/submit";
    
    try {
      const practaDir = path.resolve(process.cwd(), "client/my-practa");
      
      if (!fs.existsSync(practaDir)) {
        return res.status(404).json({ error: "Practa directory not found" });
      }

      const config = readConfig();
      if (!config) {
        return res.status(400).json({ error: "Practa configuration not found" });
      }

      const chunks: Buffer[] = [];
      const archive = archiver("zip", { zlib: { level: 9 } });
      const passThrough = new PassThrough();
      
      passThrough.on("data", (chunk) => chunks.push(chunk));
      archive.pipe(passThrough);
      
      await new Promise<void>((resolve, reject) => {
        passThrough.on("end", resolve);
        archive.on("error", reject);
        passThrough.on("error", reject);
        
        archive.directory(practaDir, "my-practa");
        archive.file(CONFIG_PATH, { name: "practa.config.json" });
        archive.finalize();
      });

      const zipBuffer = Buffer.concat(chunks);
      const blob = new Blob([zipBuffer], { type: "application/zip" });
      
      const formData = new FormData();
      formData.append("file", blob, `${config.type}-${config.version}.zip`);
      formData.append("metadata", JSON.stringify(config));

      const response = await fetch(SUBMIT_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          error: "Submission failed", 
          details: errorText 
        });
      }

      const result = await response.json();
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Submit error:", error);
      res.status(500).json({ 
        error: "Failed to submit practa",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/template/sync-status", async (req, res) => {
    try {
      const repoResponse = await fetch(
        `https://api.github.com/repos/${TEMPLATE_REPO}`,
        { headers: { "Accept": "application/vnd.github+json" } }
      );
      
      if (!repoResponse.ok) {
        return res.json({
          isInSync: true,
          localVersion: null,
          latestVersion: null,
          repoUrl: `https://github.com/${TEMPLATE_REPO}`,
          repoAvailable: false,
        });
      }
      
      const repoData = await repoResponse.json();
      const defaultBranch = repoData.default_branch || "main";
      
      const branchResponse = await fetch(
        `https://api.github.com/repos/${TEMPLATE_REPO}/branches/${defaultBranch}`,
        { headers: { "Accept": "application/vnd.github+json" } }
      );
      
      if (!branchResponse.ok) {
        return res.json({
          isInSync: true,
          localVersion: null,
          latestVersion: null,
          repoUrl: `https://github.com/${TEMPLATE_REPO}`,
          repoAvailable: false,
        });
      }
      
      const branchData = await branchResponse.json();
      const latestSha = branchData.commit.sha;
      
      const syncFilePath = path.resolve(process.cwd(), ".template-sync");
      let localSha = "";
      
      if (fs.existsSync(syncFilePath)) {
        localSha = fs.readFileSync(syncFilePath, "utf-8").trim();
      }
      
      const isInSync = localSha === latestSha;
      
      res.json({
        isInSync,
        localVersion: localSha || null,
        latestVersion: latestSha,
        repoUrl: `https://github.com/${TEMPLATE_REPO}`,
        repoAvailable: true,
      });
    } catch (error) {
      console.error("Sync check error:", error);
      res.json({
        isInSync: true,
        localVersion: null,
        latestVersion: null,
        repoUrl: `https://github.com/${TEMPLATE_REPO}`,
        repoAvailable: false,
      });
    }
  });

  app.post("/api/template/update", async (req, res) => {
    try {
      const repoResponse = await fetch(
        `https://api.github.com/repos/${TEMPLATE_REPO}`,
        { headers: { "Accept": "application/vnd.github+json" } }
      );
      
      if (!repoResponse.ok) {
        return res.status(500).json({ 
          error: "Template repository not available" 
        });
      }
      
      const repoData = await repoResponse.json();
      const defaultBranch = repoData.default_branch || "main";
      
      const branchResponse = await fetch(
        `https://api.github.com/repos/${TEMPLATE_REPO}/branches/${defaultBranch}`,
        { headers: { "Accept": "application/vnd.github+json" } }
      );
      
      if (!branchResponse.ok) {
        return res.status(500).json({ 
          error: "Failed to fetch template info" 
        });
      }
      
      const branchData = await branchResponse.json();
      const latestSha = branchData.commit.sha;
      
      const archiveUrl = `https://api.github.com/repos/${TEMPLATE_REPO}/zipball/${defaultBranch}`;
      const archiveResponse = await fetch(archiveUrl, {
        headers: { "Accept": "application/vnd.github+json" }
      });
      
      if (!archiveResponse.ok) {
        return res.status(500).json({ 
          error: "Failed to download template" 
        });
      }
      
      const arrayBuffer = await archiveResponse.arrayBuffer();
      const zipBuffer = Buffer.from(arrayBuffer);
      
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();
      
      if (zipEntries.length === 0) {
        return res.status(500).json({ error: "Invalid template archive" });
      }
      
      const firstEntry = zipEntries[0].entryName;
      const rootFolder = firstEntry.split("/")[0];
      const projectRoot = process.cwd();
      
      const SKIP_PATTERNS = [".git/", "node_modules/", ".template-update-temp/"];
      
      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;
        
        const entryPath = entry.entryName;
        const relativePath = entryPath.substring(rootFolder.length + 1);
        
        if (!relativePath) continue;
        
        const isProtected = PROTECTED_PATHS.some(
          (p) => relativePath === p || relativePath.startsWith(p + "/")
        );
        if (isProtected) continue;
        
        const shouldSkip = SKIP_PATTERNS.some((p) => relativePath.startsWith(p));
        if (shouldSkip) continue;
        
        const destPath = path.join(projectRoot, relativePath);
        const destDir = path.dirname(destPath);
        
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.writeFileSync(destPath, entry.getData());
      }
      
      const syncFilePath = path.resolve(projectRoot, ".template-sync");
      fs.writeFileSync(syncFilePath, latestSha);
      
      res.json({
        success: true,
        updatedTo: latestSha,
        message: "Template updated successfully. Restart the app to see changes."
      });
    } catch (error) {
      console.error("Template update error:", error);
      res.status(500).json({
        error: "Failed to update template",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
