import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { createComponent } from '../../../testing/test-utils';
import { MinigamePlayPage } from './minigame-play';

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

describe('MinigamePlayPage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(MinigamePlayPage, {
      providers: [
        mockActivatedRoute({ gameId: 'module-assembly', levelId: '3' }),
      ],
    });
    expect(component).toBeTruthy();
  });

  it('should render "Minigame Play" heading', async () => {
    const { element } = await createComponent(MinigamePlayPage, {
      providers: [
        mockActivatedRoute({ gameId: 'module-assembly', levelId: '3' }),
      ],
    });
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Minigame Play');
  });

  it('should display both gameId and levelId from route params', async () => {
    const { element } = await createComponent(MinigamePlayPage, {
      providers: [
        mockActivatedRoute({ gameId: 'module-assembly', levelId: '3' }),
      ],
    });
    const paragraphs = element.querySelectorAll('p');
    expect(paragraphs[0]?.textContent).toContain('Game: module-assembly');
    expect(paragraphs[1]?.textContent).toContain('Level: 3');
  });

  it('should display empty params when missing', async () => {
    const { element } = await createComponent(MinigamePlayPage, {
      providers: [mockActivatedRoute({})],
    });
    const paragraphs = element.querySelectorAll('p');
    expect(paragraphs[0]?.textContent).toContain('Game:');
    expect(paragraphs[1]?.textContent).toContain('Level:');
  });
});
