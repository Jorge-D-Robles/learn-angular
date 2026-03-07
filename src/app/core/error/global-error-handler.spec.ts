import { TestBed } from '@angular/core/testing';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [GlobalErrorHandler],
    });
    handler = TestBed.inject(GlobalErrorHandler);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('creates successfully', () => {
    expect(handler).toBeTruthy();
  });

  it('initial lastError is null', () => {
    expect(handler.lastError()).toBeNull();
  });

  it('handleError captures Error objects', () => {
    handler.handleError(new Error('test'));

    const error = handler.lastError();
    expect(error).not.toBeNull();
    expect(error!.message).toBe('test');
    expect(error!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(error!.stack).toBeDefined();
    expect(typeof error!.stack).toBe('string');
  });

  it('handleError captures string errors', () => {
    handler.handleError('string error');

    const error = handler.lastError();
    expect(error).not.toBeNull();
    expect(error!.message).toBe('string error');
    expect(error!.stack).toBeUndefined();
  });

  it('handleError captures non-Error/non-string values', () => {
    handler.handleError(42);

    const error = handler.lastError();
    expect(error).not.toBeNull();
    expect(error!.message).toBe('42');
  });

  it('handleError captures null/undefined', () => {
    handler.handleError(null);
    expect(handler.lastError()!.message).toBe('null');

    handler.handleError(undefined);
    expect(handler.lastError()!.message).toBe('undefined');
  });

  it('lastError signal updates on each error', () => {
    handler.handleError(new Error('first'));
    expect(handler.lastError()!.message).toBe('first');

    handler.handleError(new Error('second'));
    expect(handler.lastError()!.message).toBe('second');
  });

  it('clearLastError resets signal to null', () => {
    handler.handleError(new Error('oops'));
    expect(handler.lastError()).not.toBeNull();

    handler.clearLastError();
    expect(handler.lastError()).toBeNull();
  });

  it('logs structured output to console.error', () => {
    handler.handleError(new Error('boom'));

    expect(consoleSpy).toHaveBeenCalledWith(
      '[GlobalErrorHandler]',
      expect.objectContaining({
        message: 'boom',
        timestamp: expect.any(String),
        source: expect.any(String),
        stack: expect.any(String),
      }),
    );
  });

  it('extracts source from stack trace', () => {
    handler.handleError(new Error('traced'));

    const error = handler.lastError();
    expect(error).not.toBeNull();
    expect(error!.source).toBeDefined();
    expect(typeof error!.source).toBe('string');
  });
});
