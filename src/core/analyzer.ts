/**
 * V8LintAnalyzer - The brain of our V8 performance linting tool
 *
 * This class is responsible for:
 * 1. Taking JavaScript/TypeScript source code
 * 2. Parsing it into an Abstract Syntax Tree (AST)
 * 3. Running our performance rules against the AST
 * 4. Returning structured issue data with severity levels
 */

import * as ts from "typescript";

export interface V8LintIssue {
  ruleId: string; // Which rule caught this issue (e.g., "no-dynamic-object-properties")
  severity: "error" | "warning" | "info"; // How serious is this issue
  message: string; // Human-readable description
  line: number; // Line number where issue occurs
  column: number; // Column number for precise location
  endLine: number; // End line (for multi-line issues)
  endColumn: number; // End column
  source: string; // The actual problematic code snippet
  documentation: string; // Link to docs explaining the issue
  suggestedFix?: string; // Optional: how to fix it
}

export interface AnalyzerConfig {
  enabled: boolean; // Is the analyzer active?
  rules: Record<string, string>; // Rule ID -> severity mapping
  defaultSeverity: "error" | "warning" | "info"; // Fallback severity
  excludePatterns: string[]; // File patterns to skip
}

/**
 * The main analyzer class - this is where all the magic happens
 */
export class V8LintAnalyzer {
  private config: AnalyzerConfig;

  constructor(ruleRegistry: any) {
    // We'll define RuleRegistry later
    // Set default configuration
    this.config = {
      enabled: true,
      rules: {},
      defaultSeverity: "warning",
      excludePatterns: [],
    };

    console.log("🧠 V8LintAnalyzer initialized");
  }

  /**
   * Update analyzer configuration (called when user changes settings)
   */
  updateConfiguration(newConfig: Partial<AnalyzerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("⚙️ Analyzer configuration updated:", this.config);
  }

  /**
   * The main analysis method - this is what gets called for each file
   *
   * @param sourceCode - The JavaScript/TypeScript code to analyze
   * @param fileName - The file name (for context and exclude patterns)
   * @returns Array of issues found in the code
   */
  async analyze(sourceCode: string, fileName: string): Promise<V8LintIssue[]> {
    // Quick early returns for efficiency
    if (!this.config.enabled) {
      return [];
    }

    if (this.shouldSkipFile(fileName)) {
      return [];
    }

    if (!sourceCode.trim()) {
      return []; // Skip empty files
    }

    console.log(`🔍 Analyzing file: ${fileName}`);

    try {
      // Step 1: Parse the source code into an Abstract Syntax Tree (AST)
      const sourceFile = this.parseSourceCode(sourceCode, fileName);

      if (!sourceFile) {
        console.warn(`⚠️ Failed to parse ${fileName} - skipping analysis`);
        return [];
      }

      console.log(`✅ Successfully parsed AST for ${fileName}`);

      // Step 2: TODO - Run our V8 performance rules against the AST
      // Step 3: TODO - Collect and return issues

      // For now, return empty array (no issues found)
      return [];
    } catch (error) {
      console.error(`❌ Error analyzing ${fileName}:`, error);
      return []; // Don't crash on parse errors
    }
  }

  /**
   * Parse JavaScript/TypeScript source code into an AST using TypeScript compiler
   *
   * Why TypeScript compiler?
   * - Handles both JS and TS files
   * - Very robust and battle-tested
   * - Same parser that VSCode uses
   * - Excellent error recovery (doesn't crash on syntax errors)
   */
  private parseSourceCode(
    sourceCode: string,
    fileName: string
  ): ts.SourceFile | null {
    try {
      // Determine the script kind based on file extension
      const scriptKind = this.getScriptKind(fileName);

      // Create TypeScript source file (this is the AST!)
      const sourceFile = ts.createSourceFile(
        fileName, // File name for error reporting
        sourceCode, // The actual source code
        ts.ScriptTarget.Latest, // Use latest JavaScript features
        true, // setParentNodes - lets us navigate up the tree
        scriptKind // JS, JSX, TS, or TSX
      );

      // Quick validation - make sure we got a valid AST
      if (!sourceFile || sourceFile.parseDiagnostics?.length > 0) {
        console.warn(
          `⚠️ Parse diagnostics for ${fileName}:`,
          sourceFile?.parseDiagnostics
        );
        // Note: We still return the sourceFile even with diagnostics
        // TypeScript parser is very good at recovering from syntax errors
      }

      return sourceFile;
    } catch (error) {
      console.error(`❌ Failed to parse ${fileName}:`, error);
      return null;
    }
  }

  /**
   * Determine the script kind (JS, JSX, TS, TSX) from file extension
   * This helps the TypeScript parser understand what syntax to expect
   */
  private getScriptKind(fileName: string): ts.ScriptKind {
    const extension = fileName.toLowerCase().split(".").pop();

    switch (extension) {
      case "ts":
        return ts.ScriptKind.TS;
      case "tsx":
        return ts.ScriptKind.TSX;
      case "jsx":
        return ts.ScriptKind.JSX;
      case "js":
      default:
        return ts.ScriptKind.JS;
    }
  }

  /**
   * Check if we should skip analyzing this file based on exclude patterns
   */
  private shouldSkipFile(fileName: string): boolean {
    return this.config.excludePatterns.some((pattern) => {
      // Simple pattern matching for now (we can make this more sophisticated later)
      return fileName.includes(pattern.replace("**/", "").replace("/**", ""));
    });
  }
}
