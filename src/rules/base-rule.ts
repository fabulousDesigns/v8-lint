import * as ts from "typescript";
import {
  V8LintRule,
  V8LintIssue,
  RuleContext,
  RuleConfiguration,
  RuleMetadata,
} from "./types";

/**
 * Base class that provides common functionality for all V8 lint rules
 *
 * Benefits of using a base class:
 * 1. Common utility methods (position calculation, text extraction)
 * 2. Consistent issue creation
 * 3. Standard configuration handling
 * 4. Performance measurement
 * 5. Error handling
 */
export abstract class BaseRule implements V8LintRule {
  public readonly metadata: RuleMetadata;
  protected configuration: RuleConfiguration;

  constructor(metadata: RuleMetadata) {
    this.metadata = metadata;

    // Default configuration
    this.configuration = {
      enabled: true,
      severity: metadata.defaultSeverity,
      options: {},
    };
  }

  /**
   * Configure this rule with user settings
   */
  configure(config: RuleConfiguration): void {
    this.configuration = { ...this.configuration, ...config };
  }

  /**
   * Main analysis method - must be implemented by each rule
   */
  abstract analyze(context: RuleContext): V8LintIssue[];

  /**
   * Optional: Provide quick fix for issues (override in specific rules)
   */
  getQuickFix?(issue: V8LintIssue): string | null;

  /**
   * Create a properly formatted V8LintIssue
   */
  protected createIssue(
    node: ts.Node,
    context: RuleContext,
    message: string,
    options: Partial<V8LintIssue> = {}
  ): V8LintIssue {
    const start = context.sourceFile.getLineAndCharacterOfPosition(
      node.getStart()
    );
    const end = context.sourceFile.getLineAndCharacterOfPosition(node.getEnd());

    return {
      // Rule identification
      ruleId: this.metadata.id,
      category: this.metadata.category,
      severity: this.configuration.severity,

      // Message and description
      message,
      description: options.description || this.metadata.description,

      // Position information (1-based for VSCode)
      line: start.line + 1,
      column: start.character + 1,
      endLine: end.line + 1,
      endColumn: end.character + 1,

      // Source context
      source: node.getText(context.sourceFile),
      fileName: context.fileName,

      // Documentation and help
      documentation: this.metadata.documentation,
      tags: this.metadata.tags,
      suggestedFix: options.suggestedFix,
      quickFixAvailable: this.metadata.fixable,

      // Performance impact
      impactLevel: options.impactLevel || "medium",

      // Override any provided options
      ...options,
    };
  }

  /**
   * Helper: Check if a node is of a specific syntax kind
   */
  protected isNodeOfKind<T extends ts.Node>(
    node: ts.Node,
    kind: ts.SyntaxKind
  ): node is T {
    return node.kind === kind;
  }

  /**
   * Helper: Check if a node is an identifier with a specific name
   */
  protected isIdentifierWithName(node: ts.Node, name: string): boolean {
    return ts.isIdentifier(node) && node.text === name;
  }

  /**
   * Helper: Get the text content of a node
   */
  protected getNodeText(node: ts.Node, sourceFile: ts.SourceFile): string {
    return node.getText(sourceFile);
  }

  /**
   * Helper: Check if a node is inside a specific parent type
   */
  protected isInsideNodeOfKind(node: ts.Node, kind: ts.SyntaxKind): boolean {
    let parent = node.parent;
    while (parent) {
      if (parent.kind === kind) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  /**
   * Helper: Find parent node of specific type
   */
  protected findParentOfKind<T extends ts.Node>(
    node: ts.Node,
    kind: ts.SyntaxKind
  ): T | null {
    let parent = node.parent;
    while (parent) {
      if (parent.kind === kind) {
        return parent as T;
      }
      parent = parent.parent;
    }
    return null;
  }

  /**
   * Helper: Check if this rule is enabled
   */
  protected isEnabled(): boolean {
    return this.configuration.enabled && this.configuration.severity !== "off";
  }

  /**
   * Helper: Visit all child nodes of a given node
   * Useful for rules that need to analyze nested structures
   */
  protected visitChildren<T>(
    node: ts.Node,
    visitor: (child: ts.Node) => T | undefined
  ): T[] {
    const results: T[] = [];

    ts.forEachChild(node, (child) => {
      const result = visitor(child);
      if (result !== undefined) {
        results.push(result);
      }

      // Recursively visit children
      const childResults = this.visitChildren(child, visitor);
      results.push(...childResults);
    });

    return results;
  }

  /**
   * Helper: Check if a string matches any of the provided patterns
   */
  protected matchesAnyPattern(text: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      // Simple glob pattern matching (can be enhanced later)
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(text);
    });
  }

  /**
   * Performance measurement wrapper
   */
  protected measurePerformance<T>(operation: () => T): {
    result: T;
    timeMs: number;
  } {
    const start = process.hrtime.bigint();
    const result = operation();
    const end = process.hrtime.bigint();
    const timeMs = Number(end - start) / 1_000_000; // Convert to milliseconds

    return { result, timeMs };
  }
}
