import { TimeFormatPipe } from './time-format.pipe';

describe('TimeFormatPipe', () => {
  let pipe: TimeFormatPipe;

  beforeEach(() => {
    pipe = new TimeFormatPipe();
  });

  describe('long format (default)', () => {
    it('should format 0 as "0s"', () => {
      expect(pipe.transform(0, 'long')).toBe('0s');
    });

    it('should format sub-minute seconds', () => {
      expect(pipe.transform(45, 'long')).toBe('45s');
    });

    it('should format exact minute, omitting zero seconds', () => {
      expect(pipe.transform(60, 'long')).toBe('1m');
    });

    it('should format minutes and seconds', () => {
      expect(pipe.transform(90, 'long')).toBe('1m 30s');
    });

    it('should format exact hour, omitting zero minutes and seconds', () => {
      expect(pipe.transform(3600, 'long')).toBe('1h');
    });

    it('should format all three units', () => {
      expect(pipe.transform(3661, 'long')).toBe('1h 1m 1s');
    });

    it('should format multi-hour value', () => {
      expect(pipe.transform(8130, 'long')).toBe('2h 15m 30s');
    });

    it('should format a full day', () => {
      expect(pipe.transform(86400, 'long')).toBe('24h');
    });
  });

  describe('short format', () => {
    it('should format 0 as "0:00"', () => {
      expect(pipe.transform(0, 'short')).toBe('0:00');
    });

    it('should format sub-minute seconds', () => {
      expect(pipe.transform(45, 'short')).toBe('0:45');
    });

    it('should format minutes and seconds', () => {
      expect(pipe.transform(90, 'short')).toBe('1:30');
    });

    it('should format full h:mm:ss with zero-padding', () => {
      expect(pipe.transform(3661, 'short')).toBe('1:01:01');
    });

    it('should format multi-hour value', () => {
      expect(pipe.transform(8130, 'short')).toBe('2:15:30');
    });
  });

  describe('timer format', () => {
    it('should format 0 as "00:00.0"', () => {
      expect(pipe.transform(0, 'timer')).toBe('00:00.0');
    });

    it('should format sub-minute seconds', () => {
      expect(pipe.transform(45, 'timer')).toBe('00:45.0');
    });

    it('should format mid-range with minute rollover', () => {
      expect(pipe.transform(90, 'timer')).toBe('01:30.0');
    });

    it('should format fractional seconds from acceptance criteria', () => {
      expect(pipe.transform(222.5, 'timer')).toBe('03:42.5');
    });

    it('should format tenths of a second', () => {
      expect(pipe.transform(45.3, 'timer')).toBe('00:45.3');
    });

    it('should switch to hh:mm:ss at exact hour', () => {
      expect(pipe.transform(3600, 'timer')).toBe('01:00:00');
    });

    it('should use hh:mm:ss for hour+ values', () => {
      expect(pipe.transform(3661, 'timer')).toBe('01:01:01');
    });

    it('should truncate tenths for hour+ values', () => {
      expect(pipe.transform(3661.7, 'timer')).toBe('01:01:01');
    });
  });

  describe('edge cases', () => {
    it('should clamp negative numbers to 0', () => {
      expect(pipe.transform(-5, 'long')).toBe('0s');
    });

    it('should return empty string for NaN', () => {
      expect(pipe.transform(NaN, 'long')).toBe('');
    });

    it('should return empty string for null', () => {
      expect(pipe.transform(null as any, 'long')).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined as any, 'long')).toBe('');
    });
  });

  describe('default format', () => {
    it('should default to long format when no format is specified', () => {
      expect(pipe.transform(8130)).toBe('2h 15m 30s');
    });
  });
});
