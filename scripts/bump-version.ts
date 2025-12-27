import * as fs from "node:fs";
import * as path from "node:path";

const METADATA_PATH = path.resolve(process.cwd(), "client/my-practa/metadata.json");
const CONFIG_PATH = path.resolve(process.cwd(), "practa.config.json");
const CACHE_PATH = path.resolve(process.cwd(), ".cache/last-version-commit.json");

interface PractaMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  estimatedDuration?: number;
  category?: string;
  tags?: string[];
}

function getOrderedMetadata(metadata: PractaMetadata): Record<string, unknown> {
  return {
    id: metadata.id,
    name: metadata.name,
    version: metadata.version,
    description: metadata.description,
    author: metadata.author,
    ...(metadata.estimatedDuration !== undefined && { estimatedDuration: metadata.estimatedDuration }),
    ...(metadata.category && { category: metadata.category }),
    ...(metadata.tags && metadata.tags.length > 0 && { tags: metadata.tags }),
  };
}

function bumpPatchVersion(version: string): string {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!match) {
    return "1.0.1";
  }
  const [, major, minor, patch, suffix] = match;
  return `${major}.${minor}.${Number(patch) + 1}${suffix || ""}`;
}

export function bumpMetadataPatch(): { success: boolean; newVersion?: string; error?: string } {
  try {
    if (!fs.existsSync(METADATA_PATH)) {
      return { success: false, error: "metadata.json not found" };
    }

    const content = fs.readFileSync(METADATA_PATH, "utf-8");
    const metadata: PractaMetadata = JSON.parse(content);
    
    const oldVersion = metadata.version;
    const newVersion = bumpPatchVersion(oldVersion);
    metadata.version = newVersion;

    const ordered = getOrderedMetadata(metadata);
    const jsonContent = JSON.stringify(ordered, null, 2) + "\n";

    fs.writeFileSync(METADATA_PATH, jsonContent);
    fs.writeFileSync(CONFIG_PATH, jsonContent);

    console.log(`[Version Bump] ${oldVersion} -> ${newVersion}`);
    return { success: true, newVersion };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export function getLastProcessedCommit(): string | null {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
      return data.lastCommit || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function setLastProcessedCommit(commitSha: string): void {
  try {
    const cacheDir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(CACHE_PATH, JSON.stringify({ lastCommit: commitSha }, null, 2) + "\n");
  } catch (error) {
    console.error("[Version Bump] Failed to save commit cache:", error);
  }
}

export function getCurrentCommitSha(): string | null {
  try {
    const headPath = path.resolve(process.cwd(), ".git/HEAD");
    if (!fs.existsSync(headPath)) {
      return null;
    }

    const headContent = fs.readFileSync(headPath, "utf-8").trim();
    
    if (headContent.startsWith("ref: ")) {
      const refPath = path.resolve(process.cwd(), ".git", headContent.slice(5));
      if (fs.existsSync(refPath)) {
        return fs.readFileSync(refPath, "utf-8").trim();
      }
      return null;
    }
    
    return headContent;
  } catch {
    return null;
  }
}
