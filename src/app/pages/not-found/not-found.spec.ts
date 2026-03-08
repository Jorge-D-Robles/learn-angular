import { provideRouter } from '@angular/router';
import { createComponent } from '../../../testing/test-utils';
import { NotFoundPage } from './not-found';

describe('NotFoundPage', () => {
  function setup() {
    return createComponent(NotFoundPage, {
      providers: [provideRouter([])],
    });
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render "Hull Breach" heading', async () => {
    const { element } = await setup();
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Hull Breach');
  });

  it('should display "Section Not Found" message', async () => {
    const { element } = await setup();
    const p = element.querySelector('.not-found__subtitle');
    expect(p?.textContent).toContain('Section Not Found');
  });

  it('should render the 404 error code', async () => {
    const { element } = await setup();
    const code = element.querySelector('.not-found__code');
    expect(code?.textContent).toContain('404');
  });

  it('should render a "Return to Dashboard" link', async () => {
    const { element } = await setup();
    const link = element.querySelector('a.not-found__action');
    expect(link?.textContent).toContain('Return to Dashboard');
  });

  it('should link to the dashboard (root path)', async () => {
    const { element } = await setup();
    const link = element.querySelector('a.not-found__action');
    expect(link?.getAttribute('href')).not.toBeNull();
  });

  it('should render the breach decoration', async () => {
    const { element } = await setup();
    const breach = element.querySelector('.not-found__breach');
    expect(breach).toBeTruthy();
  });

  it('should render the warning stripe decoration', async () => {
    const { element } = await setup();
    const stripe = element.querySelector('.not-found__warning-stripe');
    expect(stripe).toBeTruthy();
  });

  it('should render the corridor description', async () => {
    const { element } = await setup();
    const desc = element.querySelector('.not-found__description');
    expect(desc?.textContent).toContain('corridor');
  });
});
