import { createComponent } from '../../../testing/test-utils';
import { MinigameHubPage } from './minigame-hub';

describe('MinigameHubPage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(MinigameHubPage);
    expect(component).toBeTruthy();
  });

  it('should render "Minigame Hub" heading', async () => {
    const { element } = await createComponent(MinigameHubPage);
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Minigame Hub');
  });
});
