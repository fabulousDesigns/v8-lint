import * as ts from "typescript";

/**
 * Severity levels for V8 performance issues
 */
export type RuleSeverity = "error" | "warning" | "info" | "off";

/**
 * Categories of V8 performance issues for grouping and filtering
 */
export type RuleCategory =
  | "object-optimization" // Object shapes, properties
  | "array-optimization" // Array elements, holes, types
  | "function-optimization" // Function calls, arguments
  | "type-optimization" // Type representation, transitions
  | "memory-optimization" // Memory usage, GC pressure
  | "regexp-optimization"; // RegExp performance

/**
 * A V8 performance issue found by a rule
 */
export interface V8LintIssue {
  // Rule identification
  ruleId: string; // e.g., "no-dynamic-object-properties"
  category: RuleCategory; // For grouping in UI
  severity: RuleSeverity; // How serious is this issue

  // Issue description
  message: string; // Human-readable problem description
  description: string; // Detailed explanation of the issue

  // Location in source code
  line: number; // 1-based line number
  column: number; // 1-based column number
  endLine: number; // End position for multi-line issues
  endColumn: number; // End position

  // Source code context
  source: string; // The problematic code snippet
  fileName: string; // File where issue was found

  // Help and documentation
  documentation: string; // URL to detailed explanation
  tags: string[]; // Tags like ["v8", "performance", "object"]

  // Fix suggestions
  suggestedFix?: string; // How to fix the issue
  quickFixAvailable?: boolean; // Can we auto-fix this?

  // Performance impact
  impactLevel: "low" | "medium" | "high"; // Performance impact estimate
}

/**
 * Context passed to rules during analysis
 */
export interface RuleContext {
  sourceFile: ts.SourceFile; // The AST being analyzed
  fileName: string; // File being analyzed
  sourceCode: string; // Original source code
  configuration: RuleConfiguration; // Rule-specific config

  // Utility methods for rules
  getSourceText(node: ts.Node): string; // Get text for a node
  getLineAndCharacter(pos: number): ts.LineAndCharacter; // Position helpers
  createIssue(issue: Partial<V8LintIssue>): V8LintIssue; // Issue builder
}

/**
 * Configuration for individual rules
 */
export interface RuleConfiguration {
  enabled: boolean; // Is this rule active?
  severity: RuleSeverity; // Override default severity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Record<string, any>; // Rule-specific options
}

/**
 * Metadata about a rule (loaded from JSON)
 */
export interface RuleMetadata {
  id: string; // Unique rule identifier
  name: string; // Display name
  description: string; // Short description
  category: RuleCategory; // What type of optimization
  defaultSeverity: RuleSeverity; // Default severity level

  // Documentation
  documentation: string; // URL to detailed docs
  examples: {
    bad: string[]; // Examples of problematic code
    good: string[]; // Examples of optimized code
  };

  // Rule behavior
  fixable: boolean; // Can this rule auto-fix issues?
  requiresTypeInfo: boolean; // Does this rule need TypeScript type information?

  // Performance data
  impactDescription: string; // What's the performance impact?
  v8Behavior: string; // How does V8 handle this pattern?

  // Tagging and filtering
  tags: string[]; // For searching and filtering
  since: string; // Version when rule was added
}

/**
 * The main interface every V8 performance rule must implement
 */
export interface V8LintRule {
  // Rule metadata
  readonly metadata: RuleMetadata;

  // Configuration
  configure(config: RuleConfiguration): void;

  // Main analysis method - this is where the magic happens!
  analyze(context: RuleContext): V8LintIssue[];

  // Optional: provide quick fixes
  getQuickFix?(issue: V8LintIssue): string | null;

  // Optional: additional validation
  validate?(node: ts.Node): boolean;
}

/**
 * Configuration for the entire rule system
 */
export interface RuleSystemConfiguration {
  enabled: boolean; // Global enable/disable
  rules: Record<string, RuleConfiguration>; // Per-rule configuration
  excludePatterns: string[]; // Files to skip
  includeCategories: RuleCategory[]; // Only run certain categories
  maxIssuesPerFile: number; // Limit issues to prevent spam
}

/**
 * Statistics about rule execution (for performance monitoring)
 */
export interface RuleExecutionStats {
  ruleId: string;
  executionTimeMs: number; // How long did this rule take?
  nodesVisited: number; // How many AST nodes were checked?
  issuesFound: number; // How many issues were found?
  filesAnalyzed: number; // How many files were processed?
}
