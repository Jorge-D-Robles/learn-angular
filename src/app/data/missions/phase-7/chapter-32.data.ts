import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_32_CONTENT: StoryMissionContent = {
  chapterId: 32,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'This is the chapter most people want to skip. Don\'t. You\'ve built components (back in Chapter 1), ' +
        'services (Chapter 18), and forms (Chapters 14-17). How do you know they still work after you make ' +
        'changes? Testing gives you a safety net. Think of it like a preflight checklist. Pilots don\'t skip ' +
        'it because "the plane flew fine yesterday." Angular\'s TestBed creates a miniature Angular ' +
        'environment where you can test components in isolation, with fake services, and verify behavior ' +
        'without booting the entire app.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'The basic pattern: configure a tiny Angular module with just your component, create it, ' +
        'and assert against its DOM output. Every Angular test follows this shape.',
      code: [
        "import { TestBed, ComponentFixture } from '@angular/core/testing';",
        "import { SensorDisplayComponent } from './sensor-display';",
        '',
        "describe('SensorDisplayComponent', () => {",
        '  let fixture: ComponentFixture<SensorDisplayComponent>;',
        '  let component: SensorDisplayComponent;',
        '',
        '  beforeEach(async () => {',
        '    await TestBed.configureTestingModule({',
        '      imports: [SensorDisplayComponent],',
        '    }).compileComponents();',
        '',
        '    fixture = TestBed.createComponent(SensorDisplayComponent);',
        '    component = fixture.componentInstance;',
        '    fixture.detectChanges();',
        '  });',
        '',
        "  it('should render the sensor reading', () => {",
        '    const el: HTMLElement = fixture.nativeElement;',
        "    expect(el.textContent).toContain('Temperature');",
        '  });',
        '});',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 9, 13, 14, 15, 19],
      explanation:
        'TestBed.configureTestingModule() spins up an isolated Angular environment, just enough ' +
        'to compile and render your component. createComponent() gives you a ComponentFixture, which ' +
        'is your handle to the component instance and its rendered DOM. The critical step people ' +
        'forget: detectChanges(). Angular won\'t render anything until you tell it to run change ' +
        'detection, so call it after setup and after any state change you want to verify.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Real components depend on services. You don\'t want your tests hitting actual APIs, so you ' +
        'replace the real service with a mock. This keeps tests fast, deterministic, and isolated.',
      code: [
        "import { TestBed } from '@angular/core/testing';",
        "import { PowerMonitorComponent } from './power-monitor';",
        "import { PowerService } from './power.service';",
        '',
        "describe('PowerMonitorComponent', () => {",
        '  const mockPowerService = {',
        '    getPowerLevel: () => 85,',
        "    getStatus: () => 'nominal',",
        '  };',
        '',
        '  beforeEach(async () => {',
        '    await TestBed.configureTestingModule({',
        '      imports: [PowerMonitorComponent],',
        '      providers: [',
        '        { provide: PowerService, useValue: mockPowerService },',
        '      ],',
        '    }).compileComponents();',
        '  });',
        '',
        "  it('should display the power level from the service', () => {",
        '    const fixture = TestBed.createComponent(PowerMonitorComponent);',
        '    fixture.detectChanges();',
        '    const el: HTMLElement = fixture.nativeElement;',
        "    expect(el.textContent).toContain('85');",
        '  });',
        '});',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 6, 14, 15],
      explanation:
        'The { provide, useValue } syntax tells Angular: "Whenever something asks for PowerService, ' +
        'give it this fake object instead." Your component has no idea it is talking to a mock. ' +
        'This is dependency injection doing exactly what it was designed for. You swap the real ' +
        'implementation at the boundary so the component under test never touches a real API, ' +
        'database, or anything slow and unpredictable.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Every production Angular app has tests. Interviewers will ask about TestBed. More importantly, ' +
        'tests catch bugs before your users do. This is a skill that pays for itself immediately.',
      conceptTitle: 'TestBed: Angular\'s Testing Sandbox',
      conceptBody:
        'TestBed creates a disposable Angular environment per test. ComponentFixture gives you three ' +
        'things: the component instance (componentInstance), its rendered DOM (nativeElement), and ' +
        'manual change detection (detectChanges). Mock services with { provide, useValue } to isolate ' +
        'the unit under test from the outside world. The pattern is always the same: configure, create, ' +
        'detect changes, assert.',
      keyPoints: [
        'TestBed is a per-test Angular environment that compiles components, resolves dependencies, and runs change detection on your terms',
        'Mock services using { provide, useValue } so tests stay fast, isolated, and deterministic',
        'detectChanges() is not automatic in tests, so you control exactly when Angular re-renders, which makes assertions predictable',
        'Test the component through its DOM (nativeElement) to verify what the user actually sees, not just internal state',
      ],
    },
  ],
  completionCriteria: {
    description: 'System certification complete!',
    minStepsViewed: 4,
  },
};
