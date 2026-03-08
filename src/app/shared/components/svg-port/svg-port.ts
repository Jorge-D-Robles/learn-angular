import { Component, computed, effect, inject, input, OnDestroy, output } from '@angular/core';
import { WireDrawService } from '../../../core/minigame/wire-draw.service';

@Component({
  selector: '[nx-svg-port]',
  template: `
    <!-- Active state: pulsing outer ring -->
    @if (isActive()) {
      <svg:circle
        r="18"
        class="svg-port__active-ring"
        [attr.stroke]="color()"
        fill="none"
        stroke-width="2"
        stroke-dasharray="4 3" />
    }

    <!-- Focus ring (visible on keyboard focus) -->
    <svg:circle
      r="16"
      class="svg-port__focus-ring"
      fill="none"
      stroke="white"
      stroke-width="1.5"
      stroke-dasharray="3 2" />

    <!-- Main port circle -->
    <svg:circle
      r="12"
      class="svg-port__circle"
      [attr.fill]="color()"
      [attr.stroke]="color()"
      [attr.fill-opacity]="isConnected() ? 0.8 : 0.3"
      stroke-width="2" />

    <!-- Connected indicator dot -->
    @if (isConnected()) {
      <svg:circle
        r="4"
        class="svg-port__connected-dot"
        fill="white"
        opacity="0.9" />
    }

    <!-- Optional label -->
    @if (label()) {
      <svg:text
        dy="28"
        text-anchor="middle"
        class="svg-port__label"
        [attr.fill]="color()">
        {{ label() }}
      </svg:text>
    }
  `,
  styleUrl: './svg-port.scss',
  host: {
    '[attr.transform]': 'translateTransform()',
    '[attr.tabindex]': '"0"',
    '[attr.role]': '"button"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-port-id]': 'portId()',
    '[attr.data-port-type]': 'type()',
    '[class.svg-port--active]': 'isActive()',
    '[class.svg-port--connected]': 'isConnected()',
    '(click)': 'onActivate($event)',
    '(keydown.enter)': 'onActivate($event)',
    '(keydown.space)': 'onActivate($event)',
  },
})
export class SvgPortComponent implements OnDestroy {
  private readonly wireDrawService = inject(WireDrawService, { optional: true });

  readonly portId = input.required<string>();
  readonly x = input(0);
  readonly y = input(0);
  readonly color = input('#3B82F6');
  readonly label = input('');
  readonly type = input<'source' | 'target'>('source');
  readonly isActive = input(false);
  readonly isConnected = input(false);

  readonly activated = output<string>();

  readonly translateTransform = computed(
    () => `translate(${this.x()}, ${this.y()})`,
  );

  readonly ariaLabel = computed(() => {
    const lbl = this.label() || this.portId();
    const state = this.isConnected() ? ', connected' : '';
    const active = this.isActive() ? ', active' : '';
    return `${this.type()} port: ${lbl}${state}${active}`;
  });

  constructor() {
    if (this.wireDrawService) {
      const service = this.wireDrawService;
      effect(() => {
        service.registerPort({
          id: this.portId(),
          type: this.type(),
          x: this.x(),
          y: this.y(),
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.wireDrawService?.unregisterPort(this.portId());
  }

  onActivate(event?: Event): void {
    event?.preventDefault();
    this.activated.emit(this.portId());

    if (this.wireDrawService) {
      const phase = this.wireDrawService.phase();
      if (phase === 'idle' && this.type() === 'source') {
        this.wireDrawService.startWire(this.portId());
      } else if (phase === 'drawing' && this.type() === 'target') {
        this.wireDrawService.completeWire(this.portId());
      }
    }
  }
}
