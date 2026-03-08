/**
 * A single item in a score breakdown display.
 *
 * - `isBonus: true` => styled in Solar Gold
 * - `isBonus: false` + `value < 0` => styled in Emergency Red (penalty)
 * - `isBonus: false` + `value >= 0` => default Display color (base score)
 */
export interface ScoreBreakdownItem {
  readonly label: string;
  readonly value: number;
  readonly isBonus: boolean;
  readonly isNew?: boolean;
}
