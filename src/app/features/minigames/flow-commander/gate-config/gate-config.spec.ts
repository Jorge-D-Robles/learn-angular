import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FlowCommanderGateConfigComponent } from './gate-config';
import { GateType } from '../pipeline.types';

@Component({
  template: `<app-flow-commander-gate-config
    [gateType]="gateType"
    [currentCondition]="currentCondition"
    [availableProperties]="availableProperties"
    [tierMode]="tierMode"
    (conditionApplied)="onApplied($event)"
    (cancelled)="onCancelled()" />`,
  imports: [FlowCommanderGateConfigComponent],
})
class TestHost {
  gateType = GateType.if;
  currentCondition = '';
  availableProperties = ['item.color', 'item.type', 'item.priority'];
  tierMode: 'guided' | 'raw' = 'guided';
  onApplied = vi.fn();
  onCancelled = vi.fn();
}

describe('FlowCommanderGateConfigComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let element: HTMLElement;

  async function setup(overrides: Partial<TestHost> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    Object.assign(host, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  // --- Gate type display ---

  it('should display "@if Filter" label for GateType.if', async () => {
    await setup({ gateType: GateType.if });
    const badge = element.querySelector('.gate-config__type-badge');
    expect(badge?.textContent?.trim()).toBe('@if Filter');
  });

  it('should display "@for Duplicator" label for GateType.for', async () => {
    await setup({ gateType: GateType.for });
    const badge = element.querySelector('.gate-config__type-badge');
    expect(badge?.textContent?.trim()).toBe('@for Duplicator');
  });

  it('should display "@switch Router" label for GateType.switch', async () => {
    await setup({ gateType: GateType.switch });
    const badge = element.querySelector('.gate-config__type-badge');
    expect(badge?.textContent?.trim()).toBe('@switch Router');
  });

  // --- Gate type color ---

  it('should apply gate-type-specific color to type badge', async () => {
    await setup({ gateType: GateType.if });
    const badge = element.querySelector('.gate-config__type-badge') as HTMLElement;
    // DOM converts hex #3B82F6 to rgb(59, 130, 246)
    expect(badge.style.color).toBe('rgb(59, 130, 246)');
  });

  // --- Guided vs raw mode ---

  it('should render ExpressionBuilderComponent in guided mode when tierMode is "guided"', async () => {
    await setup({ gateType: GateType.if, tierMode: 'guided' });
    const selects = element.querySelectorAll('select');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('should render ExpressionBuilderComponent in raw mode when tierMode is "raw"', async () => {
    await setup({ gateType: GateType.if, tierMode: 'raw' });
    const rawInput = element.querySelector('input[aria-label="Expression"]');
    expect(rawInput).toBeTruthy();
  });

  // --- Condition apply event ---

  it('should emit conditionApplied with condition string when Apply is clicked', async () => {
    await setup({ gateType: GateType.if, tierMode: 'raw' });

    // Enter a valid expression via the raw input
    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;
    rawInput.value = "item.color === 'red'";
    rawInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    // Click Apply
    const applyBtn = element.querySelector('.gate-config__apply-btn') as HTMLButtonElement;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onApplied).toHaveBeenCalledWith("item.color === 'red'");
  });

  // --- Cancel event ---

  it('should emit cancelled event when Cancel is clicked', async () => {
    await setup();
    const cancelBtn = element.querySelector('.gate-config__cancel-btn') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(host.onCancelled).toHaveBeenCalled();
  });

  // --- @for track field ---

  it('should show track expression input when gateType is "for"', async () => {
    await setup({ gateType: GateType.for });
    const trackInput = element.querySelector('input[aria-label="Track expression"]');
    expect(trackInput).toBeTruthy();
  });

  it('should NOT show track expression input when gateType is "if"', async () => {
    await setup({ gateType: GateType.if });
    const trackInput = element.querySelector('input[aria-label="Track expression"]');
    expect(trackInput).toBeNull();
  });

  // --- @for apply ---

  it('should include track expression in emitted condition for @for gate', async () => {
    await setup({ gateType: GateType.for });

    // Enter iteration source via raw input
    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;
    rawInput.value = 'items';
    rawInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    // Enter track expression
    const trackInput = element.querySelector('input[aria-label="Track expression"]') as HTMLInputElement;
    trackInput.value = 'item.id';
    trackInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Click Apply
    const applyBtn = element.querySelector('.gate-config__apply-btn') as HTMLButtonElement;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onApplied).toHaveBeenCalledWith('items; track item.id');
  });

  // --- @switch hint text ---

  it('should show hint about automatic case lane assignment for @switch', async () => {
    await setup({ gateType: GateType.switch });
    const hint = element.querySelector('.gate-config__hint');
    expect(hint?.textContent?.trim()).toContain('Case lanes are assigned automatically');
  });

  // --- @switch apply ---

  it('should emit just the property expression for @switch gate', async () => {
    await setup({ gateType: GateType.switch });

    // Enter property expression via raw input
    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;
    rawInput.value = 'item.type';
    rawInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    // Click Apply
    const applyBtn = element.querySelector('.gate-config__apply-btn') as HTMLButtonElement;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onApplied).toHaveBeenCalledWith('item.type');
  });

  // --- Pre-populated condition ---

  it('should initialize condition from currentCondition input', async () => {
    await setup({ gateType: GateType.if, tierMode: 'raw', currentCondition: "item.color === 'red'" });

    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;
    expect(rawInput.value).toBe("item.color === 'red'");
  });

  // --- @for pre-populated ---

  it('should parse track expression from pre-populated @for condition', async () => {
    await setup({ gateType: GateType.for, currentCondition: 'items; track item.id' });

    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;
    expect(rawInput.value).toBe('items');

    const trackInput = element.querySelector('input[aria-label="Track expression"]') as HTMLInputElement;
    expect(trackInput.value).toBe('item.id');
  });
});
