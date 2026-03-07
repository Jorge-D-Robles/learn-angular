import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { createComponent } from '../../../testing/test-utils';
import { MissionPage } from './mission';

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

describe('MissionPage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(MissionPage, {
      providers: [mockActivatedRoute({ chapterId: '1' })],
    });
    expect(component).toBeTruthy();
  });

  it('should render "Mission" heading', async () => {
    const { element } = await createComponent(MissionPage, {
      providers: [mockActivatedRoute({ chapterId: '1' })],
    });
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Mission');
  });

  it('should display the chapterId from route params', async () => {
    const { element } = await createComponent(MissionPage, {
      providers: [mockActivatedRoute({ chapterId: '5' })],
    });
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Chapter: 5');
  });

  it('should display empty chapterId when param is missing', async () => {
    const { element } = await createComponent(MissionPage, {
      providers: [mockActivatedRoute({})],
    });
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Chapter:');
  });
});
