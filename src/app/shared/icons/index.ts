import {
  House,
  Map,
  Gamepad2,
  User,
  Settings,
  Star,
  Heart,
  Pause,
  Play,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  X,
} from 'lucide-angular';
import type { LucideIcons } from 'lucide-angular';

export { LucideAngularModule } from 'lucide-angular';

/**
 * All icons registered for the application.
 * Add new icons here when needed — they will be tree-shaken if unused.
 *
 * Icon name mapping (ticket name -> Lucide name):
 *   home     -> House        | map      -> Map
 *   gamepad  -> Gamepad2     | user     -> User
 *   settings -> Settings     | star     -> Star
 *   heart    -> Heart        | pause    -> Pause
 *   play     -> Play         | chevron  -> ChevronRight/Down/Left/Up
 *   x-close  -> X
 */
export const APP_ICONS: LucideIcons = {
  House,
  Map,
  Gamepad2,
  User,
  Settings,
  Star,
  Heart,
  Pause,
  Play,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  X,
};
