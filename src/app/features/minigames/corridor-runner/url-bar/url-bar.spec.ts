import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { CorridorRunnerUrlBarComponent } from './url-bar';

describe('CorridorRunnerUrlBarComponent', () => {
  let fixture: ComponentFixture<CorridorRunnerUrlBarComponent>;
  let component: CorridorRunnerUrlBarComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CorridorRunnerUrlBarComponent],
    });

    fixture = TestBed.createComponent(CorridorRunnerUrlBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // =========================================================================
  // 1. Basic rendering
  // =========================================================================

  it('should create successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should render the nexus:// prefix', () => {
    const prefix = fixture.nativeElement.querySelector('.cr-url-bar__prefix');
    expect(prefix).toBeTruthy();
    expect(prefix.textContent).toContain('nexus://');
  });

  it('should render back and forward placeholder buttons', () => {
    const navBtns = fixture.nativeElement.querySelectorAll('.cr-url-bar__nav-btn');
    expect(navBtns.length).toBe(2);
    expect(navBtns[0].disabled).toBe(true);
    expect(navBtns[1].disabled).toBe(true);
  });

  it('should use monospace font family via cr-url-bar class', () => {
    const urlBar = fixture.nativeElement.querySelector('.cr-url-bar');
    expect(urlBar).toBeTruthy();
  });

  // =========================================================================
  // 2. URL display
  // =========================================================================

  it('should display default "/" when no URL is set', () => {
    expect(component.displayUrl()).toBe('/');
  });

  it('should display currentUrl input value', () => {
    fixture.componentRef.setInput('currentUrl', '/engineering');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.cr-url-bar__input') as HTMLInputElement;
    expect(input.value).toBe('/engineering');
  });

  // =========================================================================
  // 3. Hull breach indicator
  // =========================================================================

  it('should not show hull breach indicator when isHullBreach is false', () => {
    const indicator = fixture.nativeElement.querySelector('.cr-url-bar__breach-indicator');
    expect(indicator).toBeFalsy();
  });

  it('should show hull breach indicator when isHullBreach is true', () => {
    fixture.componentRef.setInput('isHullBreach', true);
    fixture.detectChanges();

    const indicator = fixture.nativeElement.querySelector('.cr-url-bar__breach-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toContain('404 - Hull Breach');
  });

  it('should add hull breach CSS class when isHullBreach is true', () => {
    fixture.componentRef.setInput('isHullBreach', true);
    fixture.detectChanges();

    const urlBar = fixture.nativeElement.querySelector('.cr-url-bar');
    expect(urlBar.classList.contains('cr-url-bar--hull-breach')).toBe(true);
  });

  // =========================================================================
  // 4. Resolved component breadcrumb
  // =========================================================================

  it('should show resolved component when not hull breach', () => {
    fixture.componentRef.setInput('resolvedComponent', 'EngineeringBay');
    fixture.detectChanges();

    const resolved = fixture.nativeElement.querySelector('.cr-url-bar__resolved');
    expect(resolved).toBeTruthy();
    expect(resolved.textContent).toContain('EngineeringBay');
  });

  it('should not show resolved component when isHullBreach is true', () => {
    fixture.componentRef.setInput('resolvedComponent', 'EngineeringBay');
    fixture.componentRef.setInput('isHullBreach', true);
    fixture.detectChanges();

    const resolved = fixture.nativeElement.querySelector('.cr-url-bar__resolved');
    expect(resolved).toBeFalsy();
  });

  it('should not show resolved component when resolvedComponent is null', () => {
    fixture.componentRef.setInput('resolvedComponent', null);
    fixture.detectChanges();

    const resolved = fixture.nativeElement.querySelector('.cr-url-bar__resolved');
    expect(resolved).toBeFalsy();
  });

  // =========================================================================
  // 5. Editable input
  // =========================================================================

  it('should allow typing a URL in the input', () => {
    const input = fixture.nativeElement.querySelector('.cr-url-bar__input') as HTMLInputElement;
    input.value = '/bridge';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(component.displayUrl()).toBe('/bridge');
  });

  // =========================================================================
  // 6. Submit on Enter key
  // =========================================================================

  it('should emit urlSubmitted on Enter key press', () => {
    const emitted: string[] = [];
    component.urlSubmitted.subscribe((url: string) => emitted.push(url));

    const input = fixture.nativeElement.querySelector('.cr-url-bar__input') as HTMLInputElement;

    // Type a URL
    input.value = '/bridge';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    // Press Enter
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0]).toBe('/bridge');
  });

  it('should emit currentUrl when Enter is pressed without editing', () => {
    const emitted: string[] = [];
    component.urlSubmitted.subscribe((url: string) => emitted.push(url));

    fixture.componentRef.setInput('currentUrl', '/cargo');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.cr-url-bar__input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0]).toBe('/cargo');
  });

  it('should clear edited state after submit', () => {
    const input = fixture.nativeElement.querySelector('.cr-url-bar__input') as HTMLInputElement;

    // Type a URL
    input.value = '/bridge';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Submit
    component.onSubmit();

    // Edited state should be cleared, falling back to currentUrl
    fixture.componentRef.setInput('currentUrl', '/result');
    fixture.detectChanges();

    expect(component.displayUrl()).toBe('/result');
  });
});
