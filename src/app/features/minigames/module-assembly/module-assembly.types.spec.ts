import type { PartSlotType } from './module-assembly.types';
import {
  ComponentPart,
  BlueprintSlot,
  ComponentBlueprint,
  DecoyInfo,
  ModuleAssemblyLevelData,
  PART_SLOT_COLORS,
  canPartFitSlot,
  isDecoyPart,
} from './module-assembly.types';

// --- Compile-time type checks ---

/** All 6 PartSlotType values assigned to verify the union is complete. */
const _decorator: PartSlotType = 'decorator';
const _selector: PartSlotType = 'selector';
const _template: PartSlotType = 'template';
const _styles: PartSlotType = 'styles';
const _classBody: PartSlotType = 'classBody';
const _imports: PartSlotType = 'imports';

// Suppress unused-variable warnings for PartSlotType compile-time checks
void [_decorator, _selector, _template, _styles, _classBody, _imports];

/** ComponentPart accepts valid part with all fields. */
const _validPart: ComponentPart = {
  id: 'p1',
  type: 'decorator',
  content: '@Component({ selector: "app-root" })',
  isDecoy: false,
  correctSlotId: 's1',
};

/** ComponentPart accepts correctSlotId: null for decoys. */
const _decoyPart: ComponentPart = {
  id: 'p2',
  type: 'template',
  content: '<div>wrong</div>',
  isDecoy: true,
  correctSlotId: null,
};

/** BlueprintSlot accepts valid slot with required id. */
const _validSlot: BlueprintSlot = {
  id: 's1',
  slotType: 'decorator',
  label: 'Decorator',
  isRequired: true,
  isOptional: false,
};

/** ComponentBlueprint accepts expectedParts array. */
const _validBlueprint: ComponentBlueprint = {
  name: 'AppComponent',
  slots: [_validSlot],
  expectedParts: ['p1'],
};

/** DecoyInfo accepts originalPart as ComponentPart reference. */
const _validDecoyInfo: DecoyInfo = {
  originalPart: _validPart,
  mutation: 'Changed selector to invalid value',
};

/** ModuleAssemblyLevelData accepts valid level data. */
const _validLevelData: ModuleAssemblyLevelData = {
  blueprint: _validBlueprint,
  parts: [_validPart, _decoyPart],
  decoys: [_validDecoyInfo],
};

// Suppress unused variable warnings for compile-time checks
void [_validPart, _decoyPart, _validSlot, _validBlueprint, _validDecoyInfo, _validLevelData];

// --- Runtime test suites ---

describe('PART_SLOT_COLORS', () => {
  it('should have 6 entries', () => {
    expect(Object.keys(PART_SLOT_COLORS).length).toBe(6);
  });

  it('should map decorator to purple (#A855F7)', () => {
    expect(PART_SLOT_COLORS.decorator).toBe('#A855F7');
  });

  it('should map template to blue (#3B82F6)', () => {
    expect(PART_SLOT_COLORS.template).toBe('#3B82F6');
  });

  it('should map styles to green (#22C55E)', () => {
    expect(PART_SLOT_COLORS.styles).toBe('#22C55E');
  });

  it('should map classBody to orange (#F97316)', () => {
    expect(PART_SLOT_COLORS.classBody).toBe('#F97316');
  });
});

describe('canPartFitSlot', () => {
  it('should return true when part.type matches slot.slotType and part is not a decoy', () => {
    const part: ComponentPart = {
      id: 'p1',
      type: 'template',
      content: '<h1>Hello</h1>',
      isDecoy: false,
      correctSlotId: 's1',
    };
    const slot: BlueprintSlot = {
      id: 's1',
      slotType: 'template',
      label: 'Template',
      isRequired: true,
      isOptional: false,
    };

    expect(canPartFitSlot(part, slot)).toBe(true);
  });

  it('should return false when types differ', () => {
    const part: ComponentPart = {
      id: 'p1',
      type: 'decorator',
      content: '@Component({})',
      isDecoy: false,
      correctSlotId: 's1',
    };
    const slot: BlueprintSlot = {
      id: 's2',
      slotType: 'template',
      label: 'Template',
      isRequired: true,
      isOptional: false,
    };

    expect(canPartFitSlot(part, slot)).toBe(false);
  });

  it('should return false when part is a decoy even if type matches', () => {
    const part: ComponentPart = {
      id: 'p1',
      type: 'template',
      content: '<div>wrong</div>',
      isDecoy: true,
      correctSlotId: null,
    };
    const slot: BlueprintSlot = {
      id: 's1',
      slotType: 'template',
      label: 'Template',
      isRequired: true,
      isOptional: false,
    };

    expect(canPartFitSlot(part, slot)).toBe(false);
  });
});

describe('isDecoyPart', () => {
  it('should return true for decoy parts', () => {
    const part: ComponentPart = {
      id: 'p1',
      type: 'styles',
      content: '.wrong { color: red }',
      isDecoy: true,
      correctSlotId: null,
    };

    expect(isDecoyPart(part)).toBe(true);
  });

  it('should return false for non-decoy parts', () => {
    const part: ComponentPart = {
      id: 'p1',
      type: 'styles',
      content: ':host { display: block }',
      isDecoy: false,
      correctSlotId: 's1',
    };

    expect(isDecoyPart(part)).toBe(false);
  });
});

describe('ComponentPart', () => {
  it('should accept valid part with all fields', () => {
    const part: ComponentPart = {
      id: 'part-1',
      type: 'decorator',
      content: '@Component({ selector: "app-root" })',
      isDecoy: false,
      correctSlotId: 'slot-1',
    };

    expect(part.id).toBe('part-1');
    expect(part.type).toBe('decorator');
    expect(part.content).toBe('@Component({ selector: "app-root" })');
    expect(part.isDecoy).toBe(false);
    expect(part.correctSlotId).toBe('slot-1');
  });

  it('should accept correctSlotId: null for decoys', () => {
    const part: ComponentPart = {
      id: 'part-2',
      type: 'template',
      content: '<div>wrong</div>',
      isDecoy: true,
      correctSlotId: null,
    };

    expect(part.isDecoy).toBe(true);
    expect(part.correctSlotId).toBeNull();
  });
});

describe('BlueprintSlot', () => {
  it('should accept valid slot with required id', () => {
    const slot: BlueprintSlot = {
      id: 'slot-1',
      slotType: 'imports',
      label: 'Imports',
      isRequired: true,
      isOptional: false,
    };

    expect(slot.id).toBe('slot-1');
    expect(slot.slotType).toBe('imports');
    expect(slot.label).toBe('Imports');
    expect(slot.isRequired).toBe(true);
    expect(slot.isOptional).toBe(false);
  });
});

describe('ComponentBlueprint', () => {
  it('should accept expectedParts array', () => {
    const blueprint: ComponentBlueprint = {
      name: 'HeroComponent',
      slots: [
        { id: 's1', slotType: 'decorator', label: 'Decorator', isRequired: true, isOptional: false },
        { id: 's2', slotType: 'template', label: 'Template', isRequired: true, isOptional: false },
      ],
      expectedParts: ['p1', 'p2', 'p3'],
    };

    expect(blueprint.name).toBe('HeroComponent');
    expect(blueprint.slots.length).toBe(2);
    expect(blueprint.expectedParts).toEqual(['p1', 'p2', 'p3']);
  });
});

describe('DecoyInfo', () => {
  it('should accept originalPart as ComponentPart reference', () => {
    const original: ComponentPart = {
      id: 'p-orig',
      type: 'selector',
      content: 'app-hero',
      isDecoy: false,
      correctSlotId: 's1',
    };
    const decoyInfo: DecoyInfo = {
      originalPart: original,
      mutation: 'Changed selector prefix from app- to ng-',
    };

    expect(decoyInfo.originalPart).toBe(original);
    expect(decoyInfo.mutation).toBe('Changed selector prefix from app- to ng-');
  });
});

describe('ModuleAssemblyLevelData', () => {
  it('should accept valid level data', () => {
    const levelData: ModuleAssemblyLevelData = {
      blueprint: {
        name: 'TestComponent',
        slots: [{ id: 's1', slotType: 'classBody', label: 'Class Body', isRequired: true, isOptional: false }],
        expectedParts: ['p1'],
      },
      parts: [
        { id: 'p1', type: 'classBody', content: 'export class TestComponent {}', isDecoy: false, correctSlotId: 's1' },
      ],
      decoys: [],
    };

    expect(levelData.blueprint.name).toBe('TestComponent');
    expect(levelData.parts.length).toBe(1);
    expect(levelData.decoys.length).toBe(0);
  });
});
