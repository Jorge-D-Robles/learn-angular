import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type { ModuleAssemblyLevelData } from '../../features/minigames/module-assembly/module-assembly.types';

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const MODULE_ASSEMBLY_LEVELS: readonly LevelDefinition<ModuleAssemblyLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-6)
  // =========================================================================

  // Level 1 — Minimal Component
  {
    levelId: 'ma-basic-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'Minimal Component',
    conceptIntroduced: 'Minimal component',
    description: 'Assemble a basic component with just a decorator, selector, and inline template.',
    data: {
      blueprint: {
        name: 'EmergencyShelter',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
        ],
        expectedParts: ['b1-decorator', 'b1-selector', 'b1-template'],
      },
      parts: [
        { id: 'b1-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'b1-selector', content: `'app-shelter'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'b1-template', content: `<h1>Shelter Active</h1>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
      ],
      decoys: [],
      beltSpeed: 40,
    },
  },

  // Level 2 — Template Slot
  {
    levelId: 'ma-basic-02',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Template Slot',
    conceptIntroduced: 'Template slot',
    description: 'Distinguish between inline template and external templateUrl.',
    data: {
      blueprint: {
        name: 'LifeSupport',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
        ],
        expectedParts: ['b2-decorator', 'b2-selector', 'b2-template-inline', 'b2-template-content'],
      },
      parts: [
        { id: 'b2-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'b2-selector', content: `'app-life-support'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'b2-template-inline', content: `template: '<p>O2 Level: Normal</p>'`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'b2-template-content', content: `<div class="life-support">Systems OK</div>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'b2-decoy-url', content: `templateUrl: './missing.html'`, type: 'template', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'b2-decoy-url', content: `templateUrl: './missing.html'`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'External templateUrl instead of inline template',
        },
      ],
      beltSpeed: 45,
    },
  },

  // Level 3 — Styles Slot
  {
    levelId: 'ma-basic-03',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Styles Slot',
    conceptIntroduced: 'Styles slot',
    description: 'Add a styles array to the component alongside decorator, selector, and template.',
    data: {
      blueprint: {
        name: 'PowerRelay',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
        ],
        expectedParts: ['b3-decorator', 'b3-selector', 'b3-template', 'b3-styles'],
      },
      parts: [
        { id: 'b3-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'b3-selector', content: `'app-power-relay'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'b3-template', content: `<div class="relay">Power: ON</div>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'b3-styles', content: `.relay { color: green; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'b3-decoy-css', content: `color green;`, type: 'styles', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'b3-decoy-css', content: `color green;`, type: 'styles', isDecoy: true, correctSlotId: null },
          mutation: 'Invalid CSS syntax (missing colon/braces)',
        },
      ],
      beltSpeed: 50,
    },
  },

  // Level 4 — Class Body
  {
    levelId: 'ma-basic-04',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Class Body',
    conceptIntroduced: 'Class body',
    description: 'Add properties and a simple method to the component class.',
    data: {
      blueprint: {
        name: 'SensorPanel',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
        ],
        expectedParts: ['b4-decorator', 'b4-selector', 'b4-template', 'b4-styles', 'b4-class'],
      },
      parts: [
        { id: 'b4-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'b4-selector', content: `'app-sensor-panel'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'b4-template', content: `<p>Temperature: {{ temp }}C</p>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'b4-styles', content: `p { font-weight: bold; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'b4-class', content: `temp = 22;\ngetStatus() { return 'nominal'; }`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'b4-decoy-method', content: `function getStatus { return; }`, type: 'classBody', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'b4-decoy-method', content: `function getStatus { return; }`, type: 'classBody', isDecoy: true, correctSlotId: null },
          mutation: 'Function keyword instead of class method syntax',
        },
      ],
      beltSpeed: 50,
    },
  },

  // Level 5 — Interpolation
  {
    levelId: 'ma-basic-05',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Interpolation',
    conceptIntroduced: 'Interpolation',
    description: 'Match {{ expression }} in the template with corresponding class properties.',
    data: {
      blueprint: {
        name: 'DataReadout',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
        ],
        expectedParts: ['b5-decorator', 'b5-selector', 'b5-template', 'b5-styles', 'b5-class'],
      },
      parts: [
        { id: 'b5-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'b5-selector', content: `'app-data-readout'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'b5-template', content: `<span>{{ sensorValue }} units</span>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'b5-styles', content: `span { color: cyan; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'b5-class', content: `sensorValue = 42;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'b5-decoy-tmpl', content: `<span>{ sensorValue } units</span>`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'b5-decoy-class', content: `sensorVal = 42;`, type: 'classBody', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'b5-decoy-tmpl', content: `<span>{ sensorValue } units</span>`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Single braces instead of double-brace interpolation',
        },
        {
          originalPart: { id: 'b5-decoy-class', content: `sensorVal = 42;`, type: 'classBody', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of classBody',
        },
      ],
      beltSpeed: 55,
    },
  },

  // Level 6 — Multiple Components (2 blueprints merged)
  {
    levelId: 'ma-basic-06',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Multiple Components',
    conceptIntroduced: 'Multiple components',
    description: 'Assemble two separate components with their parts mixed on the belt.',
    data: {
      blueprint: {
        name: 'NavigationHub',
        slots: [
          // NavigationHub slots (0-2)
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          // StatusDisplay slots (3-5)
          { id: 'slot-3', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-5', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
        ],
        expectedParts: ['b6-nav-decorator', 'b6-nav-selector', 'b6-nav-template', 'b6-status-decorator', 'b6-status-selector', 'b6-status-template'],
      },
      parts: [
        { id: 'b6-nav-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'b6-nav-selector', content: `'app-nav-hub'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'b6-nav-template', content: `<nav>Dashboard | Settings</nav>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'b6-status-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'b6-status-selector', content: `'app-status-display'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'b6-status-template', content: `<div>All Systems Operational</div>`, type: 'template', isDecoy: false, correctSlotId: 'slot-5' },
        { id: 'b6-decoy-sel', content: `'app-unknown'`, type: 'selector', isDecoy: true, correctSlotId: null },
        { id: 'b6-decoy-tmpl', content: `<div>{{undefined}}</div>`, type: 'template', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'b6-decoy-sel', content: `'app-unknown'`, type: 'selector', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of selector',
        },
        {
          originalPart: { id: 'b6-decoy-tmpl', content: `<div>{{undefined}}</div>`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
      ],
      beltSpeed: 55,
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 7-12)
  // =========================================================================

  // Level 7 — Imports Array
  {
    levelId: 'ma-intermediate-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Imports Array',
    conceptIntroduced: 'Imports array',
    description: 'Add an imports array to bring in other components.',
    data: {
      blueprint: {
        name: 'CommRelay',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
        ],
        expectedParts: ['i1-decorator', 'i1-selector', 'i1-template', 'i1-class', 'i1-imports'],
      },
      parts: [
        { id: 'i1-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'i1-selector', content: `'app-comm-relay'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'i1-template', content: `<app-signal-bar />`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'i1-class', content: `frequency = 140.5;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'i1-imports', content: `imports: [SignalBarComponent]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'i1-decoy-import', content: `imports: [BrowserModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'i1-decoy-import', content: `imports: [BrowserModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of imports',
        },
      ],
      beltSpeed: 60,
    },
  },

  // Level 8 — Decoy Parts
  {
    levelId: 'ma-intermediate-02',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Decoy Parts',
    conceptIntroduced: 'Decoy parts',
    description: 'Reject invalid code snippets mixed in with the correct parts.',
    data: {
      blueprint: {
        name: 'AirLock',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
        ],
        expectedParts: ['i2-decorator', 'i2-selector', 'i2-template', 'i2-styles'],
      },
      parts: [
        { id: 'i2-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'i2-selector', content: `'app-air-lock'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'i2-template', content: `<button (click)="toggle()">Toggle Lock</button>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'i2-styles', content: `button { background: red; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'i2-decoy1', content: `@Directive({...})`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'i2-decoy2', content: `selector: 'app-air-lock'`, type: 'selector', isDecoy: true, correctSlotId: null },
        { id: 'i2-decoy3', content: `<button onclick="toggle()">Toggle</button>`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'i2-decoy4', content: `background: red`, type: 'styles', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'i2-decoy1', content: `@Directive({...})`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'i2-decoy2', content: `selector: 'app-air-lock'`, type: 'selector', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of selector',
        },
        {
          originalPart: { id: 'i2-decoy3', content: `<button onclick="toggle()">Toggle</button>`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'i2-decoy4', content: `background: red`, type: 'styles', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of styles',
        },
      ],
      beltSpeed: 60,
    },
  },

  // Level 9 — Nested Components (2 blueprints merged: 4 + 3 = 7 slots)
  {
    levelId: 'ma-intermediate-03',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Nested Components',
    conceptIntroduced: 'Nested components',
    description: 'Assemble a parent and child component where the parent template includes the child selector.',
    data: {
      blueprint: {
        name: 'DeckLayout',
        slots: [
          // DeckLayout slots (0-3)
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
          // DeckTile slots (4-6)
          { id: 'slot-4', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-5', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-6', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
        ],
        expectedParts: ['i3-parent-decorator', 'i3-parent-selector', 'i3-parent-template', 'i3-parent-imports', 'i3-child-decorator', 'i3-child-selector', 'i3-child-template'],
      },
      parts: [
        { id: 'i3-parent-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'i3-parent-selector', content: `'app-deck-layout'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'i3-parent-template', content: `<app-deck-tile /><app-deck-tile />`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'i3-parent-imports', content: `imports: [DeckTileComponent]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'i3-child-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'i3-child-selector', content: `'app-deck-tile'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-5' },
        { id: 'i3-child-template', content: `<div class="tile">Deck Section</div>`, type: 'template', isDecoy: false, correctSlotId: 'slot-6' },
        { id: 'i3-decoy1', content: `'app-deck'`, type: 'selector', isDecoy: true, correctSlotId: null },
        { id: 'i3-decoy2', content: `<deck-tile />`, type: 'template', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'i3-decoy1', content: `'app-deck'`, type: 'selector', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of selector',
        },
        {
          originalPart: { id: 'i3-decoy2', content: `<deck-tile />`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
      ],
      beltSpeed: 65,
    },
  },

  // Level 10 — Standalone vs NgModule
  {
    levelId: 'ma-intermediate-04',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Standalone vs NgModule',
    conceptIntroduced: 'Standalone vs NgModule',
    description: 'Build a standalone component and reject NgModule-style patterns.',
    data: {
      blueprint: {
        name: 'ControlPanel',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
        ],
        expectedParts: ['i4-decorator', 'i4-selector', 'i4-template', 'i4-imports', 'i4-class'],
      },
      parts: [
        { id: 'i4-decorator', content: `@Component({ standalone: true, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'i4-selector', content: `'app-control-panel'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'i4-template', content: `<h2>Station Controls</h2>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'i4-imports', content: `imports: [CommonModule]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'i4-class', content: `isActive = true;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'i4-decoy1', content: `@NgModule({ declarations: [...] })`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'i4-decoy2', content: `declarations: [ControlPanelComponent]`, type: 'imports', isDecoy: true, correctSlotId: null },
        { id: 'i4-decoy3', content: `@Component({ ... })`, type: 'decorator', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'i4-decoy1', content: `@NgModule({ declarations: [...] })`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'i4-decoy2', content: `declarations: [ControlPanelComponent]`, type: 'imports', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of imports',
        },
        {
          originalPart: { id: 'i4-decoy3', content: `@Component({ ... })`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
      ],
      beltSpeed: 65,
    },
  },

  // Level 11 — Speed Increase
  {
    levelId: 'ma-intermediate-05',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Speed Increase',
    conceptIntroduced: 'Speed increase',
    description: 'Same concepts as before but the belt moves much faster.',
    data: {
      blueprint: {
        name: 'ThrusterArray',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
        ],
        expectedParts: ['i5-decorator', 'i5-selector', 'i5-template', 'i5-styles', 'i5-class'],
      },
      parts: [
        { id: 'i5-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'i5-selector', content: `'app-thruster-array'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'i5-template', content: `<div>Thrust: {{ power }}%</div>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'i5-styles', content: `div { font-size: 1.5rem; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'i5-class', content: `power = 100;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'i5-decoy1', content: `@Component`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'i5-decoy2', content: `<div>Thrust: {{ thrust }}%</div>`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'i5-decoy3', content: `power: 100;`, type: 'classBody', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'i5-decoy1', content: `@Component`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'i5-decoy2', content: `<div>Thrust: {{ thrust }}%</div>`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'i5-decoy3', content: `power: 100;`, type: 'classBody', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of classBody',
        },
      ],
      beltSpeed: 90,
    },
  },

  // Level 12 — Mixed Challenge (2 blueprints merged: 4 + 4 = 8 slots)
  {
    levelId: 'ma-intermediate-06',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Mixed Challenge',
    conceptIntroduced: 'Mixed challenge',
    description: 'Two components with imports and nested selectors. All concepts combined.',
    data: {
      blueprint: {
        name: 'BridgeConsole',
        slots: [
          // BridgeConsole slots (0-3)
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
          // AlertPanel slots (4-7)
          { id: 'slot-4', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-5', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-6', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-7', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
        ],
        expectedParts: ['i6-bridge-decorator', 'i6-bridge-selector', 'i6-bridge-template', 'i6-bridge-imports', 'i6-alert-decorator', 'i6-alert-selector', 'i6-alert-template', 'i6-alert-class'],
      },
      parts: [
        { id: 'i6-bridge-decorator', content: `@Component({ standalone: true, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'i6-bridge-selector', content: `'app-bridge-console'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'i6-bridge-template', content: `<app-alert-panel /><p>Status: OK</p>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'i6-bridge-imports', content: `imports: [AlertPanelComponent]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'i6-alert-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'i6-alert-selector', content: `'app-alert-panel'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-5' },
        { id: 'i6-alert-template', content: `<div class="alert">{{ message }}</div>`, type: 'template', isDecoy: false, correctSlotId: 'slot-6' },
        { id: 'i6-alert-class', content: `message = 'No active alerts';`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-7' },
        { id: 'i6-decoy1', content: `@Component({ standalone: false })`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'i6-decoy2', content: `'app-bridge'`, type: 'selector', isDecoy: true, correctSlotId: null },
        { id: 'i6-decoy3', content: `<alert-panel />`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'i6-decoy4', content: `imports: [BrowserModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'i6-decoy1', content: `@Component({ standalone: false })`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'i6-decoy2', content: `'app-bridge'`, type: 'selector', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of selector',
        },
        {
          originalPart: { id: 'i6-decoy3', content: `<alert-panel />`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'i6-decoy4', content: `imports: [BrowserModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of imports',
        },
      ],
      beltSpeed: 70,
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 13-17)
  // =========================================================================

  // Level 13 — Template Syntax Details
  {
    levelId: 'ma-advanced-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Template Syntax Details',
    conceptIntroduced: 'Template syntax details',
    description: 'Identify correct interpolation syntax among subtle decoys.',
    data: {
      blueprint: {
        name: 'DiagnosticsView',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
        ],
        expectedParts: ['a1-decorator', 'a1-selector', 'a1-template', 'a1-styles', 'a1-class'],
      },
      parts: [
        { id: 'a1-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'a1-selector', content: `'app-diagnostics-view'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'a1-template', content: `<p>CPU: {{ cpuLoad }}%</p>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'a1-styles', content: `p { color: lime; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'a1-class', content: `cpuLoad = 73;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'a1-decoy1', content: `<p>CPU: {cpuLoad}%</p>`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'a1-decoy2', content: `<p>CPU: {{cpuLoad}%</p>`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'a1-decoy3', content: `<p>CPU: {{ cpuLoad }}}%</p>`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'a1-decoy4', content: `cpuload = 73;`, type: 'classBody', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'a1-decoy1', content: `<p>CPU: {cpuLoad}%</p>`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'a1-decoy2', content: `<p>CPU: {{cpuLoad}%</p>`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'a1-decoy3', content: `<p>CPU: {{ cpuLoad }}}%</p>`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'a1-decoy4', content: `cpuload = 73;`, type: 'classBody', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of classBody',
        },
      ],
      beltSpeed: 75,
    },
  },

  // Level 14 — Component Metadata
  {
    levelId: 'ma-advanced-02',
    gameId: 'module-assembly',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Component Metadata',
    conceptIntroduced: 'Component metadata',
    description: 'Add changeDetection and encapsulation options to the component decorator.',
    data: {
      blueprint: {
        name: 'TelemetryFeed',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
          { id: 'slot-5', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
        ],
        expectedParts: ['a2-decorator', 'a2-selector', 'a2-template', 'a2-styles', 'a2-class', 'a2-imports'],
      },
      parts: [
        { id: 'a2-decorator', content: `@Component({ changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.Emulated, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'a2-selector', content: `'app-telemetry-feed'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'a2-template', content: `<ul><li>{{ reading }}</li></ul>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'a2-styles', content: `ul { list-style: none; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'a2-class', content: `reading = 'Stable';`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'a2-imports', content: `imports: [CommonModule]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-5' },
        { id: 'a2-decoy1', content: `changeDetection: 'OnPush'`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'a2-decoy2', content: `encapsulation: 'None'`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'a2-decoy3', content: `viewEncapsulation: ViewEncapsulation.None`, type: 'decorator', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'a2-decoy1', content: `changeDetection: 'OnPush'`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'a2-decoy2', content: `encapsulation: 'None'`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'a2-decoy3', content: `viewEncapsulation: ViewEncapsulation.None`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
      ],
      beltSpeed: 75,
    },
  },

  // Level 15 — Host Bindings
  {
    levelId: 'ma-advanced-03',
    gameId: 'module-assembly',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Host Bindings',
    conceptIntroduced: 'Host bindings',
    description: 'Add the host property to the component decorator for host element bindings.',
    data: {
      blueprint: {
        name: 'GravityPlate',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
        ],
        expectedParts: ['a3-decorator', 'a3-selector', 'a3-template', 'a3-class', 'a3-styles'],
      },
      parts: [
        { id: 'a3-decorator', content: `@Component({ host: { '[class.active]': 'isActive', '(click)': 'toggle()' }, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'a3-selector', content: `'app-gravity-plate'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'a3-template', content: `<span>Gravity: {{ isActive ? 'ON' : 'OFF' }}</span>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'a3-class', content: `isActive = false;\ntoggle() { this.isActive = !this.isActive; }`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'a3-styles', content: `:host(.active) { background: green; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'a3-decoy1', content: `host: { 'class.active': 'isActive' }`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'a3-decoy2', content: `@HostBinding('class.active') isActive;`, type: 'classBody', isDecoy: true, correctSlotId: null },
        { id: 'a3-decoy3', content: `host: ['class.active', 'isActive']`, type: 'decorator', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'a3-decoy1', content: `host: { 'class.active': 'isActive' }`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'a3-decoy2', content: `@HostBinding('class.active') isActive;`, type: 'classBody', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of classBody',
        },
        {
          originalPart: { id: 'a3-decoy3', content: `host: ['class.active', 'isActive']`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
      ],
      beltSpeed: 80,
    },
  },

  // Level 16 — Multi-Component Assembly (3 blueprints merged: 4 + 4 + 4 = 12 slots)
  {
    levelId: 'ma-advanced-04',
    gameId: 'module-assembly',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Multi-Component Assembly',
    conceptIntroduced: 'Multi-component assembly',
    description: 'Assemble three interconnected components that compose together.',
    data: {
      blueprint: {
        name: 'ShieldGrid',
        slots: [
          // ShieldGrid slots (0-3)
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
          // ShieldNode slots (4-7)
          { id: 'slot-4', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-5', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-6', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-7', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
          // ShieldStatus slots (8-11)
          { id: 'slot-8', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-9', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-10', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-11', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
        ],
        expectedParts: [
          'a4-shield-decorator', 'a4-shield-selector', 'a4-shield-template', 'a4-shield-imports',
          'a4-node-decorator', 'a4-node-selector', 'a4-node-template', 'a4-node-class',
          'a4-status-decorator', 'a4-status-selector', 'a4-status-template', 'a4-status-styles',
        ],
      },
      parts: [
        { id: 'a4-shield-decorator', content: `@Component({ standalone: true, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'a4-shield-selector', content: `'app-shield-grid'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'a4-shield-template', content: `<app-shield-node /><app-shield-status />`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'a4-shield-imports', content: `imports: [ShieldNodeComponent, ShieldStatusComponent]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'a4-node-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'a4-node-selector', content: `'app-shield-node'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-5' },
        { id: 'a4-node-template', content: `<div>Node {{ nodeId }}: {{ strength }}%</div>`, type: 'template', isDecoy: false, correctSlotId: 'slot-6' },
        { id: 'a4-node-class', content: `nodeId = 1;\nstrength = 100;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-7' },
        { id: 'a4-status-decorator', content: `@Component({...})`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-8' },
        { id: 'a4-status-selector', content: `'app-shield-status'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-9' },
        { id: 'a4-status-template', content: `<p class="status">Shields: Active</p>`, type: 'template', isDecoy: false, correctSlotId: 'slot-10' },
        { id: 'a4-status-styles', content: `.status { color: cyan; font-weight: bold; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-11' },
        { id: 'a4-decoy1', content: `'app-shield'`, type: 'selector', isDecoy: true, correctSlotId: null },
        { id: 'a4-decoy2', content: `<shield-node />`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'a4-decoy3', content: `imports: [ShieldModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
        { id: 'a4-decoy4', content: `nodeId: 1;`, type: 'classBody', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'a4-decoy1', content: `'app-shield'`, type: 'selector', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of selector',
        },
        {
          originalPart: { id: 'a4-decoy2', content: `<shield-node />`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'a4-decoy3', content: `imports: [ShieldModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of imports',
        },
        {
          originalPart: { id: 'a4-decoy4', content: `nodeId: 1;`, type: 'classBody', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of classBody',
        },
      ],
      beltSpeed: 75,
    },
  },

  // Level 17 — Rapid Fire
  {
    levelId: 'ma-advanced-05',
    gameId: 'module-assembly',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Rapid Fire',
    conceptIntroduced: 'Rapid fire',
    description: 'Very fast belt with all concepts and decoys everywhere.',
    data: {
      blueprint: {
        name: 'EscapePod',
        slots: [
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
          { id: 'slot-5', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
        ],
        expectedParts: ['a5-decorator', 'a5-selector', 'a5-template', 'a5-styles', 'a5-class', 'a5-imports'],
      },
      parts: [
        { id: 'a5-decorator', content: `@Component({ standalone: true, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'a5-selector', content: `'app-escape-pod'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'a5-template', content: `<div>Pod {{ podId }}: {{ status }}</div>`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'a5-styles', content: `div { border: 2px solid orange; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'a5-class', content: `podId = 7;\nstatus = 'Ready';`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-4' },
        { id: 'a5-imports', content: `imports: [CommonModule]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-5' },
        { id: 'a5-decoy1', content: `@Pipe({ name: 'escape' })`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'a5-decoy2', content: `'escape-pod'`, type: 'selector', isDecoy: true, correctSlotId: null },
        { id: 'a5-decoy3', content: `<div>Pod {{ podId }: {{ status }}</div>`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'a5-decoy4', content: `div { border 2px solid orange; }`, type: 'styles', isDecoy: true, correctSlotId: null },
        { id: 'a5-decoy5', content: `podId: number = 7;`, type: 'classBody', isDecoy: true, correctSlotId: null },
        { id: 'a5-decoy6', content: `imports: [EscapeModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'a5-decoy1', content: `@Pipe({ name: 'escape' })`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'a5-decoy2', content: `'escape-pod'`, type: 'selector', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of selector',
        },
        {
          originalPart: { id: 'a5-decoy3', content: `<div>Pod {{ podId }: {{ status }}</div>`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'a5-decoy4', content: `div { border 2px solid orange; }`, type: 'styles', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of styles',
        },
        {
          originalPart: { id: 'a5-decoy5', content: `podId: number = 7;`, type: 'classBody', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of classBody',
        },
        {
          originalPart: { id: 'a5-decoy6', content: `imports: [EscapeModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of imports',
        },
      ],
      beltSpeed: 110,
    },
  },

  // =========================================================================
  // BOSS TIER (Level 18)
  // =========================================================================

  // Level 18 — Emergency Module Fabrication (5 blueprints merged: 5+5+5+5+5 = 25 slots)
  {
    levelId: 'ma-boss-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Emergency Module Fabrication',
    conceptIntroduced: 'Full component assembly',
    description: 'Assemble 5 interconnected components under time pressure to restore the station core.',
    parTime: 120,
    data: {
      blueprint: {
        name: 'StationCore',
        slots: [
          // StationCore slots (0-4)
          { id: 'slot-0', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-1', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-3', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
          { id: 'slot-4', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
          // ReactorModule slots (5-9)
          { id: 'slot-5', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-6', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-7', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-8', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
          { id: 'slot-9', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
          // LifeSupportModule slots (10-14)
          { id: 'slot-10', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-11', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-12', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-13', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
          { id: 'slot-14', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
          // NavigationModule slots (15-19)
          { id: 'slot-15', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-16', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-17', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-18', slotType: 'styles', label: 'Styles', isRequired: true, isOptional: false },
          { id: 'slot-19', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
          // CommsArray slots (20-24)
          { id: 'slot-20', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
          { id: 'slot-21', slotType: 'selector', label: 'Selector', isRequired: true, isOptional: false },
          { id: 'slot-22', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
          { id: 'slot-23', slotType: 'imports', label: 'Imports', isRequired: true, isOptional: false },
          { id: 'slot-24', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false },
        ],
        expectedParts: [
          'boss-core-decorator', 'boss-core-selector', 'boss-core-template', 'boss-core-imports', 'boss-core-class',
          'boss-reactor-decorator', 'boss-reactor-selector', 'boss-reactor-template', 'boss-reactor-styles', 'boss-reactor-class',
          'boss-life-decorator', 'boss-life-selector', 'boss-life-template', 'boss-life-imports', 'boss-life-class',
          'boss-nav-decorator', 'boss-nav-selector', 'boss-nav-template', 'boss-nav-styles', 'boss-nav-class',
          'boss-comms-decorator', 'boss-comms-selector', 'boss-comms-template', 'boss-comms-imports', 'boss-comms-class',
        ],
      },
      parts: [
        // StationCore parts
        { id: 'boss-core-decorator', content: `@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-0' },
        { id: 'boss-core-selector', content: `'app-station-core'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-1' },
        { id: 'boss-core-template', content: `<app-reactor /><app-life-support /><app-navigation /><app-comms-array />`, type: 'template', isDecoy: false, correctSlotId: 'slot-2' },
        { id: 'boss-core-imports', content: `imports: [ReactorModule, LifeSupportModule, NavigationModule, CommsArrayComponent]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-3' },
        { id: 'boss-core-class', content: `stationName = 'Nexus';\ngetStatus() { return 'operational'; }`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-4' },
        // ReactorModule parts
        { id: 'boss-reactor-decorator', content: `@Component({ standalone: true, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-5' },
        { id: 'boss-reactor-selector', content: `'app-reactor'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-6' },
        { id: 'boss-reactor-template', content: `<div class="reactor">Output: {{ output }}MW</div>`, type: 'template', isDecoy: false, correctSlotId: 'slot-7' },
        { id: 'boss-reactor-styles', content: `.reactor { color: orange; border: 1px solid orange; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-8' },
        { id: 'boss-reactor-class', content: `output = 500;\nfuelLevel = 87;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-9' },
        // LifeSupportModule parts
        { id: 'boss-life-decorator', content: `@Component({ standalone: true, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-10' },
        { id: 'boss-life-selector', content: `'app-life-support'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-11' },
        { id: 'boss-life-template', content: `<p>O2: {{ oxygenLevel }}% | Temp: {{ temp }}C</p>`, type: 'template', isDecoy: false, correctSlotId: 'slot-12' },
        { id: 'boss-life-imports', content: `imports: [CommonModule]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-13' },
        { id: 'boss-life-class', content: `oxygenLevel = 98;\ntemp = 21;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-14' },
        // NavigationModule parts
        { id: 'boss-nav-decorator', content: `@Component({ standalone: true, host: { '[class.active]': 'isActive' }, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-15' },
        { id: 'boss-nav-selector', content: `'app-navigation'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-16' },
        { id: 'boss-nav-template', content: `<nav>Heading: {{ heading }}deg | Speed: {{ speed }}</nav>`, type: 'template', isDecoy: false, correctSlotId: 'slot-17' },
        { id: 'boss-nav-styles', content: `nav { background: #1a1a2e; padding: 8px; }`, type: 'styles', isDecoy: false, correctSlotId: 'slot-18' },
        { id: 'boss-nav-class', content: `heading = 270;\nspeed = 'sublight';\nisActive = true;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-19' },
        // CommsArray parts
        { id: 'boss-comms-decorator', content: `@Component({ standalone: true, ... })`, type: 'decorator', isDecoy: false, correctSlotId: 'slot-20' },
        { id: 'boss-comms-selector', content: `'app-comms-array'`, type: 'selector', isDecoy: false, correctSlotId: 'slot-21' },
        { id: 'boss-comms-template', content: `<ul><li>Channel {{ ch }}: {{ freq }}MHz</li></ul>`, type: 'template', isDecoy: false, correctSlotId: 'slot-22' },
        { id: 'boss-comms-imports', content: `imports: [CommonModule]`, type: 'imports', isDecoy: false, correctSlotId: 'slot-23' },
        { id: 'boss-comms-class', content: `ch = 1;\nfreq = 140.5;`, type: 'classBody', isDecoy: false, correctSlotId: 'slot-24' },
        // Decoy parts
        { id: 'boss-decoy1', content: `@NgModule({ declarations: [StationCore] })`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'boss-decoy2', content: `'station-core'`, type: 'selector', isDecoy: true, correctSlotId: null },
        { id: 'boss-decoy3', content: `<reactor-module />`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'boss-decoy4', content: `imports: [BrowserModule, FormsModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
        { id: 'boss-decoy5', content: `output: number = 500;`, type: 'classBody', isDecoy: true, correctSlotId: null },
        { id: 'boss-decoy6', content: `@Component({})`, type: 'decorator', isDecoy: true, correctSlotId: null },
        { id: 'boss-decoy7', content: `templateUrl: './station-core.html'`, type: 'template', isDecoy: true, correctSlotId: null },
        { id: 'boss-decoy8', content: `.reactor color: orange;`, type: 'styles', isDecoy: true, correctSlotId: null },
      ],
      decoys: [
        {
          originalPart: { id: 'boss-decoy1', content: `@NgModule({ declarations: [StationCore] })`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'boss-decoy2', content: `'station-core'`, type: 'selector', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of selector',
        },
        {
          originalPart: { id: 'boss-decoy3', content: `<reactor-module />`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'boss-decoy4', content: `imports: [BrowserModule, FormsModule]`, type: 'imports', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of imports',
        },
        {
          originalPart: { id: 'boss-decoy5', content: `output: number = 500;`, type: 'classBody', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of classBody',
        },
        {
          originalPart: { id: 'boss-decoy6', content: `@Component({})`, type: 'decorator', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of decorator',
        },
        {
          originalPart: { id: 'boss-decoy7', content: `templateUrl: './station-core.html'`, type: 'template', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of template',
        },
        {
          originalPart: { id: 'boss-decoy8', content: `.reactor color: orange;`, type: 'styles', isDecoy: true, correctSlotId: null },
          mutation: 'Decoy variant of styles',
        },
      ],
      beltSpeed: 85,
    },
  },
];

// ---------------------------------------------------------------------------
// Level Pack
// ---------------------------------------------------------------------------

export const MODULE_ASSEMBLY_LEVEL_PACK: LevelPack = {
  gameId: 'module-assembly',
  levels: MODULE_ASSEMBLY_LEVELS,
};
