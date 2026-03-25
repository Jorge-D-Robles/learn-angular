import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
} from '@angular/core';
import { Observable } from 'rxjs';

import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog';

export interface ConfirmDialogOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly variant?: 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private activeComponentRef: ComponentRef<ConfirmDialogComponent> | null =
    null;

  confirm(options: ConfirmDialogOptions): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      // 0. Dismiss any active dialog (concurrent invocation guard)
      if (this.activeComponentRef) {
        this.destroyDialog(this.activeComponentRef);
        this.activeComponentRef = null;
      }

      // 1. Create the component
      const componentRef = createComponent(ConfirmDialogComponent, {
        environmentInjector: this.injector,
      });
      this.activeComponentRef = componentRef;

      // 2. Set inputs
      componentRef.setInput('title', options.title);
      componentRef.setInput('message', options.message);
      componentRef.setInput('confirmLabel', options.confirmText ?? 'Confirm');
      componentRef.setInput('cancelLabel', options.cancelText ?? 'Cancel');
      componentRef.setInput('variant', options.variant ?? 'info');

      // 3. Teardown DECLARED BEFORE output subscriptions (hoisting fix)
      const teardown = () => {
        this.destroyDialog(componentRef);
        if (this.activeComponentRef === componentRef) {
          this.activeComponentRef = null;
        }
      };

      // 4. Wire up outputs (teardown already in scope)
      // NOTE: call teardown() BEFORE subscriber.next/complete to avoid double-destroy
      // if a subscriber's complete callback re-enters confirm()
      componentRef.instance.confirmed.subscribe(() => {
        teardown();
        subscriber.next(true);
        subscriber.complete();
      });

      componentRef.instance.cancelled.subscribe(() => {
        teardown();
        subscriber.next(false);
        subscriber.complete();
      });

      // 5. Attach to ApplicationRef and DOM
      this.appRef.attachView(componentRef.hostView);
      const domElement = (
        componentRef.hostView as EmbeddedViewRef<unknown>
      ).rootNodes[0] as HTMLElement;
      this.document.body.appendChild(domElement);

      // 6. Return teardown for unsubscribe
      return teardown;
    });
  }

  private destroyDialog(ref: ComponentRef<ConfirmDialogComponent>): void {
    const domElement = (ref.hostView as EmbeddedViewRef<unknown>)
      .rootNodes[0] as HTMLElement;
    this.appRef.detachView(ref.hostView);
    ref.destroy();
    domElement.remove(); // Explicit DOM removal — destroy() does NOT remove from body
  }
}
