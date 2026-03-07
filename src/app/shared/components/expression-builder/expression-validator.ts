export interface ValidationResult {
  readonly valid: boolean;
  readonly error: string | null;
}

export function validateExpression(
  expression: string,
  variables: string[],
  operators: string[],
): ValidationResult {
  // 1. Empty/whitespace-only
  if (!expression.trim()) {
    return { valid: false, error: 'Expression is required' };
  }

  // 2. Find first known operator in the expression
  const foundOperator = operators.find((op) => expression.includes(op));
  if (!foundOperator) {
    return { valid: false, error: 'Missing operator' };
  }

  // 3. Split on the first found operator
  const opIndex = expression.indexOf(foundOperator);
  const left = expression.slice(0, opIndex).trim();
  const right = expression.slice(opIndex + foundOperator.length).trim();

  // 4. Left must be a known variable
  if (!variables.includes(left)) {
    return { valid: false, error: `Unknown variable: ${left}` };
  }

  // 5. Right must not be empty
  if (!right) {
    return { valid: false, error: 'Invalid value: ' };
  }

  // 6. Right must be: known variable, number, boolean, or single-quoted string (no whitespace)
  const isVariable = variables.includes(right);
  const isNumber = /^-?\d+(\.\d+)?$/.test(right);
  const isBoolean = right === 'true' || right === 'false';
  const isQuotedString = /^'[^\s']*'$/.test(right);

  if (!isVariable && !isNumber && !isBoolean && !isQuotedString) {
    return { valid: false, error: `Invalid value: ${right}` };
  }

  // 7. Valid
  return { valid: true, error: null };
}
