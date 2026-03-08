import {
  ApproachDirection,
  InputTransform,
  TowerInput,
  TowerOutput,
  TowerConfig,
  NoiseWave,
  GridPosition,
  GridSize,
  TowerPlacement,
  ParentBinding,
  SignalCorpsLevelData,
  PORT_TYPE_COLORS,
  isValidApproachDirection,
  isTowerConfigComplete,
  canNoiseWaveBeBlocked,
} from './signal-corps.types';

// --- Compile-time type checks ---

/** All 4 ApproachDirection values assigned to verify union completeness. */
const _north: ApproachDirection = 'north';
const _south: ApproachDirection = 'south';
const _east: ApproachDirection = 'east';
const _west: ApproachDirection = 'west';

void [_north, _south, _east, _west];

/** All 3 InputTransform values assigned to verify union completeness. */
const _numberAttr: InputTransform = 'numberAttribute';
const _booleanAttr: InputTransform = 'booleanAttribute';
const _custom: InputTransform = 'custom';

void [_numberAttr, _booleanAttr, _custom];

/** Valid TowerInput with all fields (including optional transform and aliasName). */
const _validInputFull: TowerInput = {
  name: 'frequency',
  type: 'number',
  required: true,
  transform: 'numberAttribute',
  aliasName: 'freq',
};

/** Valid TowerInput with only required fields (omitting transform and aliasName). */
const _validInputRequired: TowerInput = {
  name: 'label',
  type: 'string',
  required: false,
};

/** Valid TowerOutput with both fields. */
const _validOutput: TowerOutput = {
  name: 'signalSent',
  payloadType: 'SignalEvent',
};

/** Valid TowerConfig with inputs and outputs arrays. */
const _validConfig: TowerConfig = {
  inputs: [_validInputFull],
  outputs: [_validOutput],
};

/** Valid NoiseWave with all 4 fields. */
const _validWave: NoiseWave = {
  waveId: 'wave-1',
  approachDirection: 'north',
  typeSignature: 'number',
  damage: 10,
};

/** Valid GridPosition with row and col. */
const _validPosition: GridPosition = { row: 2, col: 3 };

/** Valid TowerPlacement with towerId, position, and config. */
const _validPlacement: TowerPlacement = {
  towerId: 'tower-1',
  position: _validPosition,
  config: _validConfig,
};

/** Valid ParentBinding for input binding type. */
const _validInputBinding: ParentBinding = {
  bindingType: 'input',
  parentProperty: 'signalFreq',
  towerPortName: 'frequency',
};

/** Valid ParentBinding for output binding type. */
const _validOutputBinding: ParentBinding = {
  bindingType: 'output',
  parentHandler: 'onSignalSent',
  towerPortName: 'signalSent',
};

/** Valid GridSize with rows and cols. */
const _validGridSize: GridSize = { rows: 8, cols: 6 };

/** Valid SignalCorpsLevelData with all fields. */
const _validLevelData: SignalCorpsLevelData = {
  gridSize: _validGridSize,
  towerPlacements: [_validPlacement],
  noiseWaves: [_validWave],
  expectedBindings: [_validInputBinding, _validOutputBinding],
  stationHealth: 100,
};

// Suppress unused variable warnings for compile-time checks
void [
  _validInputFull,
  _validInputRequired,
  _validOutput,
  _validConfig,
  _validWave,
  _validPosition,
  _validPlacement,
  _validInputBinding,
  _validOutputBinding,
  _validGridSize,
  _validLevelData,
];

// --- Runtime test suites ---

describe('PORT_TYPE_COLORS', () => {
  it('should have 2 entries', () => {
    expect(Object.keys(PORT_TYPE_COLORS).length).toBe(2);
  });

  it('should map input to Reactor Blue (#3B82F6)', () => {
    expect(PORT_TYPE_COLORS.input).toBe('#3B82F6');
  });

  it('should map output to Alert Orange (#F97316)', () => {
    expect(PORT_TYPE_COLORS.output).toBe('#F97316');
  });
});

describe('isValidApproachDirection', () => {
  it('should return true for each valid direction', () => {
    expect(isValidApproachDirection('north')).toBe(true);
    expect(isValidApproachDirection('south')).toBe(true);
    expect(isValidApproachDirection('east')).toBe(true);
    expect(isValidApproachDirection('west')).toBe(true);
  });

  it('should return false for invalid strings', () => {
    expect(isValidApproachDirection('up')).toBe(false);
    expect(isValidApproachDirection('')).toBe(false);
    expect(isValidApproachDirection('NORTH')).toBe(false);
  });

  it('should narrow type when used as type guard', () => {
    const value = 'east' as string;
    expect(isValidApproachDirection(value)).toBe(true);
    if (isValidApproachDirection(value)) {
      const dir: ApproachDirection = value;
      expect(dir).toBe('east');
    }
  });
});

describe('isTowerConfigComplete', () => {
  it('should return true for config with one valid input and one valid output', () => {
    const config: TowerConfig = {
      inputs: [{ name: 'freq', type: 'number', required: true }],
      outputs: [{ name: 'done', payloadType: 'void' }],
    };
    expect(isTowerConfigComplete(config)).toBe(true);
  });

  it('should return true for config with only valid inputs (no outputs)', () => {
    const config: TowerConfig = {
      inputs: [{ name: 'freq', type: 'number', required: true }],
      outputs: [],
    };
    expect(isTowerConfigComplete(config)).toBe(true);
  });

  it('should return true for config with only valid outputs (no inputs)', () => {
    const config: TowerConfig = {
      inputs: [],
      outputs: [{ name: 'done', payloadType: 'void' }],
    };
    expect(isTowerConfigComplete(config)).toBe(true);
  });

  it('should return false for empty config (no inputs, no outputs)', () => {
    const config: TowerConfig = { inputs: [], outputs: [] };
    expect(isTowerConfigComplete(config)).toBe(false);
  });

  it('should return false when any input has empty name or type', () => {
    const configEmptyName: TowerConfig = {
      inputs: [{ name: '', type: 'number', required: true }],
      outputs: [],
    };
    expect(isTowerConfigComplete(configEmptyName)).toBe(false);

    const configEmptyType: TowerConfig = {
      inputs: [{ name: 'freq', type: '', required: true }],
      outputs: [],
    };
    expect(isTowerConfigComplete(configEmptyType)).toBe(false);
  });

  it('should return false when any output has empty name or payloadType', () => {
    const configEmptyName: TowerConfig = {
      inputs: [],
      outputs: [{ name: '', payloadType: 'void' }],
    };
    expect(isTowerConfigComplete(configEmptyName)).toBe(false);

    const configEmptyPayload: TowerConfig = {
      inputs: [],
      outputs: [{ name: 'done', payloadType: '' }],
    };
    expect(isTowerConfigComplete(configEmptyPayload)).toBe(false);
  });
});

describe('canNoiseWaveBeBlocked', () => {
  const basePlacement: TowerPlacement = {
    towerId: 'tower-1',
    position: { row: 0, col: 0 },
    config: {
      inputs: [{ name: 'freq', type: 'number', required: true }],
      outputs: [{ name: 'done', payloadType: 'SignalEvent' }],
    },
  };

  it('should return true when wave typeSignature matches an input type', () => {
    const wave: NoiseWave = { waveId: 'w1', approachDirection: 'north', typeSignature: 'number', damage: 5 };
    expect(canNoiseWaveBeBlocked(wave, basePlacement)).toBe(true);
  });

  it('should return true when wave typeSignature matches an output payloadType', () => {
    const wave: NoiseWave = { waveId: 'w2', approachDirection: 'south', typeSignature: 'SignalEvent', damage: 8 };
    expect(canNoiseWaveBeBlocked(wave, basePlacement)).toBe(true);
  });

  it('should return false when wave typeSignature matches nothing', () => {
    const wave: NoiseWave = { waveId: 'w3', approachDirection: 'east', typeSignature: 'string', damage: 3 };
    expect(canNoiseWaveBeBlocked(wave, basePlacement)).toBe(false);
  });

  it('should return false when tower config is empty', () => {
    const emptyPlacement: TowerPlacement = {
      towerId: 'tower-2',
      position: { row: 1, col: 1 },
      config: { inputs: [], outputs: [] },
    };
    const wave: NoiseWave = { waveId: 'w4', approachDirection: 'west', typeSignature: 'number', damage: 5 };
    expect(canNoiseWaveBeBlocked(wave, emptyPlacement)).toBe(false);
  });

  it('should return false when wave typeSignature is empty string', () => {
    const wave: NoiseWave = { waveId: 'w5', approachDirection: 'north', typeSignature: '', damage: 5 };
    expect(canNoiseWaveBeBlocked(wave, basePlacement)).toBe(false);
  });
});

describe('TowerInput', () => {
  it('should accept valid input with all fields populated', () => {
    const input: TowerInput = {
      name: 'frequency',
      type: 'number',
      required: true,
      transform: 'numberAttribute',
      aliasName: 'freq',
    };

    expect(input.name).toBe('frequency');
    expect(input.type).toBe('number');
    expect(input.required).toBe(true);
    expect(input.transform).toBe('numberAttribute');
    expect(input.aliasName).toBe('freq');
  });
});

describe('TowerOutput', () => {
  it('should accept valid output with both fields', () => {
    const output: TowerOutput = {
      name: 'signalSent',
      payloadType: 'SignalEvent',
    };

    expect(output.name).toBe('signalSent');
    expect(output.payloadType).toBe('SignalEvent');
  });
});

describe('TowerConfig', () => {
  it('should accept valid config with inputs and outputs', () => {
    const config: TowerConfig = {
      inputs: [{ name: 'freq', type: 'number', required: true }],
      outputs: [{ name: 'done', payloadType: 'void' }],
    };

    expect(config.inputs.length).toBe(1);
    expect(config.outputs.length).toBe(1);
  });

  it('should accept empty config (both arrays empty)', () => {
    const config: TowerConfig = { inputs: [], outputs: [] };

    expect(config.inputs.length).toBe(0);
    expect(config.outputs.length).toBe(0);
  });
});

describe('NoiseWave', () => {
  it('should accept valid wave with all 4 fields', () => {
    const wave: NoiseWave = {
      waveId: 'wave-1',
      approachDirection: 'north',
      typeSignature: 'number',
      damage: 10,
    };

    expect(wave.waveId).toBe('wave-1');
    expect(wave.approachDirection).toBe('north');
    expect(wave.typeSignature).toBe('number');
    expect(wave.damage).toBe(10);
  });
});

describe('GridPosition', () => {
  it('should accept valid position with row and col', () => {
    const pos: GridPosition = { row: 3, col: 5 };

    expect(pos.row).toBe(3);
    expect(pos.col).toBe(5);
  });
});

describe('TowerPlacement', () => {
  it('should accept valid placement with towerId, position, and config', () => {
    const placement: TowerPlacement = {
      towerId: 'tower-1',
      position: { row: 2, col: 4 },
      config: {
        inputs: [{ name: 'freq', type: 'number', required: true }],
        outputs: [],
      },
    };

    expect(placement.towerId).toBe('tower-1');
    expect(placement.position).toEqual({ row: 2, col: 4 });
    expect(placement.config.inputs.length).toBe(1);
  });
});

describe('ParentBinding', () => {
  it('should accept valid input binding (bindingType: input)', () => {
    const binding: ParentBinding = {
      bindingType: 'input',
      parentProperty: 'signalFreq',
      towerPortName: 'frequency',
    };

    expect(binding.bindingType).toBe('input');
    expect(binding.parentProperty).toBe('signalFreq');
    expect(binding.towerPortName).toBe('frequency');
  });

  it('should accept valid output binding (bindingType: output)', () => {
    const binding: ParentBinding = {
      bindingType: 'output',
      parentHandler: 'onSignalSent',
      towerPortName: 'signalSent',
    };

    expect(binding.bindingType).toBe('output');
    expect(binding.parentHandler).toBe('onSignalSent');
    expect(binding.towerPortName).toBe('signalSent');
  });
});

describe('SignalCorpsLevelData', () => {
  it('should accept valid level data with all fields', () => {
    const levelData: SignalCorpsLevelData = {
      gridSize: { rows: 8, cols: 6 },
      towerPlacements: [
        {
          towerId: 'tower-1',
          position: { row: 2, col: 3 },
          config: {
            inputs: [{ name: 'freq', type: 'number', required: true }],
            outputs: [{ name: 'done', payloadType: 'void' }],
          },
        },
      ],
      noiseWaves: [
        { waveId: 'wave-1', approachDirection: 'north', typeSignature: 'number', damage: 10 },
      ],
      expectedBindings: [
        { bindingType: 'input', parentProperty: 'signalFreq', towerPortName: 'freq' },
      ],
      stationHealth: 100,
    };

    expect(levelData.gridSize).toEqual({ rows: 8, cols: 6 });
    expect(levelData.towerPlacements.length).toBe(1);
    expect(levelData.noiseWaves.length).toBe(1);
    expect(levelData.expectedBindings.length).toBe(1);
    expect(levelData.stationHealth).toBe(100);
  });
});
