import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StatePersistenceService } from './state-persistence.service';

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('StatePersistenceService', () => {
  let service: StatePersistenceService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatePersistenceService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Creation ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- save/load roundtrip ---

  it('should save and load an object roundtrip', () => {
    service.save('profile', { name: 'Riker' });
    const result = service.load<{ name: string }>('profile');
    expect(result).toEqual({ name: 'Riker' });
  });

  it('should store data under a namespaced key', () => {
    service.save('profile', { name: 'Riker' });
    const raw = fakeStorage.getItem('nexus-station:profile');
    expect(raw).toBe(JSON.stringify({ name: 'Riker' }));
  });

  // --- load edge cases ---

  it('should return null for a missing key', () => {
    expect(service.load('nonexistent')).toBeNull();
  });

  it('should return null for corrupted JSON and log a warning', () => {
    fakeStorage.setItem('nexus-station:corrupted', '{invalid json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(service.load('corrupted')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should load a primitive string value', () => {
    fakeStorage.setItem('nexus-station:str', '"just a string"');
    expect(service.load<string>('str')).toBe('just a string');
  });

  // --- save edge cases ---

  it('should return true on successful save', () => {
    expect(service.save('key', 42)).toBe(true);
  });

  it('should handle stringify errors gracefully', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(service.save('bad', circular)).toBe(false);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should handle quota exceeded errors gracefully', () => {
    const originalSetItem = fakeStorage.setItem;
    fakeStorage.setItem = () => {
      throw new DOMException('QuotaExceededError');
    };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(service.save('big', 'data')).toBe(false);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
    fakeStorage.setItem = originalSetItem;
  });

  it('should save null value successfully', () => {
    expect(service.save('key', null)).toBe(true);
    expect(service.load('key')).toBeNull();
  });

  // --- clear ---

  it('should remove a specific key', () => {
    service.save('a', 1);
    service.clear('a');
    expect(fakeStorage.getItem('nexus-station:a')).toBeNull();
  });

  // --- clearAll ---

  it('should remove only nexus-station keys', () => {
    fakeStorage.setItem('nexus-station:a', '"1"');
    fakeStorage.setItem('nexus-station:b', '"2"');
    fakeStorage.setItem('other-app:c', '"3"');

    service.clearAll();

    expect(fakeStorage.getItem('nexus-station:a')).toBeNull();
    expect(fakeStorage.getItem('nexus-station:b')).toBeNull();
    expect(fakeStorage.getItem('other-app:c')).toBe('"3"');
  });

  // --- exportState ---

  it('should export all nexus-station entries as JSON', () => {
    fakeStorage.setItem('nexus-station:xp', '100');
    fakeStorage.setItem('nexus-station:name', '"Picard"');
    fakeStorage.setItem('other-app:x', '"ignored"');

    const exported = service.exportState();
    const parsed = JSON.parse(exported);

    expect(parsed).toEqual({
      'nexus-station:xp': 100,
      'nexus-station:name': 'Picard',
    });
  });

  // --- importState ---

  it('should restore entries from exported JSON', () => {
    const json = JSON.stringify({
      'nexus-station:xp': 100,
      'nexus-station:name': 'Picard',
    });

    expect(service.importState(json)).toBe(true);
    expect(fakeStorage.getItem('nexus-station:xp')).toBe('100');
    expect(fakeStorage.getItem('nexus-station:name')).toBe('"Picard"');
  });

  it('should return false on invalid JSON import', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(service.importState('not json')).toBe(false);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  // --- autoSave ---

  it('should persist initial signal value and react to changes', () => {
    const injector = TestBed.inject(Injector);
    const sig = signal('initial');

    service.autoSave('test', sig, injector);
    TestBed.flushEffects();

    expect(fakeStorage.getItem('nexus-station:test')).toBe('"initial"');

    sig.set('updated');
    TestBed.flushEffects();

    expect(fakeStorage.getItem('nexus-station:test')).toBe('"updated"');
  });

  // --- key namespacing ---

  it('should prefix all keys with nexus-station:', () => {
    service.save('test-key', 'value');
    expect(fakeStorage.getItem('nexus-station:test-key')).toBe('"value"');
    expect(fakeStorage.getItem('test-key')).toBeNull();
  });
});
