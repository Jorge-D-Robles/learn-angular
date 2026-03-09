import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { BindingTypeSelectorComponent } from './binding-type-selector';
import { WireType } from '../wire-protocol.types';

// ---------------------------------------------------------------------------
// Test host — drives the sub-component via inputs/outputs
// ---------------------------------------------------------------------------

@Component({
  template: `<app-binding-type-selector
    [selectedType]="selectedType"
    [availableTypes]="availableTypes"
    (typeSelected)="onTypeSelected($event)" />`,
  imports: [BindingTypeSelectorComponent],
})
class TestHost {
  selectedType = WireType.interpolation;
  availableTypes = Object.values(WireType);
  onTypeSelected = vi.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BindingTypeSelectorComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let element: HTMLElement;

  function setup(overrides: Partial<TestHost> = {}): void {
    TestBed.configureTestingModule({
      imports: [TestHost],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    Object.assign(host, overrides);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    fixture?.destroy();
  });

  // --- 1. Rendering tests ---

  describe('Rendering', () => {
    it('should render 4 buttons (one per WireType)', () => {
      setup();
      const buttons = element.querySelectorAll('.binding-type-selector__btn');
      expect(buttons.length).toBe(4);
    });

    it('should display the correct label text on each button', () => {
      setup();
      const buttons = element.querySelectorAll('.binding-type-selector__btn');
      const labels = Array.from(buttons).map(b => b.textContent?.trim());
      expect(labels[0]).toContain('{{ }}');
      expect(labels[1]).toContain('[ ]');
      expect(labels[2]).toContain('( )');
      expect(labels[3]).toContain('[( )]');
    });

    it('should display the keyboard shortcut hint on each button', () => {
      setup();
      const keys = element.querySelectorAll('.binding-type-selector__key');
      expect(keys.length).toBe(4);
      expect(keys[0].textContent?.trim()).toBe('1');
      expect(keys[1].textContent?.trim()).toBe('2');
      expect(keys[2].textContent?.trim()).toBe('3');
      expect(keys[3].textContent?.trim()).toBe('4');
    });
  });

  // --- 2. Type selection via click ---

  describe('Type Selection', () => {
    it('should emit typeSelected with WireType.property when Property button is clicked', () => {
      setup();
      const buttons = element.querySelectorAll('.binding-type-selector__btn') as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      expect(host.onTypeSelected).toHaveBeenCalledWith(WireType.property);
    });

    it('should emit typeSelected with WireType.event when Event button is clicked', () => {
      setup();
      const buttons = element.querySelectorAll('.binding-type-selector__btn') as NodeListOf<HTMLButtonElement>;
      buttons[2].click();
      expect(host.onTypeSelected).toHaveBeenCalledWith(WireType.event);
    });
  });

  // --- 3. Active state highlight ---

  describe('Active State', () => {
    it('should add --active class to the selected type button', () => {
      setup({ selectedType: WireType.interpolation });
      const buttons = element.querySelectorAll('.binding-type-selector__btn');
      expect(buttons[0].classList.contains('binding-type-selector__btn--active')).toBe(true);
      expect(buttons[1].classList.contains('binding-type-selector__btn--active')).toBe(false);
    });

    it('should move --active class when selectedType changes', () => {
      setup();
      // Verify initial state
      let buttons = element.querySelectorAll('.binding-type-selector__btn');
      expect(buttons[0].classList.contains('binding-type-selector__btn--active')).toBe(true);

      // Update in a new CD cycle
      host.selectedType = WireType.event;
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      buttons = element.querySelectorAll('.binding-type-selector__btn');
      expect(buttons[0].classList.contains('binding-type-selector__btn--active')).toBe(false);
      expect(buttons[2].classList.contains('binding-type-selector__btn--active')).toBe(true);
    });
  });

  // --- 4. ARIA attributes ---

  describe('ARIA Attributes', () => {
    it('should have role="radiogroup" with aria-label on the container', () => {
      setup();
      const container = element.querySelector('.binding-type-selector');
      expect(container?.getAttribute('role')).toBe('radiogroup');
      expect(container?.getAttribute('aria-label')).toBe('Wire type');
    });

    it('should have role="radio" on each button', () => {
      setup();
      const buttons = element.querySelectorAll('.binding-type-selector__btn');
      buttons.forEach(btn => {
        expect(btn.getAttribute('role')).toBe('radio');
      });
    });

    it('should set aria-checked="true" on the active button and "false" on others', () => {
      setup({ selectedType: WireType.interpolation });
      const buttons = element.querySelectorAll('.binding-type-selector__btn');
      expect(buttons[0].getAttribute('aria-checked')).toBe('true');
      expect(buttons[1].getAttribute('aria-checked')).toBe('false');
      expect(buttons[2].getAttribute('aria-checked')).toBe('false');
      expect(buttons[3].getAttribute('aria-checked')).toBe('false');
    });

    it('should have descriptive aria-label including binding name and key hint', () => {
      setup();
      const buttons = element.querySelectorAll('.binding-type-selector__btn');
      expect(buttons[0].getAttribute('aria-label')).toBe('{{ }} binding (key 1)');
      expect(buttons[1].getAttribute('aria-label')).toBe('[ ] binding (key 2)');
      expect(buttons[2].getAttribute('aria-label')).toBe('( ) binding (key 3)');
      expect(buttons[3].getAttribute('aria-label')).toBe('[( )] binding (key 4)');
    });
  });

  // --- 5. Unavailable type dimming ---

  describe('Unavailable Types', () => {
    it('should add --disabled class and disabled attribute to unavailable types', () => {
      setup({ availableTypes: [WireType.interpolation, WireType.property] });
      const buttons = element.querySelectorAll('.binding-type-selector__btn') as NodeListOf<HTMLButtonElement>;
      // Interpolation and Property available
      expect(buttons[0].disabled).toBe(false);
      expect(buttons[0].classList.contains('binding-type-selector__btn--disabled')).toBe(false);
      expect(buttons[1].disabled).toBe(false);
      expect(buttons[1].classList.contains('binding-type-selector__btn--disabled')).toBe(false);
      // Event and Two-Way unavailable
      expect(buttons[2].disabled).toBe(true);
      expect(buttons[2].classList.contains('binding-type-selector__btn--disabled')).toBe(true);
      expect(buttons[3].disabled).toBe(true);
      expect(buttons[3].classList.contains('binding-type-selector__btn--disabled')).toBe(true);
    });

    it('should NOT emit typeSelected when clicking a disabled button', () => {
      setup({ availableTypes: [WireType.interpolation, WireType.property] });
      const buttons = element.querySelectorAll('.binding-type-selector__btn') as NodeListOf<HTMLButtonElement>;
      buttons[2].click();
      expect(host.onTypeSelected).not.toHaveBeenCalled();
    });
  });

  // --- 6. Edge case: empty availableTypes ---

  describe('Edge Cases', () => {
    it('should disable all buttons when availableTypes is empty', () => {
      setup({ availableTypes: [] });
      const buttons = element.querySelectorAll('.binding-type-selector__btn') as NodeListOf<HTMLButtonElement>;
      buttons.forEach(btn => {
        expect(btn.disabled).toBe(true);
        expect(btn.classList.contains('binding-type-selector__btn--disabled')).toBe(true);
      });
    });

    it('should have all buttons enabled when availableTypes is not set (defaults to all)', () => {
      // Create without explicit availableTypes to test the default
      TestBed.configureTestingModule({
        imports: [BindingTypeSelectorComponent],
      });
      // Use a minimal host that does not set availableTypes
      @Component({
        template: `<app-binding-type-selector
          [selectedType]="selectedType"
          (typeSelected)="onTypeSelected($event)" />`,
        imports: [BindingTypeSelectorComponent],
      })
      class MinimalHost {
        selectedType = WireType.interpolation;
        onTypeSelected = vi.fn();
      }

      TestBed.configureTestingModule({ imports: [MinimalHost] });
      const minFixture = TestBed.createComponent(MinimalHost);
      minFixture.detectChanges();
      const minEl = minFixture.nativeElement as HTMLElement;

      const buttons = minEl.querySelectorAll('.binding-type-selector__btn') as NodeListOf<HTMLButtonElement>;
      buttons.forEach(btn => {
        expect(btn.disabled).toBe(false);
      });
      minFixture.destroy();
    });
  });
});
