import { Component, signal } from '@angular/core';
import { createComponent } from '../../../../../testing/test-utils';
import type {
  ServiceNode,
  ComponentNode,
  ScopeRule,
} from '../power-grid.types';
import { PowerGridScopeConfigComponent } from './scope-config';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createServiceNode(overrides?: Partial<ServiceNode>): ServiceNode {
  return {
    id: 'svc-1',
    name: 'AuthService',
    type: 'service',
    providedIn: 'root',
    ...overrides,
  };
}

function createComponentNode(overrides?: Partial<ComponentNode>): ComponentNode {
  return {
    id: 'cmp-1',
    name: 'LoginComponent',
    requiredInjections: ['svc-1'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-scope-config
      [service]="service()"
      [scopeRules]="scopeRules()"
      [availableComponents]="availableComponents()"
      (scopeChanged)="onScopeChanged($event)"
      (connectionRequested)="onConnectionRequested($event)"
    />
  `,
  imports: [PowerGridScopeConfigComponent],
})
class TestHost {
  service = signal<ServiceNode>(createServiceNode());
  scopeRules = signal<readonly ScopeRule[]>([]);
  availableComponents = signal<readonly ComponentNode[]>([]);
  onScopeChanged = vi.fn();
  onConnectionRequested = vi.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PowerGridScopeConfigComponent', () => {
  async function setup(overrides: {
    service?: ServiceNode;
    scopeRules?: readonly ScopeRule[];
    availableComponents?: readonly ComponentNode[];
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.service) host.service.set(overrides.service);
    if (overrides.scopeRules) host.scopeRules.set(overrides.scopeRules);
    if (overrides.availableComponents) host.availableComponents.set(overrides.availableComponents);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  function getScopeConfig(el: HTMLElement): HTMLElement {
    return el.querySelector('app-scope-config') as HTMLElement;
  }

  function getScopeButtons(el: HTMLElement): HTMLButtonElement[] {
    return Array.from(el.querySelectorAll('.scope-config__scope-btn'));
  }

  function getTargetButtons(el: HTMLElement): HTMLButtonElement[] {
    return Array.from(el.querySelectorAll('.scope-config__target-btn'));
  }

  function getWarning(el: HTMLElement): HTMLElement | null {
    return el.querySelector('.scope-config__warning');
  }

  // 1. Creation
  it('should create the component', async () => {
    const { element } = await setup();
    expect(getScopeConfig(element)).toBeTruthy();
  });

  // 2. Service info rendering
  it('should display the service name and type', async () => {
    const { element } = await setup({
      service: createServiceNode({ name: 'DataService', type: 'service' }),
    });
    const header = element.querySelector('.scope-config__header') as HTMLElement;
    expect(header).toBeTruthy();
    expect(header.textContent).toContain('DataService');
    expect(header.textContent).toContain('service');
  });

  // 3. Current scope display
  it('should show the service providedIn value as the default scope', async () => {
    const { element } = await setup({
      service: createServiceNode({ providedIn: 'component' }),
    });
    const activeBtn = element.querySelector('.scope-config__scope-btn--active') as HTMLElement;
    expect(activeBtn).toBeTruthy();
    expect(activeBtn.textContent!.toLowerCase()).toContain('component');
  });

  // 4. Scope dropdown renders all 3 options
  it('should render all 3 scope options', async () => {
    const { element } = await setup();
    const btns = getScopeButtons(element);
    expect(btns.length).toBe(3);

    const labels = btns.map(b => b.textContent!.trim().toLowerCase());
    expect(labels).toContain('root');
    expect(labels).toContain('component');
    expect(labels).toContain('hierarchical');
  });

  // 5. Scope color coding
  it('should apply scope colors to each option', async () => {
    const { element } = await setup();
    const btns = getScopeButtons(element);

    // Each button should have a border-color style matching SCOPE_COLORS
    const rootBtn = btns.find(b => b.textContent!.trim().toLowerCase() === 'root')!;
    const componentBtn = btns.find(b => b.textContent!.trim().toLowerCase() === 'component')!;
    const hierarchicalBtn = btns.find(b => b.textContent!.trim().toLowerCase() === 'hierarchical')!;

    // Browsers convert hex to rgb() in computed style
    expect(rootBtn.style.borderColor).toBe('rgb(59, 130, 246)');
    expect(componentBtn.style.borderColor).toBe('rgb(34, 197, 94)');
    expect(hierarchicalBtn.style.borderColor).toBe('rgb(249, 115, 22)');
  });

  // 6. Active scope highlighting
  it('should apply --active class to the currently selected scope', async () => {
    const { element } = await setup({
      service: createServiceNode({ providedIn: 'root' }),
    });
    const btns = getScopeButtons(element);
    const rootBtn = btns.find(b => b.textContent!.trim().toLowerCase() === 'root')!;
    expect(rootBtn.classList.contains('scope-config__scope-btn--active')).toBe(true);

    // Others should NOT have active class
    const otherBtns = btns.filter(b => b !== rootBtn);
    for (const btn of otherBtns) {
      expect(btn.classList.contains('scope-config__scope-btn--active')).toBe(false);
    }
  });

  // 7. scopeChanged output
  it('should emit scopeChanged when clicking a scope option', async () => {
    const { fixture, host, element } = await setup({
      service: createServiceNode({ providedIn: 'root' }),
    });
    const btns = getScopeButtons(element);
    const componentBtn = btns.find(b => b.textContent!.trim().toLowerCase() === 'component')!;

    componentBtn.click();
    fixture.detectChanges();

    expect(host.onScopeChanged).toHaveBeenCalledWith('component');
  });

  // 8. Valid target list (scope allowed)
  it('should show valid targets when scope is allowed', async () => {
    const { element } = await setup({
      service: createServiceNode({ id: 'svc-1', providedIn: 'root' }),
      scopeRules: [{ serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' }],
      availableComponents: [
        createComponentNode({ id: 'cmp-1', name: 'LoginComponent', requiredInjections: ['svc-1'] }),
        createComponentNode({ id: 'cmp-2', name: 'ProfileComponent', requiredInjections: ['svc-2'] }),
      ],
    });
    const targets = getTargetButtons(element);
    expect(targets.length).toBe(1);
    expect(targets[0].textContent).toContain('LoginComponent');
  });

  // 9. Valid target list (scope disallowed)
  it('should show no valid targets when scope is disallowed', async () => {
    const { element } = await setup({
      service: createServiceNode({ id: 'svc-1', providedIn: 'component' }),
      scopeRules: [{ serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' }],
      availableComponents: [
        createComponentNode({ id: 'cmp-1', name: 'LoginComponent', requiredInjections: ['svc-1'] }),
      ],
    });
    // Default selected scope is 'component' (from providedIn), which is NOT in allowedScopes
    const targets = getTargetButtons(element);
    expect(targets.length).toBe(0);
  });

  // 10. Short circuit warning shown
  it('should show short circuit warning when scope is not allowed', async () => {
    const { element } = await setup({
      service: createServiceNode({ id: 'svc-1', providedIn: 'component' }),
      scopeRules: [{ serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' }],
    });
    const warning = getWarning(element);
    expect(warning).toBeTruthy();
    expect(warning!.textContent!.toLowerCase()).toContain('short circuit');
  });

  // 11. Short circuit warning hidden
  it('should not show warning when scope is allowed', async () => {
    const { element } = await setup({
      service: createServiceNode({ id: 'svc-1', providedIn: 'root' }),
      scopeRules: [{ serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' }],
    });
    const warning = getWarning(element);
    expect(warning).toBeNull();
  });

  // 12. connectionRequested output
  it('should emit connectionRequested when clicking a target', async () => {
    const { fixture, host, element } = await setup({
      service: createServiceNode({ id: 'svc-1', providedIn: 'root' }),
      scopeRules: [],
      availableComponents: [
        createComponentNode({ id: 'cmp-1', name: 'LoginComponent', requiredInjections: ['svc-1'] }),
      ],
    });
    const targets = getTargetButtons(element);
    expect(targets.length).toBe(1);

    targets[0].click();
    fixture.detectChanges();

    expect(host.onConnectionRequested).toHaveBeenCalledWith({
      serviceId: 'svc-1',
      componentId: 'cmp-1',
      scope: 'root',
    });
  });

  // 13. Empty components list
  it('should show empty state when no components are available', async () => {
    const { element } = await setup({
      availableComponents: [],
    });
    const targets = getTargetButtons(element);
    expect(targets.length).toBe(0);

    const emptyState = element.querySelector('.scope-config__empty') as HTMLElement;
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent!.toLowerCase()).toContain('no valid targets');
  });

  // 14. No scope rule for service
  it('should treat all scopes as valid when no scope rule matches the service', async () => {
    const { element } = await setup({
      service: createServiceNode({ id: 'svc-1', providedIn: 'hierarchical' }),
      scopeRules: [{ serviceId: 'svc-other', allowedScopes: ['root'], defaultScope: 'root' }],
      availableComponents: [
        createComponentNode({ id: 'cmp-1', name: 'LoginComponent', requiredInjections: ['svc-1'] }),
      ],
    });
    // No rule for svc-1 => lenient => targets should be shown
    const targets = getTargetButtons(element);
    expect(targets.length).toBe(1);

    const warning = getWarning(element);
    expect(warning).toBeNull();
  });

  // 15. Scope rule with restricted scopes
  it('should trigger warning when scope rule restricts to root only', async () => {
    const { fixture, element } = await setup({
      service: createServiceNode({ id: 'svc-1', providedIn: 'root' }),
      scopeRules: [{ serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' }],
    });

    // Switch to 'component' which is NOT allowed
    const btns = getScopeButtons(element);
    const componentBtn = btns.find(b => b.textContent!.trim().toLowerCase() === 'component')!;
    componentBtn.click();
    fixture.detectChanges();

    const warning = getWarning(element);
    expect(warning).toBeTruthy();

    // Switch to 'hierarchical' which is also NOT allowed
    const hierarchicalBtn = btns.find(b => b.textContent!.trim().toLowerCase() === 'hierarchical')!;
    hierarchicalBtn.click();
    fixture.detectChanges();

    const warning2 = getWarning(element);
    expect(warning2).toBeTruthy();
  });

  // 16. Dynamic input changes
  it('should update when service input changes', async () => {
    const { fixture, host, element } = await setup({
      service: createServiceNode({ id: 'svc-1', name: 'AuthService', providedIn: 'root' }),
      availableComponents: [
        createComponentNode({ id: 'cmp-1', name: 'LoginComponent', requiredInjections: ['svc-1'] }),
        createComponentNode({ id: 'cmp-2', name: 'ProfileComponent', requiredInjections: ['svc-2'] }),
      ],
    });

    // Initial state: AuthService, 1 target
    const header = element.querySelector('.scope-config__header') as HTMLElement;
    expect(header.textContent).toContain('AuthService');
    expect(getTargetButtons(element).length).toBe(1);

    // Update to a different service
    host.service.set(createServiceNode({ id: 'svc-2', name: 'DataService', providedIn: 'component' }));
    fixture.detectChanges();
    await fixture.whenStable();

    const updatedHeader = element.querySelector('.scope-config__header') as HTMLElement;
    expect(updatedHeader.textContent).toContain('DataService');
    // Now svc-2 targets: cmp-2 requires svc-2
    expect(getTargetButtons(element).length).toBe(1);
    expect(getTargetButtons(element)[0].textContent).toContain('ProfileComponent');
  });
});
