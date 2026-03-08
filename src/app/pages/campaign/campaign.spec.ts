import { createComponent } from '../../../testing/test-utils';
import { CampaignPage } from './campaign';

describe('CampaignPage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(CampaignPage);
    expect(component).toBeTruthy();
  });

  it('should render "Campaign" heading', async () => {
    const { element } = await createComponent(CampaignPage);
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Campaign');
  });
});
