import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_32_CONTENT: StoryMissionContent = {
  chapterId: 32,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Before Nexus Station can be certified for extended deep space operations, every system must be ' +
        'tested — components verified in isolation, services validated with mock dependencies, and ' +
        'integrations confirmed end-to-end. Angular\'s testing utilities (TestBed, ComponentFixture) ' +
        'provide a controlled environment to instantiate components, inject mock services, and assert ' +
        'behavior without running the full application.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use TestBed to configure a testing module and ComponentFixture to create and inspect a ' +
        'component in a test environment.',
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
        'TestBed.configureTestingModule() creates an isolated Angular module for testing. ' +
        'compileComponents() compiles any templates. createComponent() instantiates the component ' +
        'and returns a ComponentFixture, which provides access to the component instance and its DOM. ' +
        'detectChanges() triggers change detection to update the template bindings.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Provide mock services in the testing module to isolate the component from real dependencies.',
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
        'The providers array in configureTestingModule lets you replace real services with mocks. ' +
        '{ provide: PowerService, useValue: mockPowerService } tells Angular to inject the mock ' +
        'whenever PowerService is requested. This isolates the component under test from real API calls, ' +
        'databases, or other external dependencies.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'System certification complete. Here is how Angular testing tools verify your components.',
      conceptTitle: 'Testing with TestBed and ComponentFixture',
      conceptBody:
        'TestBed creates a test module that mimics an Angular module. ComponentFixture wraps a ' +
        'component instance and provides access to its DOM (nativeElement), component class ' +
        '(componentInstance), and change detection (detectChanges). Mock services with ' +
        '{ provide, useValue } to isolate units under test.',
      keyPoints: [
        'TestBed.configureTestingModule() sets up an isolated Angular testing environment',
        'ComponentFixture provides componentInstance, nativeElement, and detectChanges()',
        '{ provide: Service, useValue: mock } replaces real services with test doubles',
        'Call detectChanges() after setup to trigger initial rendering and binding updates',
      ],
    },
  ],
  completionCriteria: {
    description: 'System certification complete!',
    minStepsViewed: 4,
  },
};
