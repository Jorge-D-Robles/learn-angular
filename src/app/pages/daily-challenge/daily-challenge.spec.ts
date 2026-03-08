import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { createComponent } from '../../../testing/test-utils';
import { DailyChallengePage } from './daily-challenge';
import { PlayMode } from '../../core/minigame/minigame.types';

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

describe('DailyChallengePage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(DailyChallengePage, {
      providers: [mockActivatedRoute({ gameId: 'wire-protocol' })],
    });
    expect(component).toBeTruthy();
  });

  it('should render "Daily Challenge" heading', async () => {
    const { element } = await createComponent(DailyChallengePage, {
      providers: [mockActivatedRoute({ gameId: 'wire-protocol' })],
    });
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Daily Challenge');
  });

  it('should display the gameId from route params', async () => {
    const { element } = await createComponent(DailyChallengePage, {
      providers: [mockActivatedRoute({ gameId: 'module-assembly' })],
    });
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Game: module-assembly');
  });

  it('should display empty gameId when param is missing', async () => {
    const { element } = await createComponent(DailyChallengePage, {
      providers: [mockActivatedRoute({})],
    });
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Game:');
  });

  it('should have playMode set to PlayMode.DailyChallenge', async () => {
    const { component } = await createComponent(DailyChallengePage, {
      providers: [mockActivatedRoute({ gameId: 'wire-protocol' })],
    });
    expect(component.playMode).toBe(PlayMode.DailyChallenge);
  });
});
