import { createComponent } from '../../../testing/test-utils';
import { NotFoundPage } from './not-found';

describe('NotFoundPage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(NotFoundPage);
    expect(component).toBeTruthy();
  });

  it('should render "Hull Breach" heading', async () => {
    const { element } = await createComponent(NotFoundPage);
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Hull Breach');
  });

  it('should display "Section Not Found" message', async () => {
    const { element } = await createComponent(NotFoundPage);
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Section Not Found');
  });
});
