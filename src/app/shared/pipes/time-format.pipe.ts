import { Pipe, PipeTransform } from '@angular/core';

/** Supported time display formats. */
export type TimeFormatStyle = 'long' | 'short' | 'timer';

interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
  tenths: number;
}

/**
 * Formats a number of seconds into a human-readable time string.
 *
 * Usage:
 *   {{ totalSeconds | timeFormat }}          -> "2h 15m 30s"
 *   {{ totalSeconds | timeFormat:'short' }}  -> "2:15:30"
 *   {{ totalSeconds | timeFormat:'timer' }}  -> "03:42.5"
 */
@Pipe({
  name: 'timeFormat',
  standalone: true,
  pure: true,
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: number, format: TimeFormatStyle = 'long'): string {
    if (value == null || isNaN(value)) {
      return '';
    }

    const clamped = Math.max(0, value);
    const parts = this._extractParts(clamped);

    switch (format) {
      case 'long':
        return this._formatLong(parts);
      case 'short':
        return this._formatShort(parts);
      case 'timer':
        return this._formatTimer(parts);
    }
  }

  private _extractParts(totalSeconds: number): TimeParts {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((totalSeconds * 10) % 10);
    return { hours, minutes, seconds, tenths };
  }

  private _formatLong(p: TimeParts): string {
    const segments: string[] = [];
    if (p.hours > 0) segments.push(`${p.hours}h`);
    if (p.minutes > 0) segments.push(`${p.minutes}m`);
    if (p.seconds > 0) segments.push(`${p.seconds}s`);
    return segments.length > 0 ? segments.join(' ') : '0s';
  }

  private _formatShort(p: TimeParts): string {
    const ss = String(p.seconds).padStart(2, '0');
    if (p.hours > 0) {
      const mm = String(p.minutes).padStart(2, '0');
      return `${p.hours}:${mm}:${ss}`;
    }
    return `${p.minutes}:${ss}`;
  }

  private _formatTimer(p: TimeParts): string {
    if (p.hours > 0) {
      const hh = String(p.hours).padStart(2, '0');
      const mm = String(p.minutes).padStart(2, '0');
      const ss = String(p.seconds).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    const mm = String(p.minutes).padStart(2, '0');
    const ss = String(p.seconds).padStart(2, '0');
    return `${mm}:${ss}.${p.tenths}`;
  }
}
