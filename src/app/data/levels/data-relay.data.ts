import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  DataRelayLevelData,
  DataStream,
  PipeDefinition,
  PipeName,
  PipeCategory,
  TargetOutput,
  TestDataItem,
} from '../../features/minigames/data-relay/data-relay.types';

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a DataStream. */
function stream(id: string, name: string, rawInput: string, isAsync?: boolean): DataStream {
  const base: DataStream = { id, name, rawInput };
  return isAsync ? { ...base, isAsync } : base;
}

/** Build a PipeDefinition. */
function pipe(
  id: string,
  pipeName: PipeName,
  displayName: string,
  category: PipeCategory,
  params?: readonly string[],
  isCustom?: boolean,
): PipeDefinition {
  const base: PipeDefinition = { id, pipeName, displayName, category };
  return {
    ...base,
    ...(params ? { params } : {}),
    ...(isCustom ? { isCustom } : {}),
  };
}

/** Build a TargetOutput. */
function target(streamId: string, expectedOutput: string, requiredPipes: readonly string[]): TargetOutput {
  return { streamId, expectedOutput, requiredPipes };
}

/** Build a TestDataItem. */
function test(id: string, streamId: string, input: string, expectedOutput: string): TestDataItem {
  return { id, streamId, input, expectedOutput };
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const DATA_RELAY_LEVELS: readonly LevelDefinition<DataRelayLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-6) — "Using Pipes" (Ch 20)
  // =========================================================================

  // Level 1 — Signal Boost (UpperCasePipe)
  {
    levelId: 'dr-basic-01',
    gameId: 'data-relay',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'Signal Boost',
    conceptIntroduced: 'UpperCasePipe',
    description: 'Apply the uppercase pipe to boost a crew name signal to all-caps.',
    data: {
      streams: [
        stream('dr-b01-s1', 'Crew Name', 'commander shepard'),
      ],
      availablePipes: [
        pipe('dr-b01-p1', 'uppercase', 'Uppercase', 'text'),
      ],
      targetOutputs: [
        target('dr-b01-s1', 'COMMANDER SHEPARD', ['dr-b01-p1']),
      ],
      testData: [
        test('dr-b01-t1', 'dr-b01-s1', 'commander shepard', 'COMMANDER SHEPARD'),
        test('dr-b01-t2', 'dr-b01-s1', 'jane doe', 'JANE DOE'),
      ],
    },
  },

  // Level 2 — Case Protocol (LowerCasePipe / TitleCasePipe)
  {
    levelId: 'dr-basic-02',
    gameId: 'data-relay',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Case Protocol',
    conceptIntroduced: 'LowerCasePipe / TitleCasePipe',
    description: 'Route two streams through different case pipes: lowercase for alerts, titlecase for names.',
    data: {
      streams: [
        stream('dr-b02-s1', 'Alert Status', 'ALERT STATUS'),
        stream('dr-b02-s2', 'Protocol Name', 'emergency protocol'),
      ],
      availablePipes: [
        pipe('dr-b02-p1', 'lowercase', 'Lowercase', 'text'),
        pipe('dr-b02-p2', 'titlecase', 'Title Case', 'text'),
      ],
      targetOutputs: [
        target('dr-b02-s1', 'alert status', ['dr-b02-p1']),
        target('dr-b02-s2', 'Emergency Protocol', ['dr-b02-p2']),
      ],
      testData: [
        test('dr-b02-t1', 'dr-b02-s1', 'ALERT STATUS', 'alert status'),
        test('dr-b02-t2', 'dr-b02-s2', 'emergency protocol', 'Emergency Protocol'),
        test('dr-b02-t3', 'dr-b02-s1', 'RED ALERT', 'red alert'),
      ],
    },
  },

  // Level 3 — Timestamp Relay (DatePipe)
  {
    levelId: 'dr-basic-03',
    gameId: 'data-relay',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Timestamp Relay',
    conceptIntroduced: 'DatePipe',
    description: 'Format a raw ISO timestamp into a human-readable date using the date pipe.',
    data: {
      streams: [
        stream('dr-b03-s1', 'Event Timestamp', '2026-03-06T10:30:00Z'),
      ],
      availablePipes: [
        pipe('dr-b03-p1', 'date', 'Date (mediumDate)', 'date', ['mediumDate']),
      ],
      targetOutputs: [
        target('dr-b03-s1', 'Mar 6, 2026', ['dr-b03-p1']),
      ],
      testData: [
        test('dr-b03-t1', 'dr-b03-s1', '2026-03-06T10:30:00Z', 'Mar 6, 2026'),
        test('dr-b03-t2', 'dr-b03-s1', '2025-12-25T00:00:00Z', 'Dec 25, 2025'),
      ],
    },
  },

  // Level 4 — Numeric Readout (DecimalPipe)
  {
    levelId: 'dr-basic-04',
    gameId: 'data-relay',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Numeric Readout',
    conceptIntroduced: 'DecimalPipe',
    description: 'Format a raw numeric reading with 2 decimal places using the decimal pipe.',
    data: {
      streams: [
        stream('dr-b04-s1', 'Sensor Reading', '1234.5'),
      ],
      availablePipes: [
        pipe('dr-b04-p1', 'decimal', 'Decimal (1.2-2)', 'number', ['1.2-2']),
      ],
      targetOutputs: [
        target('dr-b04-s1', '1,234.50', ['dr-b04-p1']),
      ],
      testData: [
        test('dr-b04-t1', 'dr-b04-s1', '1234.5', '1,234.50'),
        test('dr-b04-t2', 'dr-b04-s1', '42', '42.00'),
      ],
    },
  },

  // Level 5 — Credits Display (CurrencyPipe)
  {
    levelId: 'dr-basic-05',
    gameId: 'data-relay',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Credits Display',
    conceptIntroduced: 'CurrencyPipe',
    description: 'Format a numeric amount as a USD currency display using the currency pipe.',
    data: {
      streams: [
        stream('dr-b05-s1', 'Credit Balance', '9999.99'),
      ],
      availablePipes: [
        pipe('dr-b05-p1', 'currency', 'Currency (USD)', 'number', ['USD']),
      ],
      targetOutputs: [
        target('dr-b05-s1', '$9,999.99', ['dr-b05-p1']),
      ],
      testData: [
        test('dr-b05-t1', 'dr-b05-s1', '9999.99', '$9,999.99'),
        test('dr-b05-t2', 'dr-b05-s1', '50', '$50.00'),
      ],
    },
  },

  // Level 6 — Multi-Stream Format (Multiple pipes)
  {
    levelId: 'dr-basic-06',
    gameId: 'data-relay',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Multi-Stream Format',
    conceptIntroduced: 'Multiple built-in pipes',
    description: 'Route three different data streams through the correct pipe: text, date, and number.',
    data: {
      streams: [
        stream('dr-b06-s1', 'Station Name', 'nexus station'),
        stream('dr-b06-s2', 'Launch Date', '2026-06-15T08:00:00Z'),
        stream('dr-b06-s3', 'Hull Temp', '372.8'),
      ],
      availablePipes: [
        pipe('dr-b06-p1', 'uppercase', 'Uppercase', 'text'),
        pipe('dr-b06-p2', 'date', 'Date (mediumDate)', 'date', ['mediumDate']),
        pipe('dr-b06-p3', 'decimal', 'Decimal (1.1-1)', 'number', ['1.1-1']),
      ],
      targetOutputs: [
        target('dr-b06-s1', 'NEXUS STATION', ['dr-b06-p1']),
        target('dr-b06-s2', 'Jun 15, 2026', ['dr-b06-p2']),
        target('dr-b06-s3', '372.8', ['dr-b06-p3']),
      ],
      testData: [
        test('dr-b06-t1', 'dr-b06-s1', 'nexus station', 'NEXUS STATION'),
        test('dr-b06-t2', 'dr-b06-s2', '2026-06-15T08:00:00Z', 'Jun 15, 2026'),
        test('dr-b06-t3', 'dr-b06-s3', '372.8', '372.8'),
      ],
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 7-12) — "Formatting with Pipes" (Ch 21)
  // =========================================================================

  // Level 7 — Custom Date Format (Pipe parameters)
  {
    levelId: 'dr-intermediate-01',
    gameId: 'data-relay',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Custom Date Format',
    conceptIntroduced: 'Pipe parameters',
    description: 'Apply a custom format string parameter to the date pipe for precise date output.',
    data: {
      streams: [
        stream('dr-i01-s1', 'Mission Date', '2026-03-06T10:30:00Z'),
      ],
      availablePipes: [
        pipe('dr-i01-p1', 'date', 'Date (yyyy-MM-dd)', 'date', ['yyyy-MM-dd']),
      ],
      targetOutputs: [
        target('dr-i01-s1', '2026-03-06', ['dr-i01-p1']),
      ],
      testData: [
        test('dr-i01-t1', 'dr-i01-s1', '2026-03-06T10:30:00Z', '2026-03-06'),
        test('dr-i01-t2', 'dr-i01-s1', '2025-01-15T12:00:00Z', '2025-01-15'),
      ],
    },
  },

  // Level 8 — Chain Reaction (Pipe chaining)
  {
    levelId: 'dr-intermediate-02',
    gameId: 'data-relay',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Chain Reaction',
    conceptIntroduced: 'Pipe chaining',
    description: 'Chain decimal and currency pipes together to format a raw number into a currency display.',
    data: {
      streams: [
        stream('dr-i02-s1', 'Raw Amount', '1234.5'),
      ],
      availablePipes: [
        pipe('dr-i02-p1', 'decimal', 'Decimal (1.2-2)', 'number', ['1.2-2']),
        pipe('dr-i02-p2', 'currency', 'Currency (USD)', 'number', ['USD']),
      ],
      targetOutputs: [
        target('dr-i02-s1', '$1,234.50', ['dr-i02-p1', 'dr-i02-p2']),
      ],
      testData: [
        test('dr-i02-t1', 'dr-i02-s1', '1234.5', '$1,234.50'),
        test('dr-i02-t2', 'dr-i02-s1', '99', '$99.00'),
      ],
    },
  },

  // Level 9 — Percentage Report (PercentPipe)
  {
    levelId: 'dr-intermediate-03',
    gameId: 'data-relay',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Percentage Report',
    conceptIntroduced: 'PercentPipe',
    description: 'Convert decimal fractions into percentage displays using the percent pipe.',
    data: {
      streams: [
        stream('dr-i03-s1', 'Hull Integrity', '0.756'),
        stream('dr-i03-s2', 'Fuel Level', '0.432'),
      ],
      availablePipes: [
        pipe('dr-i03-p1', 'percent', 'Percent', 'number', ['1.2-2']),
      ],
      targetOutputs: [
        target('dr-i03-s1', '75.60%', ['dr-i03-p1']),
        target('dr-i03-s2', '43.20%', ['dr-i03-p1']),
      ],
      testData: [
        test('dr-i03-t1', 'dr-i03-s1', '0.756', '75.60%'),
        test('dr-i03-t2', 'dr-i03-s2', '0.432', '43.20%'),
        test('dr-i03-t3', 'dr-i03-s1', '1.0', '100.00%'),
      ],
    },
  },

  // Level 10 — Data Extraction (SlicePipe)
  {
    levelId: 'dr-intermediate-04',
    gameId: 'data-relay',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Data Extraction',
    conceptIntroduced: 'SlicePipe',
    description: 'Extract substrings from long data streams using the slice pipe.',
    data: {
      streams: [
        stream('dr-i04-s1', 'Station ID', 'Nexus Station Alpha'),
        stream('dr-i04-s2', 'Serial Code', 'NXS-20260306-ALPHA'),
      ],
      availablePipes: [
        pipe('dr-i04-p1', 'slice', 'Slice (0:5)', 'text', ['0', '5']),
        pipe('dr-i04-p2', 'slice', 'Slice (4:12)', 'text', ['4', '12']),
      ],
      targetOutputs: [
        target('dr-i04-s1', 'Nexus', ['dr-i04-p1']),
        target('dr-i04-s2', '20260306', ['dr-i04-p2']),
      ],
      testData: [
        test('dr-i04-t1', 'dr-i04-s1', 'Nexus Station Alpha', 'Nexus'),
        test('dr-i04-t2', 'dr-i04-s2', 'NXS-20260306-ALPHA', '20260306'),
      ],
    },
  },

  // Level 11 — Live Telemetry (AsyncPipe)
  {
    levelId: 'dr-intermediate-05',
    gameId: 'data-relay',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Live Telemetry',
    conceptIntroduced: 'AsyncPipe',
    description: 'Use the async pipe to resolve observable telemetry data into a display value.',
    data: {
      streams: [
        stream('dr-i05-s1', 'Temperature Feed', '42.7', true),
      ],
      availablePipes: [
        pipe('dr-i05-p1', 'async', 'Async', 'text'),
      ],
      targetOutputs: [
        target('dr-i05-s1', '42.7', ['dr-i05-p1']),
      ],
      testData: [
        test('dr-i05-t1', 'dr-i05-s1', '42.7', '42.7'),
        test('dr-i05-t2', 'dr-i05-s1', '98.6', '98.6'),
      ],
    },
  },

  // Level 12 — Relay Challenge (Mixed pipes, multiple streams)
  {
    levelId: 'dr-intermediate-06',
    gameId: 'data-relay',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Relay Challenge',
    conceptIntroduced: 'Mixed built-in pipes',
    description: 'Route four data streams through the correct built-in pipes: uppercase, date, currency, and percent.',
    data: {
      streams: [
        stream('dr-i06-s1', 'Commander Name', 'ada lovelace'),
        stream('dr-i06-s2', 'Mission Start', '2026-07-04T00:00:00Z'),
        stream('dr-i06-s3', 'Budget', '150000'),
        stream('dr-i06-s4', 'Completion Rate', '0.89'),
      ],
      availablePipes: [
        pipe('dr-i06-p1', 'uppercase', 'Uppercase', 'text'),
        pipe('dr-i06-p2', 'date', 'Date (mediumDate)', 'date', ['mediumDate']),
        pipe('dr-i06-p3', 'currency', 'Currency (USD)', 'number', ['USD']),
        pipe('dr-i06-p4', 'percent', 'Percent', 'number', ['1.0-0']),
      ],
      targetOutputs: [
        target('dr-i06-s1', 'ADA LOVELACE', ['dr-i06-p1']),
        target('dr-i06-s2', 'Jul 4, 2026', ['dr-i06-p2']),
        target('dr-i06-s3', '$150,000.00', ['dr-i06-p3']),
        target('dr-i06-s4', '89%', ['dr-i06-p4']),
      ],
      testData: [
        test('dr-i06-t1', 'dr-i06-s1', 'ada lovelace', 'ADA LOVELACE'),
        test('dr-i06-t2', 'dr-i06-s2', '2026-07-04T00:00:00Z', 'Jul 4, 2026'),
        test('dr-i06-t3', 'dr-i06-s3', '150000', '$150,000.00'),
        test('dr-i06-t4', 'dr-i06-s4', '0.89', '89%'),
      ],
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 13-17) — "Custom Pipes" (Ch 22)
  // =========================================================================

  // Level 13 — Distance Converter (Custom pure pipe)
  {
    levelId: 'dr-advanced-01',
    gameId: 'data-relay',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Distance Converter',
    conceptIntroduced: 'Custom pipe (pure)',
    description: 'Create a custom pure pipe to convert kilometers into light-years for astronomical data.',
    data: {
      streams: [
        stream('dr-a01-s1', 'Distance (km)', '9460730472580.8'),
      ],
      availablePipes: [
        pipe('dr-a01-p1', 'distance', 'Distance (km to ly)', 'custom', ['km', 'ly'], true),
      ],
      targetOutputs: [
        target('dr-a01-s1', '1.00 ly', ['dr-a01-p1']),
      ],
      testData: [
        test('dr-a01-t1', 'dr-a01-s1', '9460730472580.8', '1.00 ly'),
        test('dr-a01-t2', 'dr-a01-s1', '18921460945161.6', '2.00 ly'),
      ],
    },
  },

  // Level 14 — Status Monitor (Custom pipe with params)
  {
    levelId: 'dr-advanced-02',
    gameId: 'data-relay',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Status Monitor',
    conceptIntroduced: 'Custom pipe with params',
    description: 'Build a custom pipe that maps numeric readings to status labels based on threshold parameters.',
    data: {
      streams: [
        stream('dr-a02-s1', 'Engine Temp', '87'),
        stream('dr-a02-s2', 'Reactor Output', '42'),
      ],
      availablePipes: [
        pipe('dr-a02-p1', 'status', 'Status (high=90)', 'custom', ['90', 'CRITICAL', 'NOMINAL'], true),
        pipe('dr-a02-p2', 'status', 'Status (high=50)', 'custom', ['50', 'CRITICAL', 'NOMINAL'], true),
      ],
      targetOutputs: [
        target('dr-a02-s1', 'NOMINAL', ['dr-a02-p1']),
        target('dr-a02-s2', 'NOMINAL', ['dr-a02-p2']),
      ],
      testData: [
        test('dr-a02-t1', 'dr-a02-s1', '87', 'NOMINAL'),
        test('dr-a02-t2', 'dr-a02-s1', '95', 'CRITICAL'),
        test('dr-a02-t3', 'dr-a02-s2', '42', 'NOMINAL'),
        test('dr-a02-t4', 'dr-a02-s2', '55', 'CRITICAL'),
      ],
    },
  },

  // Level 15 — Time Tracker (Custom impure pipe)
  {
    levelId: 'dr-advanced-03',
    gameId: 'data-relay',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Time Tracker',
    conceptIntroduced: 'Custom pipe (impure)',
    description: 'Build a custom impure pipe that converts timestamps into relative time strings.',
    data: {
      streams: [
        stream('dr-a03-s1', 'Last Check-In', '2026-03-06T10:30:00Z'),
      ],
      availablePipes: [
        pipe('dr-a03-p1', 'timeAgo', 'Time Ago', 'custom', undefined, true),
      ],
      targetOutputs: [
        target('dr-a03-s1', 'just now', ['dr-a03-p1']),
      ],
      testData: [
        test('dr-a03-t1', 'dr-a03-s1', '2026-03-06T10:30:00Z', 'just now'),
        test('dr-a03-t2', 'dr-a03-s1', '2026-03-06T09:30:00Z', '1 hour ago'),
      ],
    },
  },

  // Level 16 — Transform Pipeline (Complex chains)
  {
    levelId: 'dr-advanced-04',
    gameId: 'data-relay',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Transform Pipeline',
    conceptIntroduced: 'Complex pipe chains',
    description: 'Chain four or more pipes on each stream to produce heavily transformed output.',
    data: {
      streams: [
        stream('dr-a04-s1', 'Crew Report', 'lt. commander data, uss enterprise'),
        stream('dr-a04-s2', 'Cargo Manifest', '28750.339'),
      ],
      availablePipes: [
        pipe('dr-a04-p1', 'titlecase', 'Title Case', 'text'),
        pipe('dr-a04-p2', 'uppercase', 'Uppercase', 'text'),
        pipe('dr-a04-p3', 'slice', 'Slice (0:18)', 'text', ['0', '18']),
        pipe('dr-a04-p4', 'slice', 'Slice (16)', 'text', ['16']),
        pipe('dr-a04-p5', 'decimal', 'Decimal (1.2-2)', 'number', ['1.2-2']),
        pipe('dr-a04-p6', 'currency', 'Currency (USD)', 'number', ['USD']),
        pipe('dr-a04-p7', 'uppercase', 'Uppercase', 'text'),
        pipe('dr-a04-p8', 'status', 'Status (high=30000)', 'custom', ['30000', 'OVER', 'UNDER'], true),
      ],
      targetOutputs: [
        target('dr-a04-s1', 'LT. COMMANDER DATA', ['dr-a04-p1', 'dr-a04-p2', 'dr-a04-p3']),
        target('dr-a04-s2', '$28,750.34 UNDER', ['dr-a04-p5', 'dr-a04-p6', 'dr-a04-p7', 'dr-a04-p8']),
      ],
      testData: [
        test('dr-a04-t1', 'dr-a04-s1', 'lt. commander data, uss enterprise', 'LT. COMMANDER DATA'),
        test('dr-a04-t2', 'dr-a04-s2', '28750.339', '$28,750.34 UNDER'),
      ],
    },
  },

  // Level 17 — Sensor Design (Design challenge)
  {
    levelId: 'dr-advanced-05',
    gameId: 'data-relay',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Sensor Design',
    conceptIntroduced: 'Design challenge',
    description: 'Given raw sensor data and target outputs, design the correct pipe chain for three streams.',
    data: {
      streams: [
        stream('dr-a05-s1', 'Sensor Alpha', '2026-09-15T14:30:00Z'),
        stream('dr-a05-s2', 'Sensor Beta', '0.925'),
        stream('dr-a05-s3', 'Sensor Gamma', 'deep space relay nine'),
      ],
      availablePipes: [
        pipe('dr-a05-p1', 'date', 'Date (yyyy-MM-dd)', 'date', ['yyyy-MM-dd']),
        pipe('dr-a05-p2', 'percent', 'Percent', 'number', ['1.1-1']),
        pipe('dr-a05-p3', 'titlecase', 'Title Case', 'text'),
        pipe('dr-a05-p4', 'uppercase', 'Uppercase', 'text'),
        pipe('dr-a05-p5', 'slice', 'Slice (0:16)', 'text', ['0', '16']),
      ],
      targetOutputs: [
        target('dr-a05-s1', '2026-09-15', ['dr-a05-p1']),
        target('dr-a05-s2', '92.5%', ['dr-a05-p2']),
        target('dr-a05-s3', 'DEEP SPACE RELAY', ['dr-a05-p3', 'dr-a05-p4', 'dr-a05-p5']),
      ],
      testData: [
        test('dr-a05-t1', 'dr-a05-s1', '2026-09-15T14:30:00Z', '2026-09-15'),
        test('dr-a05-t2', 'dr-a05-s2', '0.925', '92.5%'),
        test('dr-a05-t3', 'dr-a05-s3', 'deep space relay nine', 'DEEP SPACE RELAY'),
      ],
    },
  },

  // =========================================================================
  // BOSS TIER (Level 18) — Full Relay Network
  // =========================================================================

  // Level 18 — Full Relay Network (Complete pipe architecture)
  {
    levelId: 'dr-boss-01',
    gameId: 'data-relay',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Full Relay Network',
    conceptIntroduced: 'Complete pipe architecture',
    description: 'Route eight data streams through a mix of built-in and custom pipes to restore the full relay network.',
    parTime: 240,
    data: {
      streams: [
        stream('dr-boss-s1', 'Captain Name', 'jean-luc picard'),
        stream('dr-boss-s2', 'Stardate', '2026-12-31T23:59:59Z'),
        stream('dr-boss-s3', 'Warp Factor', '0.875'),
        stream('dr-boss-s4', 'Energy Cost', '42500.75'),
        stream('dr-boss-s5', 'System Log', 'CRITICAL FAILURE IN SECTOR SEVEN'),
        stream('dr-boss-s6', 'Telemetry', '73.2', true),
        stream('dr-boss-s7', 'Range (km)', '47303652362904'),
        stream('dr-boss-s8', 'Core Temp', '94'),
      ],
      availablePipes: [
        pipe('dr-boss-p1', 'titlecase', 'Title Case', 'text'),
        pipe('dr-boss-p2', 'uppercase', 'Uppercase', 'text'),
        pipe('dr-boss-p3', 'date', 'Date (yyyy-MM-dd)', 'date', ['yyyy-MM-dd']),
        pipe('dr-boss-p4', 'percent', 'Percent', 'number', ['1.1-1']),
        pipe('dr-boss-p5', 'currency', 'Currency (USD)', 'number', ['USD']),
        pipe('dr-boss-p6', 'lowercase', 'Lowercase', 'text'),
        pipe('dr-boss-p7', 'slice', 'Slice (0:23)', 'text', ['0', '23']),
        pipe('dr-boss-p8', 'async', 'Async', 'text'),
        pipe('dr-boss-p9', 'distance', 'Distance (km to ly)', 'custom', ['km', 'ly'], true),
        pipe('dr-boss-p10', 'status', 'Status (high=90)', 'custom', ['90', 'CRITICAL', 'NOMINAL'], true),
        pipe('dr-boss-p11', 'decimal', 'Decimal (1.2-2)', 'number', ['1.2-2']),
      ],
      targetOutputs: [
        target('dr-boss-s1', 'JEAN-LUC PICARD', ['dr-boss-p1', 'dr-boss-p2']),
        target('dr-boss-s2', '2026-12-31', ['dr-boss-p3']),
        target('dr-boss-s3', '87.5%', ['dr-boss-p4']),
        target('dr-boss-s4', '$42,500.75', ['dr-boss-p5']),
        target('dr-boss-s5', 'critical failure in sec', ['dr-boss-p6', 'dr-boss-p7']),
        target('dr-boss-s6', '73.2', ['dr-boss-p8']),
        target('dr-boss-s7', '5.00 ly', ['dr-boss-p9']),
        target('dr-boss-s8', 'CRITICAL', ['dr-boss-p10']),
      ],
      testData: [
        test('dr-boss-t1', 'dr-boss-s1', 'jean-luc picard', 'JEAN-LUC PICARD'),
        test('dr-boss-t2', 'dr-boss-s2', '2026-12-31T23:59:59Z', '2026-12-31'),
        test('dr-boss-t3', 'dr-boss-s3', '0.875', '87.5%'),
        test('dr-boss-t4', 'dr-boss-s4', '42500.75', '$42,500.75'),
        test('dr-boss-t5', 'dr-boss-s5', 'CRITICAL FAILURE IN SECTOR SEVEN', 'critical failure in sec'),
        test('dr-boss-t6', 'dr-boss-s6', '73.2', '73.2'),
        test('dr-boss-t7', 'dr-boss-s7', '47303652362904', '5.00 ly'),
        test('dr-boss-t8', 'dr-boss-s8', '94', 'CRITICAL'),
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Level Pack
// ---------------------------------------------------------------------------

export const DATA_RELAY_LEVEL_PACK: LevelPack = {
  gameId: 'data-relay',
  levels: DATA_RELAY_LEVELS,
};
