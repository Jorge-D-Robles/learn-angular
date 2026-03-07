import { createComponent } from '../../../testing/test-utils';
import { DashboardPage } from './dashboard';

describe('DashboardPage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(DashboardPage);
    expect(component).toBeTruthy();
  });

  it('should render "Station Dashboard" heading', async () => {
    const { element } = await createComponent(DashboardPage);
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Station Dashboard');
  });
});
