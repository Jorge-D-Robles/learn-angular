import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { StationCardComponent } from './station-card';

@Component({
  template: `<nx-station-card [cardTitle]="title" [accentColor]="accent"><p>Test content</p></nx-station-card>`,
  imports: [StationCardComponent],
})
class TestHost {
  title = '';
  accent = 'var(--nx-color-reactor-blue)';
}

describe('StationCardComponent', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(TestHost);
    expect(component).toBeTruthy();
  });

  it('should render projected content in the body', async () => {
    const { element } = await createComponent(TestHost);
    const body = element.querySelector('.station-card__body p');
    expect(body?.textContent).toContain('Test content');
  });

  it('should render card title when input is provided', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.title = 'Systems Status';
    fixture.detectChanges();
    await fixture.whenStable();
    const title = element.querySelector('.station-card__title');
    expect(title?.textContent).toBe('Systems Status');
  });

  it('should not render header when cardTitle is empty', async () => {
    const { element } = await createComponent(TestHost);
    const header = element.querySelector('.station-card__header');
    expect(header).toBeNull();
  });

  it('should apply custom accent color as CSS variable', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.accent = 'var(--nx-color-sensor-green)';
    fixture.detectChanges();
    await fixture.whenStable();
    const card = element.querySelector('nx-station-card') as HTMLElement;
    expect(card.style.getPropertyValue('--card-accent').trim()).toBe(
      'var(--nx-color-sensor-green)',
    );
  });

  it('should default accent color to Reactor Blue', async () => {
    const { element } = await createComponent(TestHost);
    const card = element.querySelector('nx-station-card') as HTMLElement;
    expect(card.style.getPropertyValue('--card-accent').trim()).toBe(
      'var(--nx-color-reactor-blue)',
    );
  });
});
