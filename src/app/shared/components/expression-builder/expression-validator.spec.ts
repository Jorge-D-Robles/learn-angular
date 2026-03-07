import { validateExpression } from './expression-validator';

describe('validateExpression', () => {
  const variables = ['x', 'y', 'color', 'active'];
  const operators = ['===', '!==', '>', '<'];

  it('should return invalid for empty expression', () => {
    const result = validateExpression('', ['x'], ['===']);
    expect(result).toEqual({ valid: false, error: 'Expression is required' });
  });

  it('should return valid for a simple expression', () => {
    const result = validateExpression('x === 5', variables, operators);
    expect(result).toEqual({ valid: true, error: null });
  });

  it('should return valid for expression with string literal', () => {
    const result = validateExpression("color === 'red'", variables, operators);
    expect(result).toEqual({ valid: true, error: null });
  });

  it('should return invalid for unknown left variable', () => {
    const result = validateExpression('foo === 5', variables, operators);
    expect(result).toEqual({ valid: false, error: 'Unknown variable: foo' });
  });

  it('should return invalid for missing operator', () => {
    const result = validateExpression('x 5', ['x'], ['===']);
    expect(result).toEqual({ valid: false, error: 'Missing operator' });
  });

  it('should return invalid for invalid right operand', () => {
    const result = validateExpression('x === @invalid', variables, operators);
    expect(result).toEqual({ valid: false, error: 'Invalid value: @invalid' });
  });

  it('should return valid when right side is a known variable', () => {
    const result = validateExpression('x === y', variables, operators);
    expect(result).toEqual({ valid: true, error: null });
  });

  it('should return valid for boolean literal on right side', () => {
    const result = validateExpression('active === true', variables, operators);
    expect(result).toEqual({ valid: true, error: null });
  });
});
