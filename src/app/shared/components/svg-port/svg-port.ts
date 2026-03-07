import { Component, computed, input, output } from '@angular/core';

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
export class SvgPortComponent {
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

  onActivate(event?: Event): void {
    event?.preventDefault();
    this.activated.emit(this.portId());
  }
}
