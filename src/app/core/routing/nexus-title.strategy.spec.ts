import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, RouterStateSnapshot, TitleStrategy, provideRouter, Routes } from '@angular/router';
import { Component } from '@angular/core';
import { NexusTitleStrategy } from './nexus-title.strategy';

@Component({ template: '' })
class TestComponent {}

describe('NexusTitleStrategy', () => {
  let strategy: NexusTitleStrategy;
  let titleService: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NexusTitleStrategy,
        Title,
      ],
    });
    strategy = TestBed.inject(NexusTitleStrategy);
    titleService = TestBed.inject(Title);
  });

  it('should set document.title to "PageTitle | Nexus Station" when route has a title', () => {
    const spy = vi.spyOn(titleService, 'setTitle');
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('Dashboard');

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(spy).toHaveBeenCalledWith('Dashboard | Nexus Station');
  });

  it('should set document.title to "Nexus Station" when route has no title', () => {
    const spy = vi.spyOn(titleService, 'setTitle');
    vi.spyOn(strategy, 'buildTitle').mockReturnValue(undefined);

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(spy).toHaveBeenCalledWith('Nexus Station');
  });

  it('should use the Title service to set the title', () => {
    const spy = vi.spyOn(titleService, 'setTitle');
    vi.spyOn(strategy, 'buildTitle').mockReturnValue('Settings');

    strategy.updateTitle({} as RouterStateSnapshot);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('Settings | Nexus Station');
  });
});

describe('NexusTitleStrategy integration', () => {
  const testRoutes: Routes = [
    { path: 'test', component: TestComponent, title: 'TestPage' },
    { path: '', component: TestComponent },
  ];

  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(testRoutes),
        { provide: TitleStrategy, useClass: NexusTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('should update document.title on navigation', async () => {
    await router.navigateByUrl('/test');

    expect(document.title).toBe('TestPage | Nexus Station');
  });

  it('should fall back to "Nexus Station" for routes without a title', async () => {
    await router.navigateByUrl('/');

    expect(document.title).toBe('Nexus Station');
  });
});
