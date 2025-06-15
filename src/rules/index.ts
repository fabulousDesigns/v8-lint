/**
 * Main export file for the V8 Lint rule system
 *
 * This file exports everything needed to use the rule system:
 * - Rule registry for managing all rules
 * - Type definitions for rule development
 * - Base rule class for creating new rules
 * - Individual rule implementations
 */

import { RuleConfiguration } from "./types";

// Core rule system
export { RuleRegistry } from "./registry";
export { BaseRule } from "./base-rule";

// Type definitions
export type {
  V8LintRule,
  V8LintIssue,
  RuleContext,
  RuleConfiguration,
  RuleMetadata,
  RuleSystemConfiguration,
  RuleExecutionStats,
  RuleSeverity,
  RuleCategory,
} from "./types";

// Individual rule implementations (we'll create these next)
export { NoDynamicObjectPropertiesRule } from "./no-dynamic-object-properties";
export { NoArrayConstructorHolesRule } from "./no-array-constructor-holes";
export { NoPropertyDeletionRule } from "./no-property-deletion";
export { NoArgumentsObjectRule } from "./no-arguments-object";
export { NoArrayTypeMixingRule } from "./no-array-type-mixing";
export { PreferPackedArraysRule } from "./prefer-packed-arrays";
export { NoRegexpModificationRule } from "./no-regexp-modification";
export { NoSmiDoubleFieldTransitionRule } from "./no-smi-double-field-transition";

// Re-export metadata for external use
export { default as ruleMetadata } from "./metadata.json";

/**
 * Helper function to create a new rule registry with default configuration
 */
export function createRuleRegistry(): RuleRegistry {
  return new RuleRegistry();
}

/**
 * List of all available rule IDs (for configuration, testing, etc.)
 */
export const AVAILABLE_RULE_IDS = [
  "no-dynamic-object-properties",
  "no-array-constructor-holes",
  "no-property-deletion",
  "no-arguments-object",
  "no-array-type-mixing",
  "prefer-packed-arrays",
  "no-regexp-modification",
  "no-smi-double-field-transition",
] as const;

/**
 * Type-safe rule ID type
 */
export type AvailableRuleId = (typeof AVAILABLE_RULE_IDS)[number];

/**
 * Default rule configuration for new projects
 */
export const DEFAULT_RULE_CONFIG: Record<string, RuleConfiguration> = {
  "no-dynamic-object-properties": {
    enabled: true,
    severity: "warning",
    options: {},
  },
  "no-array-constructor-holes": {
    enabled: true,
    severity: "warning",
    options: {},
  },
  "no-property-deletion": { enabled: true, severity: "warning", options: {} },
  "no-arguments-object": { enabled: true, severity: "warning", options: {} },
  "no-array-type-mixing": { enabled: true, severity: "warning", options: {} },
  "prefer-packed-arrays": { enabled: true, severity: "warning", options: {} },
  "no-regexp-modification": { enabled: true, severity: "info", options: {} },
  "no-smi-double-field-transition": {
    enabled: true,
    severity: "error",
    options: {},
  },
};
