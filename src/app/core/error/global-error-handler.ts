import { ErrorHandler, Injectable, signal, type Signal } from '@angular/core';

/** Structured error info captured by GlobalErrorHandler. */
export interface ErrorInfo {
  readonly message: string;
  readonly timestamp: string;
  readonly stack?: string;
  readonly source?: string;
}

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  private readonly _lastError = signal<ErrorInfo | null>(null);
  readonly lastError: Signal<ErrorInfo | null> = this._lastError.asReadonly();

  override handleError(error: unknown): void {
    const info = this._normalize(error);
    this._logStructured(info);
    this._lastError.set(info);
  }

  /** Reset the lastError signal to null. */
  clearLastError(): void {
    this._lastError.set(null);
  }

  private _normalize(error: unknown): ErrorInfo {
    if (error instanceof Error) {
      return {
        message: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack,
        source: this._extractSource(error.stack),
      };
    }
    if (typeof error === 'string') {
      return {
        message: error,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      message: String(error),
      timestamp: new Date().toISOString(),
    };
  }

  private _extractSource(stack?: string): string | undefined {
    if (!stack) return undefined;
    const match = stack.match(/at\s+(\S+)/);
    return match?.[1];
  }

  private _logStructured(info: ErrorInfo): void {
    console.error('[GlobalErrorHandler]', info);
  }
}
