/**
 * Practa Validator
 * 
 * Validates that a Practa component meets all requirements for submission.
 * Run-time validation that can be displayed in the PreviewScreen.
 * 
 * Note: Asset validation (file sizes, formats) is done server-side via
 * the /api/practa/validate-assets endpoint since client-side code cannot
 * access the file system.
 * 
 * Asset Rules (enforced by server):
 * - Per-file limit: 5MB maximum per asset
 * - Total package limit: 25MB maximum for entire Practa
 * - Supported formats: Images (png, jpg, jpeg, gif, webp, svg), 
 *   Audio (mp3, wav, m4a, ogg), Video (mp4, webm), Data (json, txt)
 */

export interface ValidationResult {
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "success";
}

export interface ValidationReport {
  isValid: boolean;
  results: ValidationResult[];
  errors: ValidationResult[];
  warnings: ValidationResult[];
  successes: ValidationResult[];
}

/**
 * Validates metadata object against required schema
 */
export function validateMetadata(metadata: unknown): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check if metadata exists
  if (!metadata || typeof metadata !== "object") {
    results.push({
      passed: false,
      message: "Metadata export is missing or not an object",
      severity: "error",
    });
    return results;
  }

  const meta = metadata as Record<string, unknown>;

  // Required fields
  const requiredFields = [
    { field: "type", label: "Type identifier" },
    { field: "name", label: "Display name" },
    { field: "description", label: "Description" },
    { field: "author", label: "Author name" },
    { field: "version", label: "Version" },
  ];

  for (const { field, label } of requiredFields) {
    if (!meta[field]) {
      results.push({
        passed: false,
        message: `Missing required field: ${label} (${field})`,
        severity: "error",
      });
    } else if (typeof meta[field] !== "string") {
      results.push({
        passed: false,
        message: `${label} must be a string`,
        severity: "error",
      });
    } else if ((meta[field] as string).trim() === "") {
      results.push({
        passed: false,
        message: `${label} cannot be empty`,
        severity: "error",
      });
    } else {
      results.push({
        passed: true,
        message: `${label} is valid`,
        severity: "success",
      });
    }
  }

  // Validate type format (lowercase, hyphens, numbers only)
  if (typeof meta.type === "string" && meta.type.trim() !== "") {
    const typePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!typePattern.test(meta.type)) {
      results.push({
        passed: false,
        message: "Type must be lowercase with hyphens (e.g., 'my-practa')",
        severity: "error",
      });
    }
  }

  // Validate version format (semver-like)
  if (typeof meta.version === "string" && meta.version.trim() !== "") {
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(meta.version)) {
      results.push({
        passed: false,
        message: "Version must follow format X.Y.Z (e.g., '1.0.0')",
        severity: "error",
      });
    }
  }

  // Optional field warnings
  if (!meta.estimatedDuration) {
    results.push({
      passed: true,
      message: "Consider adding estimatedDuration (in seconds)",
      severity: "warning",
    });
  } else {
    results.push({
      passed: true,
      message: "Estimated duration provided",
      severity: "success",
    });
  }

  return results;
}

/**
 * Validates that the component is a valid function
 */
export function validateComponent(component: unknown): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!component) {
    results.push({
      passed: false,
      message: "Default export (component) is missing",
      severity: "error",
    });
    return results;
  }

  if (typeof component !== "function") {
    results.push({
      passed: false,
      message: "Default export must be a function component",
      severity: "error",
    });
    return results;
  }

  results.push({
    passed: true,
    message: "Component is a valid function",
    severity: "success",
  });

  // Check that component accepts props (function.length >= 1)
  const fn = component as Function;
  if (fn.length === 0) {
    results.push({
      passed: true,
      message: "Component may not accept props (0 parameters). Ensure it accepts { context, onComplete }",
      severity: "warning",
    });
  } else {
    results.push({
      passed: true,
      message: `Component accepts ${fn.length} parameter(s)`,
      severity: "success",
    });
  }

  // Note: Full contract validation (onComplete calls, context usage) requires 
  // source code analysis which is done by the CLI validator (npx tsx validate-practa.ts)
  results.push({
    passed: true,
    message: "Run CLI validator for full contract check: npx tsx validate-practa.ts",
    severity: "warning",
  });

  return results;
}

/**
 * Validates Practa source code for best practices
 * Note: This is a static analysis based on the source string
 */
export function validateSourceCode(source: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check for onComplete usage
  if (!source.includes("onComplete")) {
    results.push({
      passed: false,
      message: "Component must call onComplete when finished",
      severity: "error",
    });
  } else {
    results.push({
      passed: true,
      message: "Component calls onComplete",
      severity: "success",
    });
  }

  // Check for context prop usage
  if (!source.includes("context")) {
    results.push({
      passed: true,
      message: "Component doesn't use context (may be intentional)",
      severity: "warning",
    });
  } else {
    results.push({
      passed: true,
      message: "Component accepts context prop",
      severity: "success",
    });
  }

  // Check for useTheme usage
  if (!source.includes("useTheme")) {
    results.push({
      passed: true,
      message: "Consider using useTheme() for theme-aware colors",
      severity: "warning",
    });
  } else {
    results.push({
      passed: true,
      message: "Uses theme system",
      severity: "success",
    });
  }

  // Check for haptics usage
  if (!source.includes("Haptics")) {
    results.push({
      passed: true,
      message: "Consider adding haptic feedback for better UX",
      severity: "warning",
    });
  } else {
    results.push({
      passed: true,
      message: "Uses haptic feedback",
      severity: "success",
    });
  }

  // Check for skip support
  if (!source.includes("onSkip")) {
    results.push({
      passed: true,
      message: "Consider supporting onSkip for user flexibility",
      severity: "warning",
    });
  } else {
    results.push({
      passed: true,
      message: "Supports skip option",
      severity: "success",
    });
  }

  // Check for safe area usage
  if (!source.includes("useSafeAreaInsets") && !source.includes("SafeAreaView")) {
    results.push({
      passed: true,
      message: "Consider using safe area insets for proper layout",
      severity: "warning",
    });
  } else {
    results.push({
      passed: true,
      message: "Uses safe area handling",
      severity: "success",
    });
  }

  return results;
}

/**
 * Run full validation and return a report
 * 
 * Note: Runtime validation can only check component existence and metadata.
 * For full contract validation (onComplete calls, context usage, best practices),
 * use the CLI validator: npx tsx validate-practa.ts
 */
export function validatePracta(
  component: unknown,
  metadata: unknown,
  source?: string
): ValidationReport {
  const allResults: ValidationResult[] = [
    ...validateComponent(component),
    ...validateMetadata(metadata),
    ...(source ? validateSourceCode(source) : []),
  ];

  const errors = allResults.filter((r) => r.severity === "error" && !r.passed);
  const warnings = allResults.filter((r) => r.severity === "warning");
  const successes = allResults.filter((r) => r.severity === "success" && r.passed);

  return {
    isValid: errors.length === 0,
    results: allResults,
    errors,
    warnings,
    successes,
  };
}

/**
 * Quick check if Practa is valid (no errors)
 */
export function isPractaValid(component: unknown, metadata: unknown): boolean {
  const report = validatePracta(component, metadata);
  return report.isValid;
}
