import {
  Directive,
  DestroyRef,
  ElementRef,
  HostListener,
  Renderer2,
  inject,
  input,
} from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

let nextId = 0;

@Directive({
  selector: '[nxTooltip]',
})
export class TooltipDirective {
  private readonly _elRef = inject(ElementRef<HTMLElement>);
  private readonly _renderer = inject(Renderer2);
  private readonly _destroyRef = inject(DestroyRef);

  readonly nxTooltip = input.required<string>();
  readonly nxTooltipPosition = input<TooltipPosition>('top');

  private _tooltipEl: HTMLElement | null = null;
  private _showTimer: ReturnType<typeof setTimeout> | null = null;
  private _tooltipId = `nx-tooltip-${nextId++}`;

  constructor() {
    this._destroyRef.onDestroy(() => this._hide());
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this._scheduleShow();
  }

  @HostListener('focus')
  onFocus(): void {
    this._scheduleShow();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this._hide();
  }

  @HostListener('blur')
  onBlur(): void {
    this._hide();
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this._hide();
  }

  private _scheduleShow(): void {
    if (this._showTimer !== null) {
      clearTimeout(this._showTimer);
    }
    this._showTimer = setTimeout(() => this._show(), 200);
  }

  private _show(): void {
    if (this._tooltipEl) {
      return;
    }

    if (this.nxTooltip().trim() === '') {
      return;
    }

    const position = this.nxTooltipPosition();
    const el = this._renderer.createElement('div') as HTMLElement;

    this._renderer.setAttribute(el, 'role', 'tooltip');
    this._renderer.setAttribute(el, 'id', this._tooltipId);
    el.textContent = this.nxTooltip();

    this._renderer.addClass(el, 'nx-tooltip');
    this._renderer.addClass(el, `nx-tooltip--${position}`);

    this._renderer.appendChild(document.body, el);

    const hostRect = this._elRef.nativeElement.getBoundingClientRect();
    const gap = 8;
    let top: number;
    let left: number;

    switch (position) {
      case 'top':
        top = hostRect.top - gap;
        left = hostRect.left + hostRect.width / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + hostRect.width / 2;
        break;
      case 'left':
        top = hostRect.top + hostRect.height / 2;
        left = hostRect.left - gap;
        break;
      case 'right':
        top = hostRect.top + hostRect.height / 2;
        left = hostRect.right + gap;
        break;
    }

    this._renderer.setStyle(el, 'top', `${top}px`);
    this._renderer.setStyle(el, 'left', `${left}px`);

    this._renderer.setAttribute(
      this._elRef.nativeElement,
      'aria-describedby',
      this._tooltipId,
    );

    this._tooltipEl = el;
  }

  private _hide(): void {
    if (this._showTimer !== null) {
      clearTimeout(this._showTimer);
      this._showTimer = null;
    }

    if (this._tooltipEl) {
      this._renderer.removeChild(document.body, this._tooltipEl);
      this._tooltipEl = null;
    }

    this._renderer.removeAttribute(
      this._elRef.nativeElement,
      'aria-describedby',
    );
  }
}
