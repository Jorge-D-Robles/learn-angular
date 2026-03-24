import type { CustomPipeSpec, PipeName } from './data-relay.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KM_PER_LIGHT_YEAR = 9460730472580.8;

// ---------------------------------------------------------------------------
// Digit info parser
// ---------------------------------------------------------------------------

/** Parse Angular-style digit info string: "{minInteger}.{minFraction}-{maxFraction}" */
function parseDigitInfo(digitInfo: string): { minFraction: number; maxFraction: number } {
  const parts = digitInfo.split('.');
  const fractionPart = parts[1] ?? '0-3';
  const fractionParts = fractionPart.split('-');
  const minFraction = fractionParts[0] ? parseInt(fractionParts[0], 10) : 0;
  const maxFraction = fractionParts[1] ? parseInt(fractionParts[1], 10) : minFraction;
  return { minFraction, maxFraction };
}

// ---------------------------------------------------------------------------
// Built-in pipe implementations
// ---------------------------------------------------------------------------

function applyDatePipe(input: string, params: readonly string[]): string {
  const date = new Date(input);
  if (isNaN(date.getTime())) return input;

  const format = params[0] ?? 'mediumDate';
  const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' };

  switch (format) {
    case 'short':
      return date.toLocaleString('en-US', { ...options, month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit' });
    case 'shortDate':
      return date.toLocaleDateString('en-US', { ...options, month: 'numeric', day: 'numeric', year: '2-digit' });
    case 'mediumDate':
      return date.toLocaleDateString('en-US', { ...options, month: 'short', day: 'numeric', year: 'numeric' });
    case 'longDate':
      return date.toLocaleDateString('en-US', { ...options, month: 'long', day: 'numeric', year: 'numeric' });
    case 'fullDate':
      return date.toLocaleDateString('en-US', { ...options, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    default:
      return date.toLocaleDateString('en-US', { ...options, month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function applyDecimalPipe(input: string, params: readonly string[]): string {
  const num = parseFloat(input);
  if (isNaN(num)) return input;

  const digitInfo = params[0] ?? '1.0-3';
  const { minFraction, maxFraction } = parseDigitInfo(digitInfo);

  return num.toLocaleString('en-US', {
    minimumFractionDigits: minFraction,
    maximumFractionDigits: maxFraction,
    useGrouping: true,
  });
}

function applyCurrencyPipe(input: string, params: readonly string[]): string {
  const num = parseFloat(input);
  if (isNaN(num)) return input;

  const currencyCode = params[0] ?? 'USD';

  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function applyPercentPipe(input: string, params: readonly string[]): string {
  const num = parseFloat(input);
  if (isNaN(num)) return input;

  const digitInfo = params[0] ?? '1.0-0';
  const { minFraction, maxFraction } = parseDigitInfo(digitInfo);
  const percentValue = num * 100;

  const formatted = percentValue.toLocaleString('en-US', {
    minimumFractionDigits: minFraction,
    maximumFractionDigits: maxFraction,
    useGrouping: true,
  });
  return `${formatted}%`;
}

function applySlicePipe(input: string, params: readonly string[]): string {
  const start = params[0] !== undefined ? parseInt(params[0], 10) : 0;
  const end = params[1] !== undefined ? parseInt(params[1], 10) : undefined;
  return input.slice(start, end);
}

// ---------------------------------------------------------------------------
// Custom pipe implementations
// ---------------------------------------------------------------------------

function applyDistancePipe(input: unknown): string {
  const km = parseFloat(String(input));
  if (isNaN(km)) return String(input);
  const ly = km / KM_PER_LIGHT_YEAR;
  return `${ly.toFixed(2)} ly`;
}

function applyStatusPipe(input: unknown, params: readonly string[]): string {
  const value = parseFloat(String(input));
  if (isNaN(value)) return String(input);

  const low = params[0] !== undefined ? parseFloat(params[0]) : 30;
  const high = params[1] !== undefined ? parseFloat(params[1]) : 70;

  if (value <= low) return 'critical';
  if (value <= high) return 'warning';
  return 'nominal';
}

function applyTimeAgoPipe(input: unknown): string {
  const date = new Date(String(input));
  if (isNaN(date.getTime())) return String(input);

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;
}

function applyCustomPipe(
  input: unknown,
  pipeType: string,
  params: readonly string[],
  specs: readonly CustomPipeSpec[],
): string {
  const spec = specs.find(s => s.name === pipeType);
  if (!spec) return String(input); // passthrough if no spec registered

  switch (pipeType) {
    case 'distance':
      return applyDistancePipe(input);
    case 'status':
      return applyStatusPipe(input, params);
    case 'timeAgo':
      return applyTimeAgoPipe(input);
    default:
      return String(input);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply a single pipe transform to an input value.
 * Handles all built-in Angular pipes and known custom pipes.
 */
export function applyPipeTransform(
  input: unknown,
  pipeType: PipeName,
  params: readonly string[],
  customSpecs: readonly CustomPipeSpec[],
): string {
  switch (pipeType) {
    case 'json':
      return JSON.stringify(input, null, 2);
    default:
      break;
  }

  const str = String(input);

  switch (pipeType) {
    case 'uppercase':
      return str.toUpperCase();
    case 'lowercase':
      return str.toLowerCase();
    case 'titlecase':
      return str.replace(/\w\S*/g, txt =>
        txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
      );
    case 'date':
      return applyDatePipe(str, params);
    case 'decimal':
      return applyDecimalPipe(str, params);
    case 'currency':
      return applyCurrencyPipe(str, params);
    case 'percent':
      return applyPercentPipe(str, params);
    case 'slice':
      return applySlicePipe(str, params);
    case 'async':
      return str; // passthrough
    default:
      return applyCustomPipe(input, pipeType, params, customSpecs);
  }
}
