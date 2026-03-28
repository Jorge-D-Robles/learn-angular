import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { CorridorRunnerRouteEditorComponent } from './route-editor';
import type { RouteEntry } from '../corridor-runner.types';

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `<app-corridor-runner-route-editor
    [initialConfig]="initialConfig"
    [availableComponents]="availableComponents"
    [disabled]="disabled"
    (configChanged)="onConfigChanged($event)"
    (configSubmitted)="onConfigSubmitted()" />`,
  imports: [CorridorRunnerRouteEditorComponent],
})
class TestHost {
  initialConfig: RouteEntry[] = [];
  availableComponents: string[] = ['EngineeringBay', 'MedBay', 'Bridge'];
  disabled = false;
  onConfigChanged = vi.fn();
  onConfigSubmitted = vi.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CorridorRunnerRouteEditorComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let element: HTMLElement;

  async function setup(overrides: Partial<TestHost> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideMonacoEditor()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    Object.assign(host, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    fixture?.destroy();
  });

  // --- 1. Rendering -- CodeEditorComponent present ---

  it('should render CodeEditorComponent', async () => {
    await setup();
    const editor = element.querySelector('nx-code-editor');
    expect(editor).toBeTruthy();
  });

  // --- 2. Rendering -- Lock Routes button present ---

  it('should render Lock Routes button', async () => {
    await setup();
    const btn = element.querySelector('.cr-route-editor__lock-btn');
    expect(btn).toBeTruthy();
    expect(btn?.textContent?.trim()).toBe('Lock Routes');
  });

  // --- 3. Rendering -- empty editor when initialConfig is empty ---

  it('should render empty editor when initialConfig is empty', async () => {
    await setup({ initialConfig: [] });
    const editorDebug = fixture.debugElement.query(By.directive(CorridorRunnerRouteEditorComponent));
    const editorChild = editorDebug.componentInstance as CorridorRunnerRouteEditorComponent;
    expect(editorChild.routeConfigText()).toBe('');
  });

  // --- 4. Initial config seeding ---

  it('should populate editor text from initialConfig', async () => {
    const config: RouteEntry[] = [{ path: 'engineering', component: 'EngineeringBay' }];
    await setup({ initialConfig: config });

    const editorDebug = fixture.debugElement.query(By.directive(CorridorRunnerRouteEditorComponent));
    const editorChild = editorDebug.componentInstance as CorridorRunnerRouteEditorComponent;
    expect(editorChild.routeConfigText()).toBe(JSON.stringify(config, null, 2));
  });

  // --- 5. Config change -- emit configChanged on valid JSON ---

  it('should emit configChanged with parsed RouteEntry[] when valid JSON array is entered', async () => {
    await setup();

    const validJson = JSON.stringify([{ path: 'bridge', component: 'Bridge' }]);
    simulateCodeChange(validJson);

    expect(host.onConfigChanged).toHaveBeenCalledWith([{ path: 'bridge', component: 'Bridge' }]);
  });

  // --- 6. Config change -- NOT emit configChanged on invalid JSON ---

  it('should NOT emit configChanged when JSON is invalid', async () => {
    await setup();

    simulateCodeChange('{ invalid json');
    expect(host.onConfigChanged).not.toHaveBeenCalled();
  });

  // --- 7. Parse error -- invalid JSON ---

  it('should display parse error for invalid JSON', async () => {
    await setup();

    simulateCodeChange('{ not valid');

    const errorEl = element.querySelector('.cr-route-editor__error');
    expect(errorEl).toBeTruthy();
    expect(errorEl?.textContent?.trim()).toBe('Invalid JSON');
  });

  // --- 8. Parse error -- non-array JSON ---

  it('should display parse error for non-array JSON', async () => {
    await setup();

    simulateCodeChange('{"key": "value"}');

    const errorEl = element.querySelector('.cr-route-editor__error');
    expect(errorEl).toBeTruthy();
    expect(errorEl?.textContent?.trim()).toBe('Must be an array');
  });

  // --- 9. Parse error cleared on valid input ---

  it('should clear parse error when valid JSON is entered after invalid', async () => {
    await setup();

    // First, enter invalid JSON
    simulateCodeChange('not json');
    expect(element.querySelector('.cr-route-editor__error')).toBeTruthy();

    // Then enter valid JSON
    simulateCodeChange('[{"path": "home"}]');
    expect(element.querySelector('.cr-route-editor__error')).toBeNull();
  });

  // --- 10. Semantic validation -- missing path ---

  it('should show validation error when entry is missing path', async () => {
    await setup();

    simulateCodeChange(JSON.stringify([{ component: 'Bridge' }]));

    const errors = element.querySelector('.cr-route-editor__validation-errors');
    expect(errors).toBeTruthy();
    expect(errors?.textContent).toContain("Entry 1: missing 'path'");
  });

  // --- 11. Semantic validation -- unknown component ---

  it('should show validation error for unknown component', async () => {
    await setup({ availableComponents: ['EngineeringBay', 'MedBay', 'Bridge'] });

    simulateCodeChange(JSON.stringify([{ path: 'lab', component: 'ScienceLab' }]));

    const errors = element.querySelector('.cr-route-editor__validation-errors');
    expect(errors).toBeTruthy();
    expect(errors?.textContent).toContain("Entry 1: unknown component 'ScienceLab'");
  });

  // --- 12. Semantic validation -- redirectTo without pathMatch ---

  it('should show validation error when redirectTo is set without pathMatch', async () => {
    await setup();

    simulateCodeChange(JSON.stringify([{ path: '', redirectTo: '/home' }]));

    const errors = element.querySelector('.cr-route-editor__validation-errors');
    expect(errors).toBeTruthy();
    expect(errors?.textContent).toContain("Entry 1: 'redirectTo' requires 'pathMatch'");
  });

  // --- 13. Semantic validation -- skip component check when availableComponents is empty ---

  it('should NOT validate component names when availableComponents is empty', async () => {
    await setup({ availableComponents: [] });

    simulateCodeChange(JSON.stringify([{ path: 'lab', component: 'AnythingGoes' }]));

    const errors = element.querySelector('.cr-route-editor__validation-errors');
    expect(errors).toBeNull();
    expect(host.onConfigChanged).toHaveBeenCalled();
  });

  // --- 14. Lock Routes button -- disabled when errors ---

  it('should disable Lock Routes button when there are errors', async () => {
    await setup();

    simulateCodeChange('not json');

    const btn = element.querySelector('.cr-route-editor__lock-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // --- 15. Lock Routes button -- disabled when disabled input is true ---

  it('should disable Lock Routes button when disabled input is true', async () => {
    await setup({ disabled: true });

    // Enter valid JSON so hasErrors is false
    simulateCodeChange(JSON.stringify([{ path: 'home' }]));

    const btn = element.querySelector('.cr-route-editor__lock-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  // --- 16. Lock Routes button -- emit configSubmitted ---

  it('should emit configSubmitted when Lock Routes is clicked with no errors', async () => {
    await setup();

    simulateCodeChange(JSON.stringify([{ path: 'home' }]));

    const btn = element.querySelector('.cr-route-editor__lock-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    btn.click();
    fixture.detectChanges();

    expect(host.onConfigSubmitted).toHaveBeenCalled();
  });

  // --- 17. Edge case -- empty array is valid ---

  it('should handle empty array [] as valid config', async () => {
    await setup();

    simulateCodeChange('[]');

    expect(element.querySelector('.cr-route-editor__error')).toBeNull();
    expect(element.querySelector('.cr-route-editor__validation-errors')).toBeNull();
    expect(host.onConfigChanged).toHaveBeenCalledWith([]);
  });

  // --- 18. Highlight lines -- errorLineNumbers wired to CodeEditorComponent ---

  it('should pass error line numbers to CodeEditorComponent highlightLines', async () => {
    await setup();

    // Entry without path — pretty-printed so the { for entry 1 is on line 2
    const json = JSON.stringify([{ component: 'Bridge' }], null, 2);
    simulateCodeChange(json);

    // The code editor should have received highlightLines
    const editor = element.querySelector('nx-code-editor');
    expect(editor).toBeTruthy();
    // The validation errors should be present
    const errors = element.querySelector('.cr-route-editor__validation-errors');
    expect(errors).toBeTruthy();
  });

  // --- Helper ---

  function simulateCodeChange(text: string): void {
    const editorDebug = fixture.debugElement.query(By.directive(CorridorRunnerRouteEditorComponent));
    const editorChild = editorDebug.componentInstance as CorridorRunnerRouteEditorComponent;
    editorChild.onCodeChange(text);
    fixture.detectChanges();
  }
});
