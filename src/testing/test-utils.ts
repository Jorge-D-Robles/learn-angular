import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Type, Provider, EnvironmentProviders } from '@angular/core';

/**
 * Options for createComponent helper.
 */
export interface CreateComponentOptions {
  imports?: Type<unknown>[];
  providers?: (Provider | EnvironmentProviders)[];
  /** Whether to call detectChanges after creation. Defaults to true. */
  detectChanges?: boolean;
}

/**
 * Shorthand for TestBed.configureTestingModule + createComponent.
 * Reduces boilerplate in component tests.
 *
 * Usage:
 *   const { fixture, component, element } = await createComponent(MyComponent);
 */
export async function createComponent<T>(
  component: Type<T>,
  options: CreateComponentOptions = {},
): Promise<{
  fixture: ComponentFixture<T>;
  component: T;
  element: HTMLElement;
}> {
  const { imports = [], providers = [], detectChanges = true } = options;

  await TestBed.configureTestingModule({
    imports: [component, ...imports],
    providers,
  }).compileComponents();

  const fixture = TestBed.createComponent(component);

  if (detectChanges) {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

/**
 * Creates a mock provider using the given overrides as `useValue`.
 * NOTE: Only methods/properties in `overrides` will exist on the injected value.
 * Callers must stub ALL methods their component calls, or they will get `undefined`.
 *
 * Usage:
 *   const mockRouter = getMockProvider(Router, { navigate: vi.fn() });
 *   const { component } = await createComponent(MyComponent, {
 *     providers: [mockRouter],
 *   });
 */
export function getMockProvider<T>(
  token: Type<T>,
  overrides: Partial<Record<keyof T, unknown>> = {},
): Provider {
  return {
    provide: token,
    useValue: overrides,
  };
}

// Re-export commonly used testing imports for single-import convenience
export { TestBed, ComponentFixture } from '@angular/core/testing';
export { fakeAsync, tick, flush } from '@angular/core/testing';
