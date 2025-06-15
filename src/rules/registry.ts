import {
  V8LintRule,
  RuleMetadata,
  RuleConfiguration,
  RuleSystemConfiguration,
  RuleCategory,
} from "./types";

// Import metadata from JSON file
import * as ruleMetadataJson from "./metadata.json";

// Import all rule implementations (we'll create these next)
import { NoDynamicObjectPropertiesRule } from "./no-dynamic-object-properties";
import { NoArrayConstructorHolesRule } from "./no-array-constructor-holes";
import { NoPropertyDeletionRule } from "./no-property-deletion";
import { NoArgumentsObjectRule } from "./no-arguments-object";
import { NoArrayTypeMixingRule } from "./no-array-type-mixing";
import { PreferPackedArraysRule } from "./prefer-packed-arrays";
import { NoRegexpModificationRule } from "./no-regexp-modification";
import { NoSmiDoubleFieldTransitionRule } from "./no-smi-double-field-transition";

/**
 * Central registry for all V8 lint rules
 *
 * Responsibilities:
 * 1. Register and manage all available rules
 * 2. Load rule metadata from JSON
 * 3. Configure rules based on user settings
 * 4. Provide filtered rule sets for analysis
 * 5. Validate rule configurations
 */
export class RuleRegistry {
  private rules: Map<string, V8LintRule> = new Map();
  private metadata: Map<string, RuleMetadata> = new Map();
  private configuration: RuleSystemConfiguration;

  constructor() {
    // Initialize with default configuration
    this.configuration = {
      enabled: true,
      rules: {},
      excludePatterns: ["**/node_modules/**", "**/dist/**", "**/build/**"],
      includeCategories: [
        "object-optimization",
        "array-optimization",
        "function-optimization",
        "type-optimization",
        "regexp-optimization",
      ],
      maxIssuesPerFile: 100,
    };

    // Load all rules and their metadata
    this.loadRulesAndMetadata();

    console.log(`📋 Rule Registry initialized with ${this.rules.size} rules`);
  }

  /**
   * Load all rules and their metadata from JSON configuration
   */
  private loadRulesAndMetadata(): void {
    try {
      // Load metadata from JSON
      const metadataEntries = Object.entries(ruleMetadataJson.rules);

      for (const [ruleId, metadata] of metadataEntries) {
        this.metadata.set(ruleId, metadata as RuleMetadata);
      }

      // Create and register rule instances
      this.registerRule(
        new NoDynamicObjectPropertiesRule(
          this.getMetadata("no-dynamic-object-properties")
        )
      );
      this.registerRule(
        new NoArrayConstructorHolesRule(
          this.getMetadata("no-array-constructor-holes")
        )
      );
      this.registerRule(
        new NoPropertyDeletionRule(this.getMetadata("no-property-deletion"))
      );
      this.registerRule(
        new NoArgumentsObjectRule(this.getMetadata("no-arguments-object"))
      );
      this.registerRule(
        new NoArrayTypeMixingRule(this.getMetadata("no-array-type-mixing"))
      );
      this.registerRule(
        new PreferPackedArraysRule(this.getMetadata("prefer-packed-arrays"))
      );
      this.registerRule(
        new NoRegexpModificationRule(this.getMetadata("no-regexp-modification"))
      );
      this.registerRule(
        new NoSmiDoubleFieldTransitionRule(
          this.getMetadata("no-smi-double-field-transition")
        )
      );

      console.log("✅ All V8 lint rules loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load rules and metadata:", error);
      throw new Error("Failed to initialize rule registry");
    }
  }

  /**
   * Register a single rule with the registry
   */
  private registerRule(rule: V8LintRule): void {
    const ruleId = rule.metadata.id;

    if (this.rules.has(ruleId)) {
      throw new Error(`Rule ${ruleId} is already registered`);
    }

    this.rules.set(ruleId, rule);
    console.log(`📝 Registered rule: ${ruleId}`);
  }

  /**
   * Get metadata for a specific rule
   */
  private getMetadata(ruleId: string): RuleMetadata {
    const metadata = this.metadata.get(ruleId);
    if (!metadata) {
      throw new Error(`Metadata not found for rule: ${ruleId}`);
    }
    return metadata;
  }

  /**
   * Update the registry configuration (called when user changes settings)
   */
  updateConfiguration(config: Partial<RuleSystemConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };

    // Apply configuration to individual rules
    this.applyConfigurationToRules();

    console.log("⚙️ Rule registry configuration updated");
  }

  /**
   * Apply current configuration to all registered rules
   */
  private applyConfigurationToRules(): void {
    for (const [ruleId, rule] of this.rules) {
      const ruleConfig = this.getRuleConfiguration(ruleId);
      rule.configure(ruleConfig);
    }
  }

  /**
   * Get configuration for a specific rule
   */
  private getRuleConfiguration(ruleId: string): RuleConfiguration {
    const userConfig = this.configuration.rules[ruleId];
    const metadata = this.metadata.get(ruleId);

    if (!metadata) {
      throw new Error(`No metadata found for rule: ${ruleId}`);
    }

    // Merge default metadata with user configuration
    return {
      enabled: userConfig?.enabled ?? true,
      severity: userConfig?.severity ?? metadata.defaultSeverity,
      options: userConfig?.options ?? {},
    };
  }

  /**
   * Get all rules that should be executed for analysis
   */
  getActiveRules(): V8LintRule[] {
    if (!this.configuration.enabled) {
      return [];
    }

    const activeRules: V8LintRule[] = [];

    for (const [ruleId, rule] of this.rules) {
      const ruleConfig = this.getRuleConfiguration(ruleId);

      // Check if rule is enabled
      if (!ruleConfig.enabled || ruleConfig.severity === "off") {
        continue;
      }

      // Check if rule's category is included
      if (
        !this.configuration.includeCategories.includes(rule.metadata.category)
      ) {
        continue;
      }

      activeRules.push(rule);
    }

    return activeRules;
  }

  /**
   * Get rules filtered by category
   */
  getRulesByCategory(category: RuleCategory): V8LintRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.metadata.category === category
    );
  }

  /**
   * Get a specific rule by ID
   */
  getRule(ruleId: string): V8LintRule | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get all available rule IDs
   */
  getRuleIds(): string[] {
    return Array.from(this.rules.keys());
  }

  /**
   * Get metadata for all rules (for documentation, UI, etc.)
   */
  getAllMetadata(): RuleMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Get metadata for a specific rule
   */
  getRuleMetadata(ruleId: string): RuleMetadata | null {
    return this.metadata.get(ruleId) || null;
  }

  /**
   * Validate that a rule configuration is valid
   */
  validateRuleConfiguration(
    ruleId: string,
    config: RuleConfiguration
  ): string[] {
    const errors: string[] = [];

    // Check if rule exists
    if (!this.rules.has(ruleId)) {
      errors.push(`Unknown rule: ${ruleId}`);
      return errors;
    }

    // Validate severity
    const validSeverities = ["error", "warning", "info", "off"];
    if (!validSeverities.includes(config.severity)) {
      errors.push(`Invalid severity '${config.severity}' for rule ${ruleId}`);
    }

    // Additional rule-specific validation can be added here

    return errors;
  }

  /**
   * Get statistics about the rule registry
   */
  getStatistics(): {
    totalRules: number;
    activeRules: number;
    rulesByCategory: Record<RuleCategory, number>;
    enabledCategories: RuleCategory[];
  } {
    const activeRules = this.getActiveRules();
    const rulesByCategory: Record<RuleCategory, number> = {
      "object-optimization": 0,
      "array-optimization": 0,
      "function-optimization": 0,
      "type-optimization": 0,
      "memory-optimization": 0,
      "regexp-optimization": 0,
    };

    // Count rules by category
    for (const rule of this.rules.values()) {
      rulesByCategory[rule.metadata.category]++;
    }

    return {
      totalRules: this.rules.size,
      activeRules: activeRules.length,
      rulesByCategory,
      enabledCategories: this.configuration.includeCategories,
    };
  }
}
