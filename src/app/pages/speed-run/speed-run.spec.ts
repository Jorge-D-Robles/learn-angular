import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { createComponent } from '../../../testing/test-utils';
import { SpeedRunPage } from './speed-run';
import { PlayMode } from '../../core/minigame/minigame.types';

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

describe('SpeedRunPage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(SpeedRunPage, {
      providers: [mockActivatedRoute({ gameId: 'wire-protocol' })],
    });
    expect(component).toBeTruthy();
  });

  it('should render "Speed Run" heading', async () => {
    const { element } = await createComponent(SpeedRunPage, {
      providers: [mockActivatedRoute({ gameId: 'wire-protocol' })],
    });
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Speed Run');
  });

  it('should display the gameId from route params', async () => {
    const { element } = await createComponent(SpeedRunPage, {
      providers: [mockActivatedRoute({ gameId: 'module-assembly' })],
    });
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Game: module-assembly');
  });

  it('should display empty gameId when param is missing', async () => {
    const { element } = await createComponent(SpeedRunPage, {
      providers: [mockActivatedRoute({})],
    });
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Game:');
  });

  it('should have playMode set to PlayMode.SpeedRun', async () => {
    const { component } = await createComponent(SpeedRunPage, {
      providers: [mockActivatedRoute({ gameId: 'wire-protocol' })],
    });
    expect(component.playMode).toBe(PlayMode.SpeedRun);
  });
});
