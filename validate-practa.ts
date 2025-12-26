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

function log(result: ValidationResult) {
  const icon = result.severity === "error" 
    ? "\x1b[31m✗\x1b[0m" 
    : result.severity === "warning" 
      ? "\x1b[33m!\x1b[0m" 
      : "\x1b[32m✓\x1b[0m";
  console.log(`  ${icon} ${result.message}`);
}

function validateFileExists(): ValidationResult {
  if (fs.existsSync(PRACTA_PATH)) {
    return { passed: true, message: "File exists at client/my-practa/index.tsx", severity: "success" };
  }
  return { passed: false, message: "File not found: client/my-practa/index.tsx", severity: "error" };
}

function validateExports(source: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check for default export
  if (source.includes("export default") || source.includes("export { default }")) {
    results.push({ passed: true, message: "Has default export (component)", severity: "success" });
  } else {
    results.push({ passed: false, message: "Missing default export (component)", severity: "error" });
  }

  // Check for metadata export
  if (source.includes("export const metadata") || source.includes("export { metadata }")) {
    results.push({ passed: true, message: "Has metadata export", severity: "success" });
  } else {
    results.push({ passed: false, message: "Missing metadata export", severity: "error" });
  }

  return results;
}

function validateMetadataContent(source: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Extract metadata object from source
  const metadataMatch = source.match(/export const metadata\s*=\s*\{([\s\S]*?)\};/);
  if (!metadataMatch) {
    results.push({ passed: false, message: "Could not parse metadata object", severity: "error" });
    return results;
  }

  const metadataContent = metadataMatch[1];

  // Check required fields
  const requiredFields = [
    { field: "type", pattern: /type:\s*["']([^"']+)["']/ },
    { field: "name", pattern: /name:\s*["']([^"']+)["']/ },
    { field: "description", pattern: /description:\s*["']([^"']+)["']/ },
    { field: "author", pattern: /author:\s*["']([^"']+)["']/ },
    { field: "version", pattern: /version:\s*["']([^"']+)["']/ },
  ];

  for (const { field, pattern } of requiredFields) {
    const match = metadataContent.match(pattern);
    if (match && match[1].trim()) {
      results.push({ passed: true, message: `metadata.${field} is present`, severity: "success" });
    } else {
      results.push({ passed: false, message: `metadata.${field} is missing or empty`, severity: "error" });
    }
  }

  // Validate type format
  const typeMatch = metadataContent.match(/type:\s*["']([^"']+)["']/);
  if (typeMatch) {
    const typeValue = typeMatch[1];
    const validPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!validPattern.test(typeValue)) {
      results.push({ 
        passed: false, 
        message: `metadata.type "${typeValue}" must be lowercase with hyphens (e.g., "my-practa")`, 
        severity: "error" 
      });
    }
  }

  // Validate version format
  const versionMatch = metadataContent.match(/version:\s*["']([^"']+)["']/);
  if (versionMatch) {
    const versionValue = versionMatch[1];
    const validPattern = /^\d+\.\d+\.\d+$/;
    if (!validPattern.test(versionValue)) {
      results.push({ 
        passed: false, 
        message: `metadata.version "${versionValue}" must be semver format (e.g., "1.0.0")`, 
        severity: "error" 
      });
    }
  }

  // Check optional fields
  if (metadataContent.includes("estimatedDuration")) {
    results.push({ passed: true, message: "metadata.estimatedDuration is present", severity: "success" });
  } else {
    results.push({ passed: true, message: "Consider adding metadata.estimatedDuration", severity: "warning" });
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
  if (source.includes("PractaContext") && source.includes("PractaOutput")) {
    results.push({ passed: true, message: "Uses proper TypeScript types", severity: "success" });
  } else {
    results.push({ passed: true, message: "Consider importing PractaContext and PractaOutput types", severity: "warning" });
  }

  return results;
}

function main() {
  console.log("\n\x1b[1m📋 Practa Validator\x1b[0m\n");

  const allResults: ValidationResult[] = [];

  // Step 1: File exists
  console.log("\x1b[1mFile Structure\x1b[0m");
  const fileResult = validateFileExists();
  log(fileResult);
  allResults.push(fileResult);

  if (!fileResult.passed) {
    console.log("\n\x1b[31m✗ Validation failed: Practa file not found\x1b[0m\n");
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
  const metadataResults = validateMetadataContent(source);
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
