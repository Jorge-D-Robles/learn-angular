import type { ChapterId } from './curriculum.types';

/** A narrative-only step that advances the station story. */
export interface NarrativeStep {
  readonly stepType: 'narrative';
  readonly narrativeText: string;
}

/** A single code block within a code-example step. */
export interface CodeBlock {
  readonly label?: string;
  readonly code: string;
  readonly language: string;
  readonly highlightLines?: readonly number[];
}

/** A step with a read-only code example and explanation. */
export interface CodeExampleStep {
  readonly stepType: 'code-example';
  readonly narrativeText: string;
  readonly code: string;
  readonly language: string;
  readonly highlightLines?: readonly number[];
  readonly explanation: string;
  readonly codeBlocks?: readonly CodeBlock[];
}

/** A concept explanation panel with title, body, and optional key points. */
export interface ConceptStep {
  readonly stepType: 'concept';
  readonly narrativeText: string;
  readonly conceptTitle: string;
  readonly conceptBody: string;
  readonly keyPoints?: readonly string[];
}

/** Base properties shared by all validation rules. */
interface ValidationRuleBase {
  readonly errorMessage: string;
}

/** Check that code contains a substring. */
export interface ContainsRule extends ValidationRuleBase {
  readonly type: 'contains';
  readonly value: string;
  readonly caseSensitive?: boolean; // defaults to true
}

/** Check that code matches a regex pattern. */
export interface PatternRule extends ValidationRuleBase {
  readonly type: 'pattern';
  readonly pattern: string;
  readonly flags?: string;
}

/** Check that code does NOT contain a substring (anti-pattern). */
export interface NotContainsRule extends ValidationRuleBase {
  readonly type: 'notContains';
  readonly value: string;
  readonly caseSensitive?: boolean; // defaults to true
}

/**
 * Check that code has a line count within bounds.
 * Counts ALL lines including blank lines (visual line count matches).
 * If both min and max are omitted, the rule is a no-op (always passes).
 */
export interface LineCountRule extends ValidationRuleBase {
  readonly type: 'lineCount';
  readonly min?: number;
  readonly max?: number;
}

/** Check that patterns appear in the given order in the code. */
export interface OrderRule extends ValidationRuleBase {
  readonly type: 'order';
  readonly patterns: readonly string[];
}

/** Discriminated union of all validation rule types. */
export type ValidationRule =
  | ContainsRule
  | PatternRule
  | NotContainsRule
  | LineCountRule
  | OrderRule;

/** Result of validating learner code against a set of rules. */
export interface CodeChallengeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly passedRules: number;
  readonly totalRules: number;
}

/** An interactive code-writing challenge step. */
export interface CodeChallengeStep {
  readonly stepType: 'code-challenge';
  readonly prompt: string;
  readonly starterCode: string;
  readonly language: 'typescript' | 'html';
  readonly validationRules: readonly ValidationRule[];
  readonly hints?: readonly string[];
  readonly successMessage: string;
  readonly explanation: string;
}

/** Discriminated union of all mission step types. */
export type MissionStep = NarrativeStep | CodeExampleStep | ConceptStep | CodeChallengeStep;

/** Criteria for completing a story mission. */
export interface CompletionCriteria {
  readonly description: string;
  readonly minStepsViewed: number;
}

/** Full narrative content for a single story mission. */
export interface StoryMissionContent {
  readonly chapterId: ChapterId;
  readonly steps: readonly MissionStep[];
  readonly completionCriteria: CompletionCriteria;
}
