import { ANIMATION_DURATIONS, ANIMATION_CLASSES } from './animations';

describe('Animation Constants', () => {
  describe('ANIMATION_DURATIONS', () => {
    it('should have uiTransition, gameFeedback, and overlay keys', () => {
      expect(Object.keys(ANIMATION_DURATIONS).sort()).toEqual(
        ['gameFeedback', 'overlay', 'uiTransition'],
      );
    });

    it('should have uiTransition set to 200', () => {
      expect(ANIMATION_DURATIONS.uiTransition).toBe(200);
    });

    it('should have gameFeedback set to 400', () => {
      expect(ANIMATION_DURATIONS.gameFeedback).toBe(400);
    });

    it('should have overlay set to 300', () => {
      expect(ANIMATION_DURATIONS.overlay).toBe(300);
    });
  });

  describe('ANIMATION_CLASSES', () => {
    it('should have all six animation class keys', () => {
      expect(Object.keys(ANIMATION_CLASSES).sort()).toEqual(
        ['fadeIn', 'fadeOut', 'pulse', 'scaleIn', 'slideInRight', 'slideOutRight'],
      );
    });

    it('should map each key to the correct nx- prefixed class name', () => {
      expect(ANIMATION_CLASSES.fadeIn).toBe('nx-fade-in');
      expect(ANIMATION_CLASSES.fadeOut).toBe('nx-fade-out');
      expect(ANIMATION_CLASSES.slideInRight).toBe('nx-slide-in-right');
      expect(ANIMATION_CLASSES.slideOutRight).toBe('nx-slide-out-right');
      expect(ANIMATION_CLASSES.scaleIn).toBe('nx-scale-in');
      expect(ANIMATION_CLASSES.pulse).toBe('nx-pulse');
    });
  });
});
