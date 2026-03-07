import { createComponent } from '../../../testing/test-utils';
import { SettingsPage } from './settings';

describe('SettingsPage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(SettingsPage);
    expect(component).toBeTruthy();
  });

  it('should render "Settings" heading', async () => {
    const { element } = await createComponent(SettingsPage);
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Settings');
  });
});
