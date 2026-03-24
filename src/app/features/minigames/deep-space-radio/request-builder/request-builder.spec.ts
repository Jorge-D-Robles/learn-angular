import { Component, signal } from '@angular/core';
import { createComponent } from '../../../../../testing/test-utils';
import type { HttpRequestConfig, MockEndpoint } from '../deep-space-radio.types';
import { DeepSpaceRadioRequestBuilderComponent } from './request-builder';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createMockEndpoint(overrides?: Partial<MockEndpoint>): MockEndpoint {
  return {
    url: '/api/data',
    method: 'GET',
    expectedHeaders: {},
    expectedBody: undefined,
    response: { status: 'ok' },
    errorResponse: { error: 'fail' },
    ...overrides,
  };
}

function createHttpRequestConfig(
  overrides?: Partial<HttpRequestConfig>,
): HttpRequestConfig {
  return {
    method: 'GET',
    url: '/api/data',
    headers: {},
    body: undefined,
    params: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-request-builder
      [availableEndpoints]="availableEndpoints()"
      [currentRequest]="currentRequest()"
      (requestChanged)="onRequestChanged($event)"
      (transmitRequested)="onTransmitRequested()"
    />
  `,
  imports: [DeepSpaceRadioRequestBuilderComponent],
})
class TestHost {
  availableEndpoints = signal<MockEndpoint[]>([]);
  currentRequest = signal<HttpRequestConfig | null>(null);
  onRequestChanged = vi.fn();
  onTransmitRequested = vi.fn();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRequestBuilder(el: HTMLElement): HTMLElement {
  return el.querySelector('app-request-builder') as HTMLElement;
}

function getMethodButtons(el: HTMLElement): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll('.request-builder__method-btn'));
}

function getActiveMethodButton(el: HTMLElement): HTMLButtonElement | null {
  return el.querySelector('.request-builder__method-btn--active');
}

function getUrlInput(el: HTMLElement): HTMLInputElement | null {
  return el.querySelector('.request-builder__url-input');
}

function getHeaderRows(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll('.request-builder__header-row'));
}

function getAddHeaderButton(el: HTMLElement): HTMLButtonElement | null {
  return el.querySelector('.request-builder__add-header-btn');
}

function getBodyTextarea(el: HTMLElement): HTMLTextAreaElement | null {
  return el.querySelector('.request-builder__body-textarea');
}

function getTransmitButton(el: HTMLElement): HTMLButtonElement | null {
  return el.querySelector('.request-builder__transmit-btn');
}

function getRemoveHeaderButtons(el: HTMLElement): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll('.request-builder__remove-header-btn'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeepSpaceRadioRequestBuilderComponent', () => {
  async function setup(overrides: {
    availableEndpoints?: MockEndpoint[];
    currentRequest?: HttpRequestConfig | null;
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.availableEndpoints) host.availableEndpoints.set(overrides.availableEndpoints);
    if (overrides.currentRequest !== undefined) host.currentRequest.set(overrides.currentRequest);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  // 1. Creation
  it('should create the component', async () => {
    const { element } = await setup({
      availableEndpoints: [createMockEndpoint()],
    });
    expect(getRequestBuilder(element)).toBeTruthy();
  });

  // 2. Method selector renders 4 buttons
  it('should render 4 method buttons (GET, POST, PUT, DELETE)', async () => {
    const { element } = await setup();
    const btns = getMethodButtons(element);
    expect(btns.length).toBe(4);

    const labels = btns.map(b => b.textContent!.trim());
    expect(labels).toContain('GET');
    expect(labels).toContain('POST');
    expect(labels).toContain('PUT');
    expect(labels).toContain('DELETE');
  });

  // 3. Default method highlighting
  it('should highlight GET as the default active method', async () => {
    const { element } = await setup();
    const activeBtn = getActiveMethodButton(element);
    expect(activeBtn).toBeTruthy();
    expect(activeBtn!.textContent!.trim()).toBe('GET');
  });

  // 4. Method selection changes active state
  it('should update active method when a different method button is clicked', async () => {
    const { fixture, element } = await setup();
    const btns = getMethodButtons(element);
    const postBtn = btns.find(b => b.textContent!.trim() === 'POST')!;

    postBtn.click();
    fixture.detectChanges();

    const activeBtn = getActiveMethodButton(element);
    expect(activeBtn!.textContent!.trim()).toBe('POST');
  });

  // 5. Method selection emits requestChanged
  it('should emit requestChanged when method is changed', async () => {
    const { fixture, host, element } = await setup();
    const btns = getMethodButtons(element);
    const deleteBtn = btns.find(b => b.textContent!.trim() === 'DELETE')!;

    deleteBtn.click();
    fixture.detectChanges();

    expect(host.onRequestChanged).toHaveBeenCalled();
    const emitted = host.onRequestChanged.mock.calls[host.onRequestChanged.mock.calls.length - 1][0] as HttpRequestConfig;
    expect(emitted.method).toBe('DELETE');
  });

  // 6. URL input renders
  it('should render a URL text input', async () => {
    const { element } = await setup();
    const urlInput = getUrlInput(element);
    expect(urlInput).toBeTruthy();
    expect(urlInput!.type).toBe('text');
  });

  // 7. URL input emits requestChanged on input
  it('should emit requestChanged when URL is typed', async () => {
    const { fixture, host, element } = await setup();
    const urlInput = getUrlInput(element)!;

    urlInput.value = '/api/users';
    urlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.onRequestChanged).toHaveBeenCalled();
    const emitted = host.onRequestChanged.mock.calls[host.onRequestChanged.mock.calls.length - 1][0] as HttpRequestConfig;
    expect(emitted.url).toBe('/api/users');
  });

  // 8. Headers: add header button exists
  it('should render an add-header button', async () => {
    const { element } = await setup();
    const addBtn = getAddHeaderButton(element);
    expect(addBtn).toBeTruthy();
  });

  // 9. Headers: adding a header row
  it('should add a header row when add-header is clicked', async () => {
    const { fixture, element } = await setup();
    const addBtn = getAddHeaderButton(element)!;

    expect(getHeaderRows(element).length).toBe(0);

    addBtn.click();
    fixture.detectChanges();

    expect(getHeaderRows(element).length).toBe(1);
  });

  // 10. Headers: removing a header row
  it('should remove a header row when remove button is clicked', async () => {
    const { fixture, element } = await setup();
    const addBtn = getAddHeaderButton(element)!;

    addBtn.click();
    fixture.detectChanges();
    expect(getHeaderRows(element).length).toBe(1);

    const removeBtn = getRemoveHeaderButtons(element)[0];
    removeBtn.click();
    fixture.detectChanges();

    expect(getHeaderRows(element).length).toBe(0);
  });

  // 11. Headers: editing emits requestChanged
  it('should emit requestChanged when a header key is edited', async () => {
    const { fixture, host, element } = await setup();
    const addBtn = getAddHeaderButton(element)!;

    addBtn.click();
    fixture.detectChanges();
    host.onRequestChanged.mockClear();

    const keyInput = element.querySelector('.request-builder__header-key') as HTMLInputElement;
    keyInput.value = 'Authorization';
    keyInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.onRequestChanged).toHaveBeenCalled();
  });

  // 12. Body textarea visible for POST
  it('should show body textarea when method is POST', async () => {
    const { fixture, element } = await setup();
    const btns = getMethodButtons(element);
    const postBtn = btns.find(b => b.textContent!.trim() === 'POST')!;

    postBtn.click();
    fixture.detectChanges();

    const bodyArea = getBodyTextarea(element);
    expect(bodyArea).toBeTruthy();
  });

  // 13. Body textarea visible for PUT
  it('should show body textarea when method is PUT', async () => {
    const { fixture, element } = await setup();
    const btns = getMethodButtons(element);
    const putBtn = btns.find(b => b.textContent!.trim() === 'PUT')!;

    putBtn.click();
    fixture.detectChanges();

    const bodyArea = getBodyTextarea(element);
    expect(bodyArea).toBeTruthy();
  });

  // 14. Body textarea hidden for GET
  it('should hide body textarea when method is GET', async () => {
    const { element } = await setup();
    const bodyArea = getBodyTextarea(element);
    expect(bodyArea).toBeNull();
  });

  // 15. Transmit button emits transmitRequested
  it('should emit transmitRequested when Transmit button is clicked', async () => {
    const { fixture, host, element } = await setup();
    const transmitBtn = getTransmitButton(element)!;
    expect(transmitBtn).toBeTruthy();

    transmitBtn.click();
    fixture.detectChanges();

    expect(host.onTransmitRequested).toHaveBeenCalled();
  });

  // 16. Syncs from currentRequest input
  it('should sync editing state from currentRequest input', async () => {
    const request = createHttpRequestConfig({
      method: 'PUT',
      url: '/api/items/42',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"test"}',
    });

    const { element } = await setup({ currentRequest: request });

    const activeBtn = getActiveMethodButton(element);
    expect(activeBtn!.textContent!.trim()).toBe('PUT');

    const urlInput = getUrlInput(element)!;
    expect(urlInput.value).toBe('/api/items/42');

    const headerRows = getHeaderRows(element);
    expect(headerRows.length).toBe(1);

    const bodyArea = getBodyTextarea(element);
    expect(bodyArea).toBeTruthy();
    expect(bodyArea!.value).toBe('{"name":"test"}');
  });
});
