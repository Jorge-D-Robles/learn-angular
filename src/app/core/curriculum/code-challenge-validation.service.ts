import { Injectable } from '@angular/core';
import type {
  ContainsRule,
  PatternRule,
  NotContainsRule,
  LineCountRule,
  OrderRule,
  ValidationRule,
  CodeChallengeValidationResult,
} from './story-mission-content.types';

/**
 * Stateless service that validates learner-submitted code against
 * structural rules. Does not execute or parse code — only performs
 * string-level pattern matching.
 */
@Injectable({ providedIn: 'root' })
export class CodeChallengeValidationService {
  /**
   * Validates code against all rules. Collects every error (no short-circuit).
   */
  validateCode(
    code: string,
    rules: readonly ValidationRule[],
  ): CodeChallengeValidationResult {
    const errors: string[] = [];

    for (const rule of rules) {
      const error = this.checkRule(code, rule);
      if (error !== null) {
        errors.push(error);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      passedRules: rules.length - errors.length,
      totalRules: rules.length,
    };
  }

  private checkRule(code: string, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'contains':
        return this.checkContains(code, rule);
      case 'pattern':
        return this.checkPattern(code, rule);
      case 'notContains':
        return this.checkNotContains(code, rule);
      case 'lineCount':
        return this.checkLineCount(code, rule);
      case 'order':
        return this.checkOrder(code, rule);
    }
  }

  private checkContains(code: string, rule: ContainsRule): string | null {
    const caseSensitive = rule.caseSensitive !== false;
    const haystack = caseSensitive ? code : code.toLowerCase();
    const needle = caseSensitive ? rule.value : rule.value.toLowerCase();
    return haystack.includes(needle) ? null : rule.errorMessage;
  }

  private checkPattern(code: string, rule: PatternRule): string | null {
    try {
      const regex = new RegExp(rule.pattern, rule.flags);
      return regex.test(code) ? null : rule.errorMessage;
    } catch {
      return `Invalid regex "${rule.pattern}": ${rule.errorMessage}`;
    }
  }

  private checkNotContains(code: string, rule: NotContainsRule): string | null {
    const caseSensitive = rule.caseSensitive !== false;
    const haystack = caseSensitive ? code : code.toLowerCase();
    const needle = caseSensitive ? rule.value : rule.value.toLowerCase();
    return haystack.includes(needle) ? rule.errorMessage : null;
  }

  private checkLineCount(code: string, rule: LineCountRule): string | null {
    if (rule.min === undefined && rule.max === undefined) {
      return null; // no-op
    }
    const lineCount = code.split('\n').length;
    if (rule.min !== undefined && lineCount < rule.min) {
      return rule.errorMessage;
    }
    if (rule.max !== undefined && lineCount > rule.max) {
      return rule.errorMessage;
    }
    return null;
  }

  private checkOrder(code: string, rule: OrderRule): string | null {
    let cursor = 0;
    for (const pattern of rule.patterns) {
      const idx = code.indexOf(pattern, cursor);
      if (idx === -1) {
        return rule.errorMessage;
      }
      cursor = idx + pattern.length;
    }
    return null;
  }
}
