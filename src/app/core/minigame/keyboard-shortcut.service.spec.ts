import { KeyboardShortcutService } from './keyboard-shortcut.service';

function dispatchKey(key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
}

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;

  beforeEach(() => {
    service = new KeyboardShortcutService();
  });

  afterEach(() => {
    service.destroy();
  });

  it('should be created with isEnabled defaulting to true', () => {
    expect(service).toBeTruthy();
    expect(service.isEnabled()).toBe(true);
  });

  it('should register shortcuts and return them via getRegistered', () => {
    service.register('1', 'Slot 1', vi.fn());
    service.register(' ', 'Grab module', vi.fn());

    const registered = service.getRegistered();
    expect(registered.length).toBe(2);
    expect(registered.find((r) => r.key === '1')?.label).toBe('Slot 1');
    expect(registered.find((r) => r.key === ' ')?.label).toBe('Grab module');
  });

  it('should dispatch callback when registered key is pressed', () => {
    const callback = vi.fn();
    service.register('a', 'Test action', callback);

    dispatchKey('a');

    expect(callback).toHaveBeenCalledOnce();
  });

  it('should preventDefault for registered key events', () => {
    service.register('a', 'Test action', vi.fn());

    const event = dispatchKey('a');

    expect(event.defaultPrevented).toBe(true);
  });

  it('should ignore unregistered keys without error', () => {
    const callback = vi.fn();
    service.register('a', 'Test action', callback);

    dispatchKey('b');

    expect(callback).not.toHaveBeenCalled();
  });

  it('should clear shortcuts, stop dispatch, and reset isEnabled on unregisterAll', () => {
    const callback = vi.fn();
    service.register('a', 'Test action', callback);
    service.setEnabled(false);

    service.unregisterAll();

    expect(service.getRegistered()).toEqual([]);
    expect(service.isEnabled()).toBe(true);

    dispatchKey('a');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should not dispatch callbacks when isEnabled is false', () => {
    const callback = vi.fn();
    service.register('a', 'Test action', callback);

    service.setEnabled(false);
    dispatchKey('a');

    expect(callback).not.toHaveBeenCalled();
  });

  it('should resume dispatching after re-enabling', () => {
    const callback = vi.fn();
    service.register('a', 'Test action', callback);

    service.setEnabled(false);
    service.setEnabled(true);
    dispatchKey('a');

    expect(callback).toHaveBeenCalledOnce();
  });

  it('should replace handler when re-registering the same key', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    service.register('a', 'First', callback1);
    service.register('a', 'Second', callback2);

    dispatchKey('a');

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledOnce();
  });

  it('should normalize key to lowercase for case-insensitive matching', () => {
    const callback = vi.fn();
    service.register('A', 'Uppercase A', callback);

    dispatchKey('a');

    expect(callback).toHaveBeenCalledOnce();
  });
});
