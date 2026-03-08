import type { CargoItem } from './pipeline.types';

// ---------------------------------------------------------------------------
// Condition evaluator (pure functions)
// ---------------------------------------------------------------------------

/**
 * Safely evaluates a condition expression against a CargoItem.
 * Supports: item.prop === 'value', item.prop !== 'value', &&, ||
 * Returns false for invalid or empty conditions.
 */
export function evaluateCondition(condition: string, item: CargoItem): boolean {
  const trimmed = condition.trim();
  if (!trimmed) return false;

  // Handle compound OR (split first for lower precedence)
  if (trimmed.includes('||')) {
    return trimmed.split('||').some(part => evaluateCondition(part.trim(), item));
  }

  // Handle compound AND
  if (trimmed.includes('&&')) {
    return trimmed.split('&&').every(part => evaluateCondition(part.trim(), item));
  }

  // Handle inequality: item.prop !== 'value' or item.prop !== "value"
  const neqMatch = trimmed.match(/^item\.(\w+)\s*!==\s*(['"])(.+?)\2$/);
  if (neqMatch) {
    const prop = neqMatch[1] as keyof CargoItem;
    const value = neqMatch[3];
    if (prop in item) {
      return item[prop] !== value;
    }
    return false;
  }

  // Handle equality: item.prop === 'value' or item.prop === "value"
  const eqMatch = trimmed.match(/^item\.(\w+)\s*===\s*(['"])(.+?)\2$/);
  if (eqMatch) {
    const prop = eqMatch[1] as keyof CargoItem;
    const value = eqMatch[3];
    if (prop in item) {
      return item[prop] === value;
    }
    return false;
  }

  return false;
}

/**
 * Extracts a numeric count from a @for condition. Returns 0 if not a valid number.
 */
export function extractForCount(condition: string): number {
  const trimmed = condition.trim();
  const n = parseInt(trimmed, 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

/**
 * Evaluates a @switch condition to get the routing value string.
 * Supports: item.prop (e.g., item.type) -- returns the property value as a string.
 */
export function evaluateSwitchExpression(condition: string, item: CargoItem): string {
  const trimmed = condition.trim();
  const propMatch = trimmed.match(/^item\.(\w+)$/);
  if (propMatch) {
    const prop = propMatch[1] as keyof CargoItem;
    if (prop in item) {
      return String(item[prop]);
    }
  }
  return '';
}
