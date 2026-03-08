export const ANIMATION_DURATIONS = {
  uiTransition: 200,
  gameFeedback: 400,
  overlay: 300,
} as const;

export type AnimationDurationKey = keyof typeof ANIMATION_DURATIONS;

export const ANIMATION_CLASSES = {
  fadeIn: 'nx-fade-in',
  fadeOut: 'nx-fade-out',
  slideInRight: 'nx-slide-in-right',
  slideOutRight: 'nx-slide-out-right',
  scaleIn: 'nx-scale-in',
  pulse: 'nx-pulse',
} as const;

export type AnimationClassName = keyof typeof ANIMATION_CLASSES;
