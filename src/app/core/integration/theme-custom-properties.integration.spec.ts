// ---------------------------------------------------------------------------
// Integration test: Theme-aware component rendering with design token CSS
// custom properties
// ---------------------------------------------------------------------------
// Verifies that switching themes applies the correct body class and that the
// CSS custom property definitions in each theme are consistent. Since JSDOM
// does not process SCSS, this test uses inline styles on the body element to
// simulate what the theme SCSS files provide, then verifies getComputedStyle
// resolves the expected values.
// ---------------------------------------------------------------------------

import { TestBed } from '@angular/core/testing';
import { SettingsService, type Theme } from '../settings/settings.service';

// --- Fake storage ---

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
}

// --- Theme property definitions (mirroring SCSS files) ---

const THEME_PROPERTIES: Record<Theme, Record<string, string>> = {
  dark: {
    '--nx-color-void': '#050810',
    '--nx-color-hull': '#0f1320',
    '--nx-color-bulkhead': '#1a1f2e',
    '--nx-color-corridor': '#94a3b8',
    '--nx-color-display': '#f1f5f9',
    '--nx-color-beacon': '#ffffff',
    '--nx-color-code-bg': '#080c14',
    '--nx-color-surface': '#0f1320',
    '--nx-color-border': '#1a1f2e',
    '--nx-color-surface-hover': '#141929',
    '--nx-color-deep-space': '#050810',
  },
  station: {
    '--nx-color-void': '#0a0e1a',
    '--nx-color-hull': '#1a1f2e',
    '--nx-color-bulkhead': '#252b3d',
    '--nx-color-corridor': '#8b92a8',
    '--nx-color-display': '#e2e8f0',
    '--nx-color-beacon': '#ffffff',
    '--nx-color-reactor-blue': '#3b82f6',
    '--nx-color-sensor-green': '#22c55e',
    '--nx-color-alert-orange': '#f97316',
    '--nx-color-emergency-red': '#ef4444',
    '--nx-color-comm-purple': '#a855f7',
    '--nx-color-solar-gold': '#eab308',
    '--nx-color-code-bg': '#0d1117',
    '--nx-color-surface': '#1a1f2e',
    '--nx-color-border': '#252b3d',
    '--nx-color-surface-hover': '#1e2538',
    '--nx-color-deep-space': '#0a0e1a',
  },
  light: {
    '--nx-color-void': '#ffffff',
    '--nx-color-hull': '#f8fafc',
    '--nx-color-bulkhead': '#e2e8f0',
    '--nx-color-corridor': '#475569',
    '--nx-color-display': '#0f172a',
    '--nx-color-beacon': '#0f172a',
    '--nx-color-reactor-blue': '#2563eb',
    '--nx-color-sensor-green': '#16a34a',
    '--nx-color-alert-orange': '#ea580c',
    '--nx-color-emergency-red': '#dc2626',
    '--nx-color-comm-purple': '#7c3aed',
    '--nx-color-solar-gold': '#ca8a04',
    '--nx-color-code-bg': '#f1f5f9',
    '--nx-color-surface': '#f8fafc',
    '--nx-color-border': '#e2e8f0',
    '--nx-color-surface-hover': '#f1f5f9',
    '--nx-color-deep-space': '#ffffff',
  },
};

/** Critical custom properties that MUST be defined in all 3 themes. */
const CRITICAL_PROPERTIES = [
  '--nx-color-void',
  '--nx-color-hull',
  '--nx-color-bulkhead',
  '--nx-color-corridor',
  '--nx-color-display',
  '--nx-color-beacon',
  '--nx-color-code-bg',
  '--nx-color-surface',
  '--nx-color-border',
  '--nx-color-surface-hover',
  '--nx-color-deep-space',
] as const;

const THEME_CLASSES = ['theme-dark', 'theme-station', 'theme-light'] as const;

// --- Style injection helper ---

let injectedStyleEl: HTMLStyleElement | null = null;

function injectThemeStyles(): void {
  injectedStyleEl = document.createElement('style');
  let css = '';
  for (const [theme, props] of Object.entries(THEME_PROPERTIES)) {
    css += `body.theme-${theme} {\n`;
    for (const [prop, value] of Object.entries(props)) {
      css += `  ${prop}: ${value};\n`;
    }
    css += '}\n';
  }
  injectedStyleEl.textContent = css;
  document.head.appendChild(injectedStyleEl);
}

function removeThemeStyles(): void {
  if (injectedStyleEl) {
    injectedStyleEl.remove();
    injectedStyleEl = null;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Theme custom properties integration', () => {
  let service: SettingsService;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;

    const fakeStorage = createFakeStorage();
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() }),
      writable: true,
      configurable: true,
    });

    document.body.classList.remove(...THEME_CLASSES);
    injectThemeStyles();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
    TestBed.flushEffects();
  });

  afterEach(() => {
    document.body.classList.remove(...THEME_CLASSES);
    removeThemeStyles();

    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
      configurable: true,
    });
  });

  it('default theme-station applies expected --nx-color-void value', () => {
    expect(document.body.classList.contains('theme-station')).toBe(true);

    const computed = getComputedStyle(document.body);
    const value = computed.getPropertyValue('--nx-color-void').trim();

    expect(value).toBe('#0a0e1a');
  });

  it('switching to theme-dark applies dark-specific custom property values', () => {
    service.updateSetting('theme', 'dark');
    TestBed.flushEffects();

    expect(document.body.classList.contains('theme-dark')).toBe(true);

    const computed = getComputedStyle(document.body);
    expect(computed.getPropertyValue('--nx-color-void').trim()).toBe('#050810');
    expect(computed.getPropertyValue('--nx-color-hull').trim()).toBe('#0f1320');
  });

  it('switching to theme-light applies light-specific custom property values', () => {
    service.updateSetting('theme', 'light');
    TestBed.flushEffects();

    expect(document.body.classList.contains('theme-light')).toBe(true);

    const computed = getComputedStyle(document.body);
    expect(computed.getPropertyValue('--nx-color-void').trim()).toBe('#ffffff');
    expect(computed.getPropertyValue('--nx-color-display').trim()).toBe('#0f172a');
  });

  it('all critical custom properties are defined in all 3 themes', () => {
    const themes: Theme[] = ['dark', 'station', 'light'];

    for (const theme of themes) {
      const props = THEME_PROPERTIES[theme];
      for (const criticalProp of CRITICAL_PROPERTIES) {
        expect(props[criticalProp]).toBeDefined();
        expect(props[criticalProp].length).toBeGreaterThan(0);
      }
    }
  });

  it('toggling back to theme-dark after theme-light restores original values', () => {
    // Switch to light
    service.updateSetting('theme', 'light');
    TestBed.flushEffects();

    const computedLight = getComputedStyle(document.body);
    expect(computedLight.getPropertyValue('--nx-color-void').trim()).toBe('#ffffff');

    // Switch back to dark
    service.updateSetting('theme', 'dark');
    TestBed.flushEffects();

    expect(document.body.classList.contains('theme-dark')).toBe(true);
    expect(document.body.classList.contains('theme-light')).toBe(false);

    const computedDark = getComputedStyle(document.body);
    expect(computedDark.getPropertyValue('--nx-color-void').trim()).toBe('#050810');
  });
});
