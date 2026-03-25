import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { createComponent } from '../../../testing/test-utils';
import { RefresherChallengePage } from './refresher';

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

describe('RefresherChallengePage', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(RefresherChallengePage, {
      providers: [mockActivatedRoute({ topicId: 'signals' })],
    });
    expect(component).toBeTruthy();
  });

  it('should render "Refresher Challenge" heading', async () => {
    const { element } = await createComponent(RefresherChallengePage, {
      providers: [mockActivatedRoute({ topicId: 'signals' })],
    });
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Refresher Challenge');
  });

  it('should display the topicId from route params', async () => {
    const { element } = await createComponent(RefresherChallengePage, {
      providers: [mockActivatedRoute({ topicId: 'signals' })],
    });
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Topic: signals');
  });

  it('should display empty topicId when param is missing', async () => {
    const { element } = await createComponent(RefresherChallengePage, {
      providers: [mockActivatedRoute({})],
    });
    const p = element.querySelector('p');
    expect(p?.textContent).toContain('Topic:');
  });
});
