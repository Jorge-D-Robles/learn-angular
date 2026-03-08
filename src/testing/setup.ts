/**
 * Global test setup for jsdom environment.
 * Runs before every test file via Angular CLI's setupFiles option.
 */

// jsdom does not implement window.matchMedia.
// Provide a minimal stub so services like SettingsService can
// call matchMedia() during construction without throwing.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => {
      const noop = () => {
        /* intentional no-op stub */
      };
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: noop,      // deprecated
        removeListener: noop,   // deprecated
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => false,
      };
    },
  });
}

// jsdom does not implement HTMLMediaElement.play() or pause().
// AudioService calls clone.play().catch(...), which throws when play()
// returns undefined instead of a Promise.
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  configurable: true,
  value: () => Promise.resolve(),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  configurable: true,
  value: () => {
    /* intentional no-op stub */
  },
});
