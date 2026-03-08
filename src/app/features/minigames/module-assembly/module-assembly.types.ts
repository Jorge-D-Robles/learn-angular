// ---------------------------------------------------------------------------
// Canonical domain model types for Module Assembly minigame
// ---------------------------------------------------------------------------

/** The 6 component anatomy slot types in Module Assembly. */
export type PartSlotType =
  | 'decorator'
  | 'selector'
  | 'template'
  | 'styles'
  | 'classBody'
  | 'imports';

/** A single part on the conveyor belt. */
export interface ComponentPart {
  readonly id: string;
  readonly type: PartSlotType;
  readonly content: string;
  readonly isDecoy: boolean;
  readonly correctSlotId: string | null;
}

/** A single slot in a component blueprint. */
export interface BlueprintSlot {
  readonly id: string;
  readonly slotType: PartSlotType;
  readonly label: string;
  readonly isRequired: boolean;
  readonly isOptional: boolean;
}

/** A component blueprint with labeled slots and expected parts. */
export interface ComponentBlueprint {
  readonly name: string;
  readonly slots: readonly BlueprintSlot[];
  readonly expectedParts: readonly string[];
}

/** Metadata about a decoy part and its origin. */
export interface DecoyInfo {
  readonly originalPart: ComponentPart;
  readonly mutation: string;
}

/** Game-specific level data for Module Assembly. */
export interface ModuleAssemblyLevelData {
  readonly blueprint: ComponentBlueprint;
  readonly parts: readonly ComponentPart[];
  readonly decoys: readonly DecoyInfo[];
  readonly beltSpeed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Color mapping for each part slot type, using Nexus Station theme colors. */
export const PART_SLOT_COLORS: Readonly<Record<PartSlotType, string>> = {
  decorator: '#A855F7',   // Comm Purple
  selector: '#EAB308',    // Solar Gold
  template: '#3B82F6',    // Reactor Blue
  styles: '#22C55E',      // Sensor Green
  classBody: '#F97316',   // Alert Orange
  imports: '#8B92A8',     // Corridor (secondary)
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Returns true when a non-decoy part's type matches the slot's slotType. */
export function canPartFitSlot(part: ComponentPart, slot: BlueprintSlot): boolean {
  return !part.isDecoy && part.type === slot.slotType;
}

/** Returns true when a part is a decoy. */
export function isDecoyPart(part: ComponentPart): boolean {
  return part.isDecoy;
}
