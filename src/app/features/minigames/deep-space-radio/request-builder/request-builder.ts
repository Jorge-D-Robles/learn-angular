import { Component, effect, input, output, signal } from '@angular/core';
import type { HttpMethod, HttpRequestConfig, MockEndpoint } from '../deep-space-radio.types';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

@Component({
  selector: 'app-request-builder',
  template: `
    <div class="request-builder__methods">
      @for (method of httpMethods; track method) {
        <button
          class="request-builder__method-btn"
          [class.request-builder__method-btn--active]="editingMethod() === method"
          (click)="selectMethod(method)"
        >
          {{ method }}
        </button>
      }
    </div>
    <div class="request-builder__url">
      <input
        type="text"
        class="request-builder__url-input"
        placeholder="Enter URL..."
        [value]="editingUrl()"
        (input)="onUrlInput($event)"
      />
    </div>
    <div class="request-builder__headers">
      <div class="request-builder__headers-label">Headers</div>
      @for (header of editingHeaders(); track $index) {
        <div class="request-builder__header-row">
          <input
            type="text"
            class="request-builder__header-key"
            placeholder="Key"
            [value]="header.key"
            (input)="onHeaderKeyInput($index, $event)"
          />
          <input
            type="text"
            class="request-builder__header-value"
            placeholder="Value"
            [value]="header.value"
            (input)="onHeaderValueInput($index, $event)"
          />
          <button
            class="request-builder__remove-header-btn"
            (click)="removeHeader($index)"
          >
            &times;
          </button>
        </div>
      }
      <button class="request-builder__add-header-btn" (click)="addHeader()">
        + Add Header
      </button>
    </div>
    @if (showBody()) {
      <div class="request-builder__body">
        <div class="request-builder__body-label">Body</div>
        <textarea
          class="request-builder__body-textarea"
          placeholder="Request body..."
          [value]="editingBody()"
          (input)="onBodyInput($event)"
        ></textarea>
      </div>
    }
    <div class="request-builder__actions">
      <button class="request-builder__transmit-btn" (click)="onTransmit()">
        Transmit
      </button>
    </div>
  `,
  styleUrl: './request-builder.scss',
})
export class DeepSpaceRadioRequestBuilderComponent {
  // Inputs
  readonly availableEndpoints = input.required<MockEndpoint[]>();
  readonly currentRequest = input.required<HttpRequestConfig | null>();

  // Outputs
  readonly requestChanged = output<HttpRequestConfig>();
  readonly transmitRequested = output<void>();

  // Internal editing state
  readonly editingMethod = signal<HttpMethod>('GET');
  readonly editingUrl = signal('');
  readonly editingHeaders = signal<{ key: string; value: string }[]>([]);
  readonly editingBody = signal('');

  // Constants exposed to template
  readonly httpMethods = HTTP_METHODS;

  // Computed: whether body should be visible
  readonly showBody = () => {
    const method = this.editingMethod();
    return method === 'POST' || method === 'PUT';
  };

  // Sync from currentRequest input
  constructor() {
    effect(() => {
      const request = this.currentRequest();
      if (request) {
        this.editingMethod.set(request.method);
        this.editingUrl.set(request.url);
        this.editingHeaders.set(
          Object.entries(request.headers).map(([key, value]) => ({ key, value })),
        );
        this.editingBody.set(
          request.body != null ? String(request.body) : '',
        );
      }
    });
  }

  selectMethod(method: HttpMethod): void {
    this.editingMethod.set(method);
    this.emitRequest();
  }

  onUrlInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingUrl.set(input.value);
    this.emitRequest();
  }

  addHeader(): void {
    this.editingHeaders.update(h => [...h, { key: '', value: '' }]);
  }

  removeHeader(index: number): void {
    this.editingHeaders.update(h => h.filter((_, i) => i !== index));
    this.emitRequest();
  }

  onHeaderKeyInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingHeaders.update(h =>
      h.map((header, i) =>
        i === index ? { ...header, key: input.value } : header,
      ),
    );
    this.emitRequest();
  }

  onHeaderValueInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingHeaders.update(h =>
      h.map((header, i) =>
        i === index ? { ...header, value: input.value } : header,
      ),
    );
    this.emitRequest();
  }

  onBodyInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.editingBody.set(textarea.value);
    this.emitRequest();
  }

  onTransmit(): void {
    this.transmitRequested.emit();
  }

  private emitRequest(): void {
    const headers: Record<string, string> = {};
    for (const h of this.editingHeaders()) {
      if (h.key) {
        headers[h.key] = h.value;
      }
    }
    this.requestChanged.emit({
      method: this.editingMethod(),
      url: this.editingUrl(),
      headers,
      body: this.showBody() ? this.editingBody() : undefined,
      params: {},
    });
  }
}
