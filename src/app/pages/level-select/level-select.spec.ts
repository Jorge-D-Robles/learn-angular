import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { createComponent } from '../../../testing/test-utils';
import { LevelSelectPage } from './level-select';

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

describe('LevelSelectPage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(LevelSelectPage, {
      providers: [mockActivatedRoute({ gameId: 'wire-protocol' })],
    });
    expect(component).toBeTruthy();
  });

  it('should render "Level Select" heading', async () => {
    const { element } = await createComponent(LevelSelectPage, {
      providers: [mockActivatedRoute({ gameId: 'wire-protocol' })],
    });
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Level Select');
  });

  it('should display the gameId from route params', async () => {
    const { element } = await createComponent(LevelSelectPage, {
      providers: [mockActivatedRoute({ gameId: 'wire-protocol' })],
    });
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Game: wire-protocol');
  });
});
