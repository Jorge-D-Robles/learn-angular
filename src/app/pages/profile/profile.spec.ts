import { createComponent } from '../../../testing/test-utils';
import { ProfilePage } from './profile';

describe('ProfilePage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(ProfilePage);
    expect(component).toBeTruthy();
  });

  it('should render "Profile" heading', async () => {
    const { element } = await createComponent(ProfilePage);
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Profile');
  });
});
