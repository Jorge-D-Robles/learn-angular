import type { CurriculumPhase, StoryMission } from './curriculum.types';

/**
 * The complete 34-chapter curriculum organized into 6 phases.
 * Source of truth: docs/curriculum.md
 */
export const CURRICULUM: readonly CurriculumPhase[] = [
  {
    phaseNumber: 1,
    name: 'Foundations',
    description: "The station's core systems are offline. Rebuild them one module at a time.",
    chapters: [
      { chapterId: 1, title: 'Build the Emergency Shelter', angularTopic: 'Components', narrative: 'Create your first station module from scratch', unlocksMinigame: 'module-assembly', deps: [], phase: 1 },
      { chapterId: 2, title: 'Wire Up Life Support', angularTopic: 'Interpolation', narrative: 'Display live sensor data in module readouts', unlocksMinigame: 'module-assembly', deps: [1], phase: 1 },
      { chapterId: 3, title: 'Assemble Power Core + Comms Hub', angularTopic: 'Composing Components', narrative: 'Nest child modules inside parent modules', unlocksMinigame: 'module-assembly', deps: [2], phase: 1 },
      { chapterId: 4, title: 'Alert Systems Online', angularTopic: 'Control Flow (@if, @for, @switch)', narrative: 'Route alerts through conditional display logic', unlocksMinigame: 'flow-commander', deps: [3], phase: 1 },
      { chapterId: 5, title: 'Module Configuration Panels', angularTopic: 'Property Binding', narrative: 'Bind configuration data to module displays', unlocksMinigame: 'wire-protocol', deps: [4], phase: 1 },
      { chapterId: 6, title: 'Crew Interaction Controls', angularTopic: 'Event Handling', narrative: 'Respond to crew button presses and inputs', unlocksMinigame: 'wire-protocol', deps: [5], phase: 1 },
      { chapterId: 7, title: 'Standardized Module Cards', angularTopic: 'Input Properties', narrative: 'Pass data into reusable module card components', unlocksMinigame: 'signal-corps', deps: [6], phase: 1 },
      { chapterId: 8, title: 'Distress Signal System', angularTopic: 'Output Properties', narrative: 'Emit events from child to parent modules', unlocksMinigame: 'signal-corps', deps: [7], phase: 1 },
      { chapterId: 9, title: 'Progressive Module Loading', angularTopic: 'Deferrable Views', narrative: 'Load heavy modules on demand to save power', unlocksMinigame: null, deps: [8], phase: 1 },
      { chapterId: 10, title: 'Star Chart Display', angularTopic: 'Image Optimization', narrative: 'Optimize large star chart images for performance', unlocksMinigame: null, deps: [9], phase: 1 },
    ],
  },
  {
    phaseNumber: 2,
    name: 'Navigation',
    description: 'The corridors are damaged. Rebuild the navigation system so crew can move between modules.',
    chapters: [
      { chapterId: 11, title: 'Station Map', angularTopic: 'Enable Routing', narrative: 'Set up router-outlet and basic navigation', unlocksMinigame: 'corridor-runner', deps: [10], phase: 2 },
      { chapterId: 12, title: 'Corridor Paths', angularTopic: 'Define Routes', narrative: 'Configure route paths, parameters, and 404 "Hull Breach" page', unlocksMinigame: 'corridor-runner', deps: [11], phase: 2 },
      { chapterId: 13, title: 'Navigation Console', angularTopic: 'RouterLink', narrative: 'Build the navigation UI with routerLink directives', unlocksMinigame: 'corridor-runner', deps: [12], phase: 2 },
    ],
  },
  {
    phaseNumber: 3,
    name: 'Data Input',
    description: 'The crew terminals are offline. Rebuild the input systems so crew can submit reports and diagnostics.',
    chapters: [
      { chapterId: 14, title: 'Basic Crew Report', angularTopic: 'Forms Introduction', narrative: 'Build a simple template-driven form', unlocksMinigame: 'terminal-hack', deps: [13], phase: 3 },
      { chapterId: 15, title: 'Real-time Preview', angularTopic: 'Form Control Values', narrative: 'Read and display form values as crew types', unlocksMinigame: 'terminal-hack', deps: [14], phase: 3 },
      { chapterId: 16, title: 'Engineering Diagnostic', angularTopic: 'Reactive Forms', narrative: 'Build a complex diagnostic terminal with FormBuilder', unlocksMinigame: 'terminal-hack', deps: [15], phase: 3 },
      { chapterId: 17, title: 'Data Integrity Checks', angularTopic: 'Forms Validation', narrative: 'Add validators to prevent corrupted submissions', unlocksMinigame: 'terminal-hack', deps: [16], phase: 3 },
    ],
  },
  {
    phaseNumber: 4,
    name: 'Shared Systems',
    description: 'Individual modules work, but they need shared services. Wire up the station\'s power grid.',
    chapters: [
      { chapterId: 18, title: 'Core Services', angularTopic: 'Injectable Services', narrative: 'Create PowerService, CrewService, AlertService', unlocksMinigame: 'power-grid', deps: [17], phase: 4 },
      { chapterId: 19, title: 'Wire the Grid', angularTopic: 'Dependency Injection', narrative: 'Inject services with inject(), understand scoping', unlocksMinigame: 'power-grid', deps: [18], phase: 4 },
    ],
  },
  {
    phaseNumber: 5,
    name: 'Data Processing',
    description: 'Raw sensor data is unusable. Build transformation relays to format it for crew displays.',
    chapters: [
      { chapterId: 20, title: 'Format Sensor Data', angularTopic: 'Using Pipes', narrative: 'Use built-in pipes (date, number, currency, etc.)', unlocksMinigame: 'data-relay', deps: [19], phase: 5 },
      { chapterId: 21, title: 'Advanced Formatting', angularTopic: 'Formatting with Pipes', narrative: 'Pipe parameters, chaining, AsyncPipe', unlocksMinigame: 'data-relay', deps: [20], phase: 5 },
      { chapterId: 22, title: 'Custom Sensors', angularTopic: 'Custom Pipes', narrative: 'Build DistancePipe, StatusPipe, TimeAgoPipe', unlocksMinigame: 'data-relay', deps: [21], phase: 5 },
    ],
  },
  {
    phaseNumber: 6,
    name: 'Advanced',
    description: 'The station is functional. Now upgrade it for deep space operations with advanced systems.',
    chapters: [
      { chapterId: 23, title: 'Sensor Network', angularTopic: 'Creating Signals', narrative: 'Create reactive signals for station telemetry', unlocksMinigame: 'reactor-core', deps: [22], phase: 6 },
      { chapterId: 24, title: 'Computed Readings', angularTopic: 'Computed Signals', narrative: 'Derive values from multiple signal sources', unlocksMinigame: 'reactor-core', deps: [23], phase: 6 },
      { chapterId: 25, title: 'Linked Sensors', angularTopic: 'Linked Signals', narrative: 'Two-way binding with linked signals', unlocksMinigame: 'reactor-core', deps: [24], phase: 6 },
      { chapterId: 26, title: 'Automated Responses', angularTopic: 'Signal Effects', narrative: 'Trigger side effects when signal values change', unlocksMinigame: 'reactor-core', deps: [25], phase: 6 },
      { chapterId: 27, title: 'Universal Module Bays', angularTopic: 'Content Projection', narrative: 'Build flexible containers with ng-content', unlocksMinigame: null, deps: [26], phase: 6 },
      { chapterId: 28, title: 'Startup/Shutdown Sequences', angularTopic: 'Lifecycle Hooks', narrative: 'Manage module initialization and cleanup', unlocksMinigame: 'blast-doors', deps: [27], phase: 6 },
      { chapterId: 29, title: 'Behavior Protocols', angularTopic: 'Custom Directives', narrative: 'Create reusable behavior with attribute directives', unlocksMinigame: 'blast-doors', deps: [28], phase: 6 },
      { chapterId: 30, title: 'Mission Control Comms', angularTopic: 'HTTP Client', narrative: 'Send and receive data from Mission Control API', unlocksMinigame: 'deep-space-radio', deps: [29], phase: 6 },
      { chapterId: 31, title: 'Comm Protocols', angularTopic: 'Interceptors', narrative: 'Add auth, logging, and retry interceptors', unlocksMinigame: 'deep-space-radio', deps: [30], phase: 6 },
      { chapterId: 32, title: 'System Certification', angularTopic: 'Testing', narrative: 'Write unit and integration tests for station systems', unlocksMinigame: 'system-certification', deps: [31], phase: 6 },
      { chapterId: 33, title: 'Station Visual Feedback', angularTopic: 'Animations', narrative: 'Add transitions and visual feedback to the UI', unlocksMinigame: null, deps: [32], phase: 6 },
      { chapterId: 34, title: 'Station Hardening', angularTopic: 'Performance & Security', narrative: 'Optimize performance and secure the station', unlocksMinigame: null, deps: [33], phase: 6 },
    ],
  },
] as const;

/** Flat array of all 34 story missions for convenience iteration. */
export const ALL_STORY_MISSIONS: readonly StoryMission[] = CURRICULUM.flatMap(p => p.chapters);
