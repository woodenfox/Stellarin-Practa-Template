#!/usr/bin/env npx tsx
/**
 * Practa Validator CLI
 * 
 * Validates that a Practa component meets all requirements for submission.
 * Run with: npx tsx validate-practa.ts
 */

import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "success";
}

const PRACTA_PATH = "client/my-practa/index.tsx";
const METADATA_PATH = "client/my-practa/metadata.json";

function log(result: ValidationResult) {
  const icon = result.severity === "error" 
    ? "\x1b[31m✗\x1b[0m" 
    : result.severity === "warning" 
      ? "\x1b[33m!\x1b[0m" 
      : "\x1b[32m✓\x1b[0m";
  console.log(`  ${icon} ${result.message}`);
}

function validateFileExists(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  if (fs.existsSync(PRACTA_PATH)) {
    results.push({ passed: true, message: "File exists at client/my-practa/index.tsx", severity: "success" });
  } else {
    results.push({ passed: false, message: "File not found: client/my-practa/index.tsx", severity: "error" });
  }
  
  if (fs.existsSync(METADATA_PATH)) {
    results.push({ passed: true, message: "File exists at client/my-practa/metadata.json", severity: "success" });
  } else {
    results.push({ passed: false, message: "File not found: client/my-practa/metadata.json", severity: "error" });
  }
  
  return results;
}

function validateExports(source: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check for default export
  if (source.includes("export default") || source.includes("export { default }")) {
    results.push({ passed: true, message: "Has default export (component)", severity: "success" });
  } else {
    results.push({ passed: false, message: "Missing default export (component)", severity: "error" });
  }

  return results;
}

function validateMetadataContent(): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Read and parse metadata.json
  if (!fs.existsSync(METADATA_PATH)) {
    results.push({ passed: false, message: "metadata.json not found", severity: "error" });
    return results;
  }

  let metadata: Record<string, unknown>;
  try {
    const content = fs.readFileSync(METADATA_PATH, "utf-8");
    metadata = JSON.parse(content);
  } catch (e) {
    results.push({ passed: false, message: "metadata.json is not valid JSON", severity: "error" });
    return results;
  }

  // Check required fields
  const requiredFields = [
    { field: "id", label: "Practa ID" },
    { field: "name", label: "Display name" },
    { field: "description", label: "Description" },
    { field: "author", label: "Author" },
    { field: "version", label: "Version" },
  ];

  for (const { field, label } of requiredFields) {
    const value = metadata[field];
    if (value && typeof value === "string" && value.trim() !== "") {
      results.push({ passed: true, message: `${label} is present`, severity: "success" });
    } else {
      results.push({ passed: false, message: `${label} (${field}) is missing or empty`, severity: "error" });
    }
  }

  // Validate id format (kebab-case)
  const idValue = metadata.id;
  if (typeof idValue === "string") {
    const validPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (idValue.length < 3 || idValue.length > 50) {
      results.push({ 
        passed: false, 
        message: `Practa ID must be 3-50 characters`, 
        severity: "error" 
      });
    } else if (!validPattern.test(idValue)) {
      results.push({ 
        passed: false, 
        message: `Practa ID "${idValue}" must be lowercase kebab-case (e.g., "my-practa")`, 
        severity: "error" 
      });
    }
  }

  // Validate version format
  const versionValue = metadata.version;
  if (typeof versionValue === "string") {
    const validPattern = /^\d+\.\d+\.\d+$/;
    if (!validPattern.test(versionValue)) {
      results.push({ 
        passed: false, 
        message: `Version "${versionValue}" must be semver format (e.g., "1.0.0")`, 
        severity: "error" 
      });
    }
  }

  // Check optional fields
  if (metadata.estimatedDuration) {
    results.push({ passed: true, message: "estimatedDuration is present", severity: "success" });
  } else {
    results.push({ passed: true, message: "Consider adding estimatedDuration (in seconds)", severity: "warning" });
  }

  return results;
}

function validateComponentContract(source: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check for onComplete usage
  if (source.includes("onComplete(")) {
    results.push({ passed: true, message: "Component calls onComplete", severity: "success" });
  } else {
    results.push({ passed: false, message: "Component must call onComplete when finished", severity: "error" });
  }

  // Check for context prop
  if (source.includes("context")) {
    results.push({ passed: true, message: "Component accepts context prop", severity: "success" });
  } else {
    results.push({ passed: true, message: "Component doesn't use context (may be intentional)", severity: "warning" });
  }

  // Check for onSkip support
  if (source.includes("onSkip")) {
    results.push({ passed: true, message: "Component supports onSkip", severity: "success" });
  } else {
    results.push({ passed: true, message: "Consider supporting onSkip for user flexibility", severity: "warning" });
  }

  return results;
}

function validateBestPractices(source: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check for theme usage
  if (source.includes("useTheme")) {
    results.push({ passed: true, message: "Uses theme system for colors", severity: "success" });
  } else {
    results.push({ passed: true, message: "Consider using useTheme() for theme-aware colors", severity: "warning" });
  }

  // Check for haptics
  if (source.includes("Haptics")) {
    results.push({ passed: true, message: "Uses haptic feedback", severity: "success" });
  } else {
    results.push({ passed: true, message: "Consider adding haptic feedback", severity: "warning" });
  }

  // Check for safe area
  if (source.includes("useSafeAreaInsets") || source.includes("SafeAreaView")) {
    results.push({ passed: true, message: "Uses safe area handling", severity: "success" });
  } else {
    results.push({ passed: true, message: "Consider using safe area insets", severity: "warning" });
  }

  // Check for TypeScript types
  if (source.includes("PractaContext") || source.includes("PractaCompleteHandler")) {
    results.push({ passed: true, message: "Uses proper TypeScript types", severity: "success" });
  } else {
    results.push({ passed: true, message: "Consider importing PractaContext and PractaCompleteHandler types", severity: "warning" });
  }

  // Check for direct require() usage in component code
  const requirePattern = /require\s*\(\s*["']\.\/assets\//;
  if (requirePattern.test(source)) {
    results.push({ 
      passed: false, 
      message: "Do not use require() directly for assets. Use assets.getImageSource() from ./assets.ts", 
      severity: "error" 
    });
  }

  return results;
}

function main() {
  console.log("\n\x1b[1m📋 Practa Validator\x1b[0m\n");

  const allResults: ValidationResult[] = [];

  // Step 1: Files exist
  console.log("\x1b[1mFile Structure\x1b[0m");
  const fileResults = validateFileExists();
  fileResults.forEach(log);
  allResults.push(...fileResults);

  const hasFileErrors = fileResults.some(r => !r.passed);
  if (hasFileErrors) {
    console.log("\n\x1b[31m✗ Validation failed: Required files not found\x1b[0m\n");
    process.exit(1);
  }

  // Read source
  const source = fs.readFileSync(PRACTA_PATH, "utf-8");

  // Step 2: Exports
  console.log("\n\x1b[1mExports\x1b[0m");
  const exportResults = validateExports(source);
  exportResults.forEach(log);
  allResults.push(...exportResults);

  // Step 3: Metadata
  console.log("\n\x1b[1mMetadata Schema\x1b[0m");
  const metadataResults = validateMetadataContent();
  metadataResults.forEach(log);
  allResults.push(...metadataResults);

  // Step 4: Component Contract
  console.log("\n\x1b[1mComponent Contract\x1b[0m");
  const contractResults = validateComponentContract(source);
  contractResults.forEach(log);
  allResults.push(...contractResults);

  // Step 5: Best Practices
  console.log("\n\x1b[1mBest Practices\x1b[0m");
  const practiceResults = validateBestPractices(source);
  practiceResults.forEach(log);
  allResults.push(...practiceResults);

  // Summary
  const errors = allResults.filter(r => r.severity === "error" && !r.passed);
  const warnings = allResults.filter(r => r.severity === "warning");
  const successes = allResults.filter(r => r.severity === "success" && r.passed);

  console.log("\n\x1b[1mSummary\x1b[0m");
  console.log(`  \x1b[32m${successes.length} passed\x1b[0m`);
  console.log(`  \x1b[33m${warnings.length} warnings\x1b[0m`);
  console.log(`  \x1b[31m${errors.length} errors\x1b[0m`);

  if (errors.length > 0) {
    console.log("\n\x1b[31m✗ Validation failed: Fix the errors above before submitting\x1b[0m\n");
    process.exit(1);
  } else {
    console.log("\n\x1b[32m✓ Validation passed! Your Practa is ready for review\x1b[0m\n");
    process.exit(0);
  }
}

main();
