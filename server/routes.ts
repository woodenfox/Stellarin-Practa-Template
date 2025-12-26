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

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per file
const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024; // 25MB total
const ALLOWED_ASSET_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".mp3", ".wav", ".m4a", ".ogg",
  ".mp4", ".webm",
  ".json", ".txt"
];

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

interface AssetValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  totalSize: number;
  fileCount: number;
}

function validateAssets(practaDir: string): AssetValidationResult {
  const result: AssetValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    totalSize: 0,
    fileCount: 0,
  };

  const assetsDir = path.join(practaDir, "assets");
  
  if (!fs.existsSync(assetsDir)) {
    return result;
  }

  function scanDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(practaDir, fullPath);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        result.fileCount++;
        const stats = fs.statSync(fullPath);
        const ext = path.extname(entry.name).toLowerCase();
        
        result.totalSize += stats.size;
        
        if (stats.size > MAX_FILE_SIZE_BYTES) {
          result.errors.push(
            `File "${relativePath}" exceeds 5MB limit (${(stats.size / 1024 / 1024).toFixed(2)}MB)`
          );
          result.valid = false;
        }
        
        if (!ALLOWED_ASSET_EXTENSIONS.includes(ext)) {
          result.warnings.push(
            `File "${relativePath}" has unsupported extension "${ext}"`
          );
        }
      }
    }
  }

  scanDirectory(assetsDir);

  if (result.totalSize > MAX_TOTAL_SIZE_BYTES) {
    result.errors.push(
      `Total package size exceeds 25MB limit (${(result.totalSize / 1024 / 1024).toFixed(2)}MB)`
    );
    result.valid = false;
  }

  return result;
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

    const componentName = config ? config.name.replace(/[^a-zA-Z0-9]/g, "") : "MyPracta";
    
    const manifest = config ? {
      name: config.type,
      version: config.version,
      displayName: config.name,
      description: config.description,
      author: config.author,
      type: "widget",
      category: "wellbeing",
      tags: ["practa", "meditation", "wellbeing"],
      estimatedDuration: config.estimatedDuration,
      requiredPermissions: [],
    } : null;

    const readme = config ? `# ${config.name}

${config.description}

## Installation

This Practa component is designed for the Stellarin app.

## Usage

\`\`\`tsx
import ${componentName} from "@stellarin/practa-${config.type}";

function MyFlow() {
  return (
    <${componentName}
      context={{ flowId: "my-flow", practaIndex: 0 }}
      onComplete={(output) => console.log("Completed:", output)}
      onSkip={() => console.log("Skipped")}
    />
  );
}
\`\`\`

## Props

This component accepts the standard Practa props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| \`context\` | PractaContext | Yes | Flow context from previous Practa |
| \`onComplete\` | (output: PractaOutput) => void | Yes | Callback when the Practa completes |
| \`onSkip\` | () => void | No | Optional callback to skip the Practa |

## Author

Created by ${config.author}

## Version

${config.version}
` : null;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      res.status(500).json({ error: "Failed to create archive" });
    });

    archive.pipe(res);
    archive.directory(practaDir, "my-practa");
    
    if (manifest) {
      archive.append(JSON.stringify(manifest, null, 2), { name: "my-practa/metadata.json" });
    }
    if (readme) {
      archive.append(readme, { name: "my-practa/README.md" });
    }
    
    archive.finalize();
  });

  app.get("/api/practa/validate-assets", (req, res) => {
    const practaDir = path.resolve(process.cwd(), "client/my-practa");
    
    if (!fs.existsSync(practaDir)) {
      return res.status(404).json({ error: "Practa directory not found" });
    }

    const result = validateAssets(practaDir);
    res.json({
      ...result,
      totalSizeMB: (result.totalSize / 1024 / 1024).toFixed(2),
      maxFileSizeMB: MAX_FILE_SIZE_BYTES / 1024 / 1024,
      maxTotalSizeMB: MAX_TOTAL_SIZE_BYTES / 1024 / 1024,
    });
  });

  app.post("/api/practa/submit", async (req, res) => {
    const SUBMIT_URL = "https://stellarin-practa-verification.replit.app/api/submissions/upload-preview";
    
    try {
      const practaDir = path.resolve(process.cwd(), "client/my-practa");
      
      if (!fs.existsSync(practaDir)) {
        return res.status(404).json({ error: "Practa directory not found" });
      }

      const assetValidation = validateAssets(practaDir);
      if (!assetValidation.valid) {
        return res.status(400).json({ 
          error: "Asset validation failed", 
          errors: assetValidation.errors,
          warnings: assetValidation.warnings,
          totalSizeMB: (assetValidation.totalSize / 1024 / 1024).toFixed(2),
        });
      }

      const config = readConfig();
      if (!config) {
        return res.status(400).json({ error: "Practa configuration not found" });
      }

      const componentName = config.name.replace(/[^a-zA-Z0-9]/g, "");

      const manifest = {
        name: config.type,
        version: config.version,
        displayName: config.name,
        description: config.description,
        author: config.author,
        type: "widget",
        category: "wellbeing",
        tags: ["practa", "meditation", "wellbeing"],
        estimatedDuration: config.estimatedDuration,
        requiredPermissions: [],
      };

      const readme = `# ${config.name}

${config.description}

## Installation

This Practa component is designed for the Stellarin app.

## Usage

\`\`\`tsx
import ${componentName} from "@stellarin/practa-${config.type}";

function MyFlow() {
  return (
    <${componentName}
      context={{ flowId: "my-flow", practaIndex: 0 }}
      onComplete={(output) => console.log("Completed:", output)}
      onSkip={() => console.log("Skipped")}
    />
  );
}
\`\`\`

## Props

This component accepts the standard Practa props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| \`context\` | PractaContext | Yes | Flow context from previous Practa |
| \`onComplete\` | (output: PractaOutput) => void | Yes | Callback when the Practa completes |
| \`onSkip\` | () => void | No | Optional callback to skip the Practa |

## Author

Created by ${config.author}

## Version

${config.version}
`;

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
        archive.append(JSON.stringify(manifest, null, 2), { name: "my-practa/metadata.json" });
        archive.append(readme, { name: "my-practa/README.md" });
        archive.finalize();
      });

      const zipBuffer = Buffer.concat(chunks);
      const blob = new Blob([zipBuffer], { type: "application/zip" });
      
      const formData = new FormData();
      formData.append("file", blob, `${config.type}-${config.version}.zip`);

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
      const isMasterTemplate = !!process.env.MASTER_TEMPLATE_KEY;
      
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
      
      let gitHeadSha = "";
      try {
        const gitHeadPath = path.resolve(process.cwd(), ".git/HEAD");
        if (fs.existsSync(gitHeadPath)) {
          const headContent = fs.readFileSync(gitHeadPath, "utf-8").trim();
          if (headContent.startsWith("ref: ")) {
            const refPath = path.resolve(process.cwd(), ".git", headContent.substring(5));
            if (fs.existsSync(refPath)) {
              gitHeadSha = fs.readFileSync(refPath, "utf-8").trim();
            }
          } else {
            gitHeadSha = headContent;
          }
        }
      } catch {
      }
      
      if (gitHeadSha && gitHeadSha === latestSha) {
        if (localSha !== latestSha) {
          fs.writeFileSync(syncFilePath, latestSha);
          localSha = latestSha;
        }
      }
      
      // For master template: check if local git HEAD differs from remote (unpushed changes)
      // For forks: check if .template-sync differs from remote (updates available)
      const isInSync = isMasterTemplate 
        ? (gitHeadSha === latestSha)
        : (localSha === latestSha);
      
      res.json({
        isInSync,
        localVersion: isMasterTemplate ? gitHeadSha : (localSha || null),
        latestVersion: latestSha,
        repoUrl: `https://github.com/${TEMPLATE_REPO}`,
        repoAvailable: true,
        isMasterTemplate,
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
