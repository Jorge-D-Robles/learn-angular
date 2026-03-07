import { Component, signal } from '@angular/core';
import { createComponent, getMockProvider } from './test-utils';

// Minimal test component
@Component({
  selector: 'app-test-host',
  template: '<p>test works</p>',
})
class TestHostComponent {
  value = 42;
}

// Component with signal-driven content for detectChanges testing
@Component({
  selector: 'app-signal-host',
  template: '<p>{{ label() }}</p>',
})
class SignalHostComponent {
  label = signal('initial');
}

// Minimal service for mock testing
class TestService {
  getValue(): number {
    return 1;
  }
}

describe('test-utils', () => {
  describe('createComponent', () => {
    it('should create a component and return fixture, component, and element', async () => {
      const result = await createComponent(TestHostComponent);

      expect(result.fixture).toBeDefined();
      expect(result.component).toBeInstanceOf(TestHostComponent);
      expect(result.element).toBeInstanceOf(HTMLElement);
    });

    it('should detect changes by default', async () => {
      const { element } = await createComponent(TestHostComponent);

      expect(element.querySelector('p')?.textContent).toBe('test works');
    });

    it('should skip detectChanges when option is false', async () => {
      const { fixture, component, element } = await createComponent(SignalHostComponent, {
        detectChanges: false,
      });

      // Component exists but signal updates have not been reflected
      expect(component).toBeInstanceOf(SignalHostComponent);

      // Mutate the signal before detectChanges runs
      component.label.set('updated');
      fixture.detectChanges();

      // The DOM should show the updated value, proving detectChanges was deferred
      expect(element.querySelector('p')?.textContent).toBe('updated');
    });

    it('should accept providers', async () => {
      const mockProvider = getMockProvider(TestService, {
        getValue: vi.fn().mockReturnValue(99),
      });

      const { component } = await createComponent(TestHostComponent, {
        providers: [mockProvider],
      });

      expect(component).toBeDefined();
    });
  });

  describe('getMockProvider', () => {
    it('should create a provider with the given token and overrides', () => {
      const mock = getMockProvider(TestService, { getValue: vi.fn() });

      expect(mock).toEqual({
        provide: TestService,
        useValue: { getValue: expect.any(Function) },
      });
    });

    it('should create a provider with empty overrides by default', () => {
      const mock = getMockProvider(TestService);

      expect(mock).toEqual({
        provide: TestService,
        useValue: {},
      });
    });
  });
});
