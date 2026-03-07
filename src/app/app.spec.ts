import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the top bar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const topBar = fixture.nativeElement.querySelector('.top-bar');
    expect(topBar).toBeTruthy();
  });

  it('should render the logo with link to home', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const logo = fixture.nativeElement.querySelector('.top-bar__logo');
    expect(logo).toBeTruthy();
    expect(logo.textContent).toContain('Nexus Station');
    expect(logo.getAttribute('href')).toBe('/');
  });

  it('should render the rank badge placeholder', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const rank = fixture.nativeElement.querySelector('.top-bar__rank');
    expect(rank).toBeTruthy();
    expect(rank.textContent).toContain('Cadet');
  });

  it('should render the XP bar placeholder', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const xpBar = fixture.nativeElement.querySelector('.top-bar__xp');
    expect(xpBar).toBeTruthy();
    const xpBarInner = fixture.nativeElement.querySelector('.top-bar__xp-bar');
    expect(xpBarInner).toBeTruthy();
  });

  it('should render the settings button with aria-label', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const settings = fixture.nativeElement.querySelector('.top-bar__settings');
    expect(settings).toBeTruthy();
    expect(settings.getAttribute('aria-label')).toBe('Settings');
  });

  it('should render the main content area with router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('.content');
    expect(content).toBeTruthy();
    const routerOutlet = content.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should use header element for the top bar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header');
    expect(header).toBeTruthy();
    expect(header.classList.contains('top-bar')).toBe(true);
  });

  it('should use main element for the content area', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const main = fixture.nativeElement.querySelector('main');
    expect(main).toBeTruthy();
    expect(main.classList.contains('content')).toBe(true);
  });
});
