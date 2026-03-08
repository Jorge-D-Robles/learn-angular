import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';

// ---------------------------------------------------------------------------
// Game-specific type definitions for Module Assembly
// ---------------------------------------------------------------------------

/** The 6 component anatomy slots in Module Assembly. */
export type BlueprintSlotType =
  | 'decorator'
  | 'selector'
  | 'template'
  | 'styles'
  | 'class-body'
  | 'imports';

/** A single part on the conveyor belt. */
export interface ComponentPart {
  readonly id: string;
  readonly code: string;
  readonly slotType: BlueprintSlotType;
  readonly isDecoy: boolean;
}

/** A single slot in a component blueprint. */
export interface BlueprintSlot {
  readonly slotType: BlueprintSlotType;
  readonly label: string;
  readonly required: boolean;
  readonly acceptsPartIds: readonly string[];
}

/** A component blueprint with labeled slots. */
export interface ComponentBlueprint {
  readonly componentName: string;
  readonly slots: readonly BlueprintSlot[];
}

/** Game-specific data for Module Assembly levels. */
export interface ModuleAssemblyLevelData {
  readonly blueprints: readonly ComponentBlueprint[];
  readonly parts: readonly ComponentPart[];
  readonly beltSpeed: number;
  readonly timeLimit: number;
  readonly maxStrikes: number;
}

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
      blueprints: [
        {
          componentName: 'EmergencyShelter',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['b1-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['b1-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['b1-template'] },
          ],
        },
      ],
      parts: [
        { id: 'b1-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'b1-selector', code: `'app-shelter'`, slotType: 'selector', isDecoy: false },
        { id: 'b1-template', code: `<h1>Shelter Active</h1>`, slotType: 'template', isDecoy: false },
      ],
      beltSpeed: 40,
      timeLimit: 60,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'LifeSupport',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['b2-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['b2-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['b2-template-inline', 'b2-template-content'] },
          ],
        },
      ],
      parts: [
        { id: 'b2-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'b2-selector', code: `'app-life-support'`, slotType: 'selector', isDecoy: false },
        { id: 'b2-template-inline', code: `template: '<p>O2 Level: Normal</p>'`, slotType: 'template', isDecoy: false },
        { id: 'b2-template-content', code: `<div class="life-support">Systems OK</div>`, slotType: 'template', isDecoy: false },
        { id: 'b2-decoy-url', code: `templateUrl: './missing.html'`, slotType: 'template', isDecoy: true },
      ],
      beltSpeed: 45,
      timeLimit: 60,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'PowerRelay',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['b3-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['b3-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['b3-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['b3-styles'] },
          ],
        },
      ],
      parts: [
        { id: 'b3-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'b3-selector', code: `'app-power-relay'`, slotType: 'selector', isDecoy: false },
        { id: 'b3-template', code: `<div class="relay">Power: ON</div>`, slotType: 'template', isDecoy: false },
        { id: 'b3-styles', code: `.relay { color: green; }`, slotType: 'styles', isDecoy: false },
        { id: 'b3-decoy-css', code: `color green;`, slotType: 'styles', isDecoy: true },
      ],
      beltSpeed: 50,
      timeLimit: 60,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'SensorPanel',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['b4-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['b4-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['b4-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['b4-styles'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['b4-class'] },
          ],
        },
      ],
      parts: [
        { id: 'b4-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'b4-selector', code: `'app-sensor-panel'`, slotType: 'selector', isDecoy: false },
        { id: 'b4-template', code: `<p>Temperature: {{ temp }}C</p>`, slotType: 'template', isDecoy: false },
        { id: 'b4-styles', code: `p { font-weight: bold; }`, slotType: 'styles', isDecoy: false },
        { id: 'b4-class', code: `temp = 22;\ngetStatus() { return 'nominal'; }`, slotType: 'class-body', isDecoy: false },
        { id: 'b4-decoy-method', code: `function getStatus { return; }`, slotType: 'class-body', isDecoy: true },
      ],
      beltSpeed: 50,
      timeLimit: 75,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'DataReadout',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['b5-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['b5-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['b5-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['b5-styles'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['b5-class'] },
          ],
        },
      ],
      parts: [
        { id: 'b5-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'b5-selector', code: `'app-data-readout'`, slotType: 'selector', isDecoy: false },
        { id: 'b5-template', code: `<span>{{ sensorValue }} units</span>`, slotType: 'template', isDecoy: false },
        { id: 'b5-styles', code: `span { color: cyan; }`, slotType: 'styles', isDecoy: false },
        { id: 'b5-class', code: `sensorValue = 42;`, slotType: 'class-body', isDecoy: false },
        { id: 'b5-decoy-tmpl', code: `<span>{ sensorValue } units</span>`, slotType: 'template', isDecoy: true },
        { id: 'b5-decoy-class', code: `sensorVal = 42;`, slotType: 'class-body', isDecoy: true },
      ],
      beltSpeed: 55,
      timeLimit: 75,
      maxStrikes: 3,
    },
  },

  // Level 6 — Multiple Components
  {
    levelId: 'ma-basic-06',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Multiple Components',
    conceptIntroduced: 'Multiple components',
    description: 'Assemble two separate components with their parts mixed on the belt.',
    data: {
      blueprints: [
        {
          componentName: 'NavigationHub',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['b6-nav-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['b6-nav-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['b6-nav-template'] },
          ],
        },
        {
          componentName: 'StatusDisplay',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['b6-status-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['b6-status-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['b6-status-template'] },
          ],
        },
      ],
      parts: [
        { id: 'b6-nav-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'b6-nav-selector', code: `'app-nav-hub'`, slotType: 'selector', isDecoy: false },
        { id: 'b6-nav-template', code: `<nav>Dashboard | Settings</nav>`, slotType: 'template', isDecoy: false },
        { id: 'b6-status-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'b6-status-selector', code: `'app-status-display'`, slotType: 'selector', isDecoy: false },
        { id: 'b6-status-template', code: `<div>All Systems Operational</div>`, slotType: 'template', isDecoy: false },
        { id: 'b6-decoy-sel', code: `'app-unknown'`, slotType: 'selector', isDecoy: true },
        { id: 'b6-decoy-tmpl', code: `<div>{{undefined}}</div>`, slotType: 'template', isDecoy: true },
      ],
      beltSpeed: 55,
      timeLimit: 90,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'CommRelay',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['i1-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['i1-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['i1-template'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['i1-class'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['i1-imports'] },
          ],
        },
      ],
      parts: [
        { id: 'i1-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'i1-selector', code: `'app-comm-relay'`, slotType: 'selector', isDecoy: false },
        { id: 'i1-template', code: `<app-signal-bar />`, slotType: 'template', isDecoy: false },
        { id: 'i1-class', code: `frequency = 140.5;`, slotType: 'class-body', isDecoy: false },
        { id: 'i1-imports', code: `imports: [SignalBarComponent]`, slotType: 'imports', isDecoy: false },
        { id: 'i1-decoy-import', code: `imports: [BrowserModule]`, slotType: 'imports', isDecoy: true },
      ],
      beltSpeed: 60,
      timeLimit: 60,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'AirLock',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['i2-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['i2-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['i2-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['i2-styles'] },
          ],
        },
      ],
      parts: [
        { id: 'i2-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'i2-selector', code: `'app-air-lock'`, slotType: 'selector', isDecoy: false },
        { id: 'i2-template', code: `<button (click)="toggle()">Toggle Lock</button>`, slotType: 'template', isDecoy: false },
        { id: 'i2-styles', code: `button { background: red; }`, slotType: 'styles', isDecoy: false },
        { id: 'i2-decoy1', code: `@Directive({...})`, slotType: 'decorator', isDecoy: true },
        { id: 'i2-decoy2', code: `selector: 'app-air-lock'`, slotType: 'selector', isDecoy: true },
        { id: 'i2-decoy3', code: `<button onclick="toggle()">Toggle</button>`, slotType: 'template', isDecoy: true },
        { id: 'i2-decoy4', code: `background: red`, slotType: 'styles', isDecoy: true },
      ],
      beltSpeed: 60,
      timeLimit: 60,
      maxStrikes: 3,
    },
  },

  // Level 9 — Nested Components
  {
    levelId: 'ma-intermediate-03',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Nested Components',
    conceptIntroduced: 'Nested components',
    description: 'Assemble a parent and child component where the parent template includes the child selector.',
    data: {
      blueprints: [
        {
          componentName: 'DeckLayout',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['i3-parent-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['i3-parent-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['i3-parent-template'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['i3-parent-imports'] },
          ],
        },
        {
          componentName: 'DeckTile',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['i3-child-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['i3-child-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['i3-child-template'] },
          ],
        },
      ],
      parts: [
        { id: 'i3-parent-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'i3-parent-selector', code: `'app-deck-layout'`, slotType: 'selector', isDecoy: false },
        { id: 'i3-parent-template', code: `<app-deck-tile /><app-deck-tile />`, slotType: 'template', isDecoy: false },
        { id: 'i3-parent-imports', code: `imports: [DeckTileComponent]`, slotType: 'imports', isDecoy: false },
        { id: 'i3-child-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'i3-child-selector', code: `'app-deck-tile'`, slotType: 'selector', isDecoy: false },
        { id: 'i3-child-template', code: `<div class="tile">Deck Section</div>`, slotType: 'template', isDecoy: false },
        { id: 'i3-decoy1', code: `'app-deck'`, slotType: 'selector', isDecoy: true },
        { id: 'i3-decoy2', code: `<deck-tile />`, slotType: 'template', isDecoy: true },
      ],
      beltSpeed: 65,
      timeLimit: 75,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'ControlPanel',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['i4-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['i4-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['i4-template'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['i4-imports'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['i4-class'] },
          ],
        },
      ],
      parts: [
        { id: 'i4-decorator', code: `@Component({ standalone: true, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'i4-selector', code: `'app-control-panel'`, slotType: 'selector', isDecoy: false },
        { id: 'i4-template', code: `<h2>Station Controls</h2>`, slotType: 'template', isDecoy: false },
        { id: 'i4-imports', code: `imports: [CommonModule]`, slotType: 'imports', isDecoy: false },
        { id: 'i4-class', code: `isActive = true;`, slotType: 'class-body', isDecoy: false },
        { id: 'i4-decoy1', code: `@NgModule({ declarations: [...] })`, slotType: 'decorator', isDecoy: true },
        { id: 'i4-decoy2', code: `declarations: [ControlPanelComponent]`, slotType: 'imports', isDecoy: true },
        { id: 'i4-decoy3', code: `@Component({ ... })`, slotType: 'decorator', isDecoy: true },
      ],
      beltSpeed: 65,
      timeLimit: 60,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'ThrusterArray',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['i5-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['i5-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['i5-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['i5-styles'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['i5-class'] },
          ],
        },
      ],
      parts: [
        { id: 'i5-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'i5-selector', code: `'app-thruster-array'`, slotType: 'selector', isDecoy: false },
        { id: 'i5-template', code: `<div>Thrust: {{ power }}%</div>`, slotType: 'template', isDecoy: false },
        { id: 'i5-styles', code: `div { font-size: 1.5rem; }`, slotType: 'styles', isDecoy: false },
        { id: 'i5-class', code: `power = 100;`, slotType: 'class-body', isDecoy: false },
        { id: 'i5-decoy1', code: `@Component`, slotType: 'decorator', isDecoy: true },
        { id: 'i5-decoy2', code: `<div>Thrust: {{ thrust }}%</div>`, slotType: 'template', isDecoy: true },
        { id: 'i5-decoy3', code: `power: 100;`, slotType: 'class-body', isDecoy: true },
      ],
      beltSpeed: 90,
      timeLimit: 45,
      maxStrikes: 3,
    },
  },

  // Level 12 — Mixed Challenge
  {
    levelId: 'ma-intermediate-06',
    gameId: 'module-assembly',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Mixed Challenge',
    conceptIntroduced: 'Mixed challenge',
    description: 'Two components with imports and nested selectors. All concepts combined.',
    data: {
      blueprints: [
        {
          componentName: 'BridgeConsole',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['i6-bridge-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['i6-bridge-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['i6-bridge-template'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['i6-bridge-imports'] },
          ],
        },
        {
          componentName: 'AlertPanel',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['i6-alert-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['i6-alert-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['i6-alert-template'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['i6-alert-class'] },
          ],
        },
      ],
      parts: [
        { id: 'i6-bridge-decorator', code: `@Component({ standalone: true, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'i6-bridge-selector', code: `'app-bridge-console'`, slotType: 'selector', isDecoy: false },
        { id: 'i6-bridge-template', code: `<app-alert-panel /><p>Status: OK</p>`, slotType: 'template', isDecoy: false },
        { id: 'i6-bridge-imports', code: `imports: [AlertPanelComponent]`, slotType: 'imports', isDecoy: false },
        { id: 'i6-alert-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'i6-alert-selector', code: `'app-alert-panel'`, slotType: 'selector', isDecoy: false },
        { id: 'i6-alert-template', code: `<div class="alert">{{ message }}</div>`, slotType: 'template', isDecoy: false },
        { id: 'i6-alert-class', code: `message = 'No active alerts';`, slotType: 'class-body', isDecoy: false },
        { id: 'i6-decoy1', code: `@Component({ standalone: false })`, slotType: 'decorator', isDecoy: true },
        { id: 'i6-decoy2', code: `'app-bridge'`, slotType: 'selector', isDecoy: true },
        { id: 'i6-decoy3', code: `<alert-panel />`, slotType: 'template', isDecoy: true },
        { id: 'i6-decoy4', code: `imports: [BrowserModule]`, slotType: 'imports', isDecoy: true },
      ],
      beltSpeed: 70,
      timeLimit: 90,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'DiagnosticsView',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['a1-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['a1-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['a1-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['a1-styles'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['a1-class'] },
          ],
        },
      ],
      parts: [
        { id: 'a1-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'a1-selector', code: `'app-diagnostics-view'`, slotType: 'selector', isDecoy: false },
        { id: 'a1-template', code: `<p>CPU: {{ cpuLoad }}%</p>`, slotType: 'template', isDecoy: false },
        { id: 'a1-styles', code: `p { color: lime; }`, slotType: 'styles', isDecoy: false },
        { id: 'a1-class', code: `cpuLoad = 73;`, slotType: 'class-body', isDecoy: false },
        { id: 'a1-decoy1', code: `<p>CPU: {cpuLoad}%</p>`, slotType: 'template', isDecoy: true },
        { id: 'a1-decoy2', code: `<p>CPU: {{cpuLoad}%</p>`, slotType: 'template', isDecoy: true },
        { id: 'a1-decoy3', code: `<p>CPU: {{ cpuLoad }}}%</p>`, slotType: 'template', isDecoy: true },
        { id: 'a1-decoy4', code: `cpuload = 73;`, slotType: 'class-body', isDecoy: true },
      ],
      beltSpeed: 75,
      timeLimit: 60,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'TelemetryFeed',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['a2-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['a2-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['a2-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['a2-styles'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['a2-class'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['a2-imports'] },
          ],
        },
      ],
      parts: [
        { id: 'a2-decorator', code: `@Component({ changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.Emulated, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'a2-selector', code: `'app-telemetry-feed'`, slotType: 'selector', isDecoy: false },
        { id: 'a2-template', code: `<ul><li>{{ reading }}</li></ul>`, slotType: 'template', isDecoy: false },
        { id: 'a2-styles', code: `ul { list-style: none; }`, slotType: 'styles', isDecoy: false },
        { id: 'a2-class', code: `reading = 'Stable';`, slotType: 'class-body', isDecoy: false },
        { id: 'a2-imports', code: `imports: [CommonModule]`, slotType: 'imports', isDecoy: false },
        { id: 'a2-decoy1', code: `changeDetection: 'OnPush'`, slotType: 'decorator', isDecoy: true },
        { id: 'a2-decoy2', code: `encapsulation: 'None'`, slotType: 'decorator', isDecoy: true },
        { id: 'a2-decoy3', code: `viewEncapsulation: ViewEncapsulation.None`, slotType: 'decorator', isDecoy: true },
      ],
      beltSpeed: 75,
      timeLimit: 60,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'GravityPlate',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['a3-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['a3-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['a3-template'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['a3-class'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['a3-styles'] },
          ],
        },
      ],
      parts: [
        { id: 'a3-decorator', code: `@Component({ host: { '[class.active]': 'isActive', '(click)': 'toggle()' }, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'a3-selector', code: `'app-gravity-plate'`, slotType: 'selector', isDecoy: false },
        { id: 'a3-template', code: `<span>Gravity: {{ isActive ? 'ON' : 'OFF' }}</span>`, slotType: 'template', isDecoy: false },
        { id: 'a3-class', code: `isActive = false;\ntoggle() { this.isActive = !this.isActive; }`, slotType: 'class-body', isDecoy: false },
        { id: 'a3-styles', code: `:host(.active) { background: green; }`, slotType: 'styles', isDecoy: false },
        { id: 'a3-decoy1', code: `host: { 'class.active': 'isActive' }`, slotType: 'decorator', isDecoy: true },
        { id: 'a3-decoy2', code: `@HostBinding('class.active') isActive;`, slotType: 'class-body', isDecoy: true },
        { id: 'a3-decoy3', code: `host: ['class.active', 'isActive']`, slotType: 'decorator', isDecoy: true },
      ],
      beltSpeed: 80,
      timeLimit: 60,
      maxStrikes: 3,
    },
  },

  // Level 16 — Multi-Component Assembly
  {
    levelId: 'ma-advanced-04',
    gameId: 'module-assembly',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Multi-Component Assembly',
    conceptIntroduced: 'Multi-component assembly',
    description: 'Assemble three interconnected components that compose together.',
    data: {
      blueprints: [
        {
          componentName: 'ShieldGrid',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['a4-shield-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['a4-shield-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['a4-shield-template'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['a4-shield-imports'] },
          ],
        },
        {
          componentName: 'ShieldNode',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['a4-node-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['a4-node-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['a4-node-template'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['a4-node-class'] },
          ],
        },
        {
          componentName: 'ShieldStatus',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['a4-status-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['a4-status-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['a4-status-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['a4-status-styles'] },
          ],
        },
      ],
      parts: [
        { id: 'a4-shield-decorator', code: `@Component({ standalone: true, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'a4-shield-selector', code: `'app-shield-grid'`, slotType: 'selector', isDecoy: false },
        { id: 'a4-shield-template', code: `<app-shield-node /><app-shield-status />`, slotType: 'template', isDecoy: false },
        { id: 'a4-shield-imports', code: `imports: [ShieldNodeComponent, ShieldStatusComponent]`, slotType: 'imports', isDecoy: false },
        { id: 'a4-node-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'a4-node-selector', code: `'app-shield-node'`, slotType: 'selector', isDecoy: false },
        { id: 'a4-node-template', code: `<div>Node {{ nodeId }}: {{ strength }}%</div>`, slotType: 'template', isDecoy: false },
        { id: 'a4-node-class', code: `nodeId = 1;\nstrength = 100;`, slotType: 'class-body', isDecoy: false },
        { id: 'a4-status-decorator', code: `@Component({...})`, slotType: 'decorator', isDecoy: false },
        { id: 'a4-status-selector', code: `'app-shield-status'`, slotType: 'selector', isDecoy: false },
        { id: 'a4-status-template', code: `<p class="status">Shields: Active</p>`, slotType: 'template', isDecoy: false },
        { id: 'a4-status-styles', code: `.status { color: cyan; font-weight: bold; }`, slotType: 'styles', isDecoy: false },
        { id: 'a4-decoy1', code: `'app-shield'`, slotType: 'selector', isDecoy: true },
        { id: 'a4-decoy2', code: `<shield-node />`, slotType: 'template', isDecoy: true },
        { id: 'a4-decoy3', code: `imports: [ShieldModule]`, slotType: 'imports', isDecoy: true },
        { id: 'a4-decoy4', code: `nodeId: 1;`, slotType: 'class-body', isDecoy: true },
      ],
      beltSpeed: 75,
      timeLimit: 120,
      maxStrikes: 3,
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
      blueprints: [
        {
          componentName: 'EscapePod',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['a5-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['a5-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['a5-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['a5-styles'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['a5-class'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['a5-imports'] },
          ],
        },
      ],
      parts: [
        { id: 'a5-decorator', code: `@Component({ standalone: true, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'a5-selector', code: `'app-escape-pod'`, slotType: 'selector', isDecoy: false },
        { id: 'a5-template', code: `<div>Pod {{ podId }}: {{ status }}</div>`, slotType: 'template', isDecoy: false },
        { id: 'a5-styles', code: `div { border: 2px solid orange; }`, slotType: 'styles', isDecoy: false },
        { id: 'a5-class', code: `podId = 7;\nstatus = 'Ready';`, slotType: 'class-body', isDecoy: false },
        { id: 'a5-imports', code: `imports: [CommonModule]`, slotType: 'imports', isDecoy: false },
        { id: 'a5-decoy1', code: `@Pipe({ name: 'escape' })`, slotType: 'decorator', isDecoy: true },
        { id: 'a5-decoy2', code: `'escape-pod'`, slotType: 'selector', isDecoy: true },
        { id: 'a5-decoy3', code: `<div>Pod {{ podId }: {{ status }}</div>`, slotType: 'template', isDecoy: true },
        { id: 'a5-decoy4', code: `div { border 2px solid orange; }`, slotType: 'styles', isDecoy: true },
        { id: 'a5-decoy5', code: `podId: number = 7;`, slotType: 'class-body', isDecoy: true },
        { id: 'a5-decoy6', code: `imports: [EscapeModule]`, slotType: 'imports', isDecoy: true },
      ],
      beltSpeed: 110,
      timeLimit: 40,
      maxStrikes: 3,
    },
  },

  // =========================================================================
  // BOSS TIER (Level 18)
  // =========================================================================

  // Level 18 — Emergency Module Fabrication
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
      blueprints: [
        {
          componentName: 'StationCore',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['boss-core-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['boss-core-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['boss-core-template'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['boss-core-imports'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['boss-core-class'] },
          ],
        },
        {
          componentName: 'ReactorModule',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['boss-reactor-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['boss-reactor-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['boss-reactor-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['boss-reactor-styles'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['boss-reactor-class'] },
          ],
        },
        {
          componentName: 'LifeSupportModule',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['boss-life-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['boss-life-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['boss-life-template'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['boss-life-imports'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['boss-life-class'] },
          ],
        },
        {
          componentName: 'NavigationModule',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['boss-nav-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['boss-nav-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['boss-nav-template'] },
            { slotType: 'styles', label: 'Styles', required: true, acceptsPartIds: ['boss-nav-styles'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['boss-nav-class'] },
          ],
        },
        {
          componentName: 'CommsArray',
          slots: [
            { slotType: 'decorator', label: 'Decorator', required: true, acceptsPartIds: ['boss-comms-decorator'] },
            { slotType: 'selector', label: 'Selector', required: true, acceptsPartIds: ['boss-comms-selector'] },
            { slotType: 'template', label: 'Template', required: true, acceptsPartIds: ['boss-comms-template'] },
            { slotType: 'imports', label: 'Imports', required: true, acceptsPartIds: ['boss-comms-imports'] },
            { slotType: 'class-body', label: 'Class Body', required: true, acceptsPartIds: ['boss-comms-class'] },
          ],
        },
      ],
      parts: [
        // StationCore parts
        { id: 'boss-core-decorator', code: `@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'boss-core-selector', code: `'app-station-core'`, slotType: 'selector', isDecoy: false },
        { id: 'boss-core-template', code: `<app-reactor /><app-life-support /><app-navigation /><app-comms-array />`, slotType: 'template', isDecoy: false },
        { id: 'boss-core-imports', code: `imports: [ReactorModule, LifeSupportModule, NavigationModule, CommsArrayComponent]`, slotType: 'imports', isDecoy: false },
        { id: 'boss-core-class', code: `stationName = 'Nexus';\ngetStatus() { return 'operational'; }`, slotType: 'class-body', isDecoy: false },
        // ReactorModule parts
        { id: 'boss-reactor-decorator', code: `@Component({ standalone: true, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'boss-reactor-selector', code: `'app-reactor'`, slotType: 'selector', isDecoy: false },
        { id: 'boss-reactor-template', code: `<div class="reactor">Output: {{ output }}MW</div>`, slotType: 'template', isDecoy: false },
        { id: 'boss-reactor-styles', code: `.reactor { color: orange; border: 1px solid orange; }`, slotType: 'styles', isDecoy: false },
        { id: 'boss-reactor-class', code: `output = 500;\nfuelLevel = 87;`, slotType: 'class-body', isDecoy: false },
        // LifeSupportModule parts
        { id: 'boss-life-decorator', code: `@Component({ standalone: true, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'boss-life-selector', code: `'app-life-support'`, slotType: 'selector', isDecoy: false },
        { id: 'boss-life-template', code: `<p>O2: {{ oxygenLevel }}% | Temp: {{ temp }}C</p>`, slotType: 'template', isDecoy: false },
        { id: 'boss-life-imports', code: `imports: [CommonModule]`, slotType: 'imports', isDecoy: false },
        { id: 'boss-life-class', code: `oxygenLevel = 98;\ntemp = 21;`, slotType: 'class-body', isDecoy: false },
        // NavigationModule parts
        { id: 'boss-nav-decorator', code: `@Component({ standalone: true, host: { '[class.active]': 'isActive' }, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'boss-nav-selector', code: `'app-navigation'`, slotType: 'selector', isDecoy: false },
        { id: 'boss-nav-template', code: `<nav>Heading: {{ heading }}deg | Speed: {{ speed }}</nav>`, slotType: 'template', isDecoy: false },
        { id: 'boss-nav-styles', code: `nav { background: #1a1a2e; padding: 8px; }`, slotType: 'styles', isDecoy: false },
        { id: 'boss-nav-class', code: `heading = 270;\nspeed = 'sublight';\nisActive = true;`, slotType: 'class-body', isDecoy: false },
        // CommsArray parts
        { id: 'boss-comms-decorator', code: `@Component({ standalone: true, ... })`, slotType: 'decorator', isDecoy: false },
        { id: 'boss-comms-selector', code: `'app-comms-array'`, slotType: 'selector', isDecoy: false },
        { id: 'boss-comms-template', code: `<ul><li>Channel {{ ch }}: {{ freq }}MHz</li></ul>`, slotType: 'template', isDecoy: false },
        { id: 'boss-comms-imports', code: `imports: [CommonModule]`, slotType: 'imports', isDecoy: false },
        { id: 'boss-comms-class', code: `ch = 1;\nfreq = 140.5;`, slotType: 'class-body', isDecoy: false },
        // Decoy parts
        { id: 'boss-decoy1', code: `@NgModule({ declarations: [StationCore] })`, slotType: 'decorator', isDecoy: true },
        { id: 'boss-decoy2', code: `'station-core'`, slotType: 'selector', isDecoy: true },
        { id: 'boss-decoy3', code: `<reactor-module />`, slotType: 'template', isDecoy: true },
        { id: 'boss-decoy4', code: `imports: [BrowserModule, FormsModule]`, slotType: 'imports', isDecoy: true },
        { id: 'boss-decoy5', code: `output: number = 500;`, slotType: 'class-body', isDecoy: true },
        { id: 'boss-decoy6', code: `@Component({})`, slotType: 'decorator', isDecoy: true },
        { id: 'boss-decoy7', code: `templateUrl: './station-core.html'`, slotType: 'template', isDecoy: true },
        { id: 'boss-decoy8', code: `.reactor color: orange;`, slotType: 'styles', isDecoy: true },
      ],
      beltSpeed: 85,
      timeLimit: 180,
      maxStrikes: 3,
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
