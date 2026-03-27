// ---------------------------------------------------------------------------
// ConveyorBeltService — visual/animation layer for the Module Assembly belt
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service manages minigame-specific visual state
// scoped to the Module Assembly component tree. Providing it locally ensures
// automatic cleanup on component destroy and prevents leaked state between
// minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable, signal, computed, type Signal } from '@angular/core';
import type { ComponentPart } from './module-assembly.types';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

/** A belt part with its current horizontal position (visual/animation concern). */
export interface BeltPart {
  readonly part: ComponentPart;
  readonly x: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default belt length in pixels (parts enter from the right at this x). */
export const DEFAULT_BELT_LENGTH = 800;

/** Minimum gap between parts on the belt, in pixels. */
export const PART_GAP = 40;

/** Estimated width per character of part content, in pixels. */
export const CHAR_WIDTH = 8;

/** Minimum part width for layout purposes, in pixels. */
export const MIN_PART_WIDTH = 100;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ConveyorBeltService {
  private readonly _parts = signal<readonly BeltPart[]>([]);
  private readonly _beltSpeed = signal(0);
  private readonly _beltLength = signal(DEFAULT_BELT_LENGTH);

  /** Current list of parts on the belt with positions. */
  readonly parts: Signal<readonly BeltPart[]> = this._parts.asReadonly();

  /** Current scroll speed in pixels/second. */
  readonly beltSpeed: Signal<number> = this._beltSpeed.asReadonly();

  /** Current belt length in pixels. */
  readonly beltLength: Signal<number> = this._beltLength.asReadonly();

  /**
   * True when all parts have scrolled past the belt end (x < 0).
   *
   * **Important contract:** `removePart()` is only for player pickup. Parts that
   * scroll off the belt (x < 0) remain in the array so this signal can detect
   * them. An empty parts array (all removed by player) returns `false` — that is
   * completion, not exhaustion. Exhaustion means parts exist but all scrolled off
   * before the player could grab them.
   */
  readonly isExhausted: Signal<boolean> = computed(() => {
    const parts = this._parts();
    return parts.length > 0 && parts.every((bp) => bp.x < 0);
  });

  /** Adds a part at the right edge of the belt (x = beltLength). */
  addPart(part: ComponentPart): void {
    this._parts.update((current) => [
      ...current,
      { part, x: this._beltLength() },
    ]);
  }

  /**
   * Advances all part positions by -(beltSpeed * deltaTime).
   * deltaTime is in seconds. Negative deltaTime is clamped to 0 (no rewind).
   * Produces new BeltPart objects each tick (immutable signal updates).
   */
  tick(deltaTime: number): void {
    const dt = Math.max(0, deltaTime);
    const speed = this._beltSpeed();
    if (speed === 0 || dt === 0) {
      return;
    }

    const displacement = speed * dt;
    this._parts.update((current) => {
      if (current.length === 0) {
        return current;
      }
      return current.map((bp) => ({ part: bp.part, x: bp.x - displacement }));
    });
  }

  /**
   * Removes a part from the belt by its part id (player pickup only).
   * No-op if the part is not found.
   */
  removePart(partId: string): void {
    this._parts.update((current) =>
      current.filter((bp) => bp.part.id !== partId),
    );
  }

  /**
   * Resets the belt with new level data. Clears existing parts, sets speed,
   * optionally sets belt length, and staggers parts with initial positions:
   * `beltLength + (index * PART_SPACING)`.
   */
  reset(
    parts: readonly ComponentPart[],
    speed: number,
    beltLength?: number,
  ): void {
    if (beltLength !== undefined) {
      this._beltLength.set(beltLength);
    } else {
      this._beltLength.set(DEFAULT_BELT_LENGTH);
    }

    this._beltSpeed.set(speed);

    const length = this._beltLength();
    let cursor = length;
    this._parts.set(
      parts.map((part) => {
        const x = cursor;
        const partWidth = Math.max(MIN_PART_WIDTH, part.content.length * CHAR_WIDTH);
        cursor += partWidth + PART_GAP;
        return { part, x };
      }),
    );
  }
}
