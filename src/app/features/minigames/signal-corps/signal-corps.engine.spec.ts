import {
  SignalCorpsEngine,
  type DeclareInputAction,
  type DeclareOutputAction,
  type RemoveInputAction,
  type RemoveOutputAction,
  type SetBindingAction,
  type RemoveBindingAction,
} from './signal-corps.engine';
import type {
  SignalCorpsLevelData,
  TowerPlacement,
  ParentBinding,
  NoiseWave,
} from './signal-corps.types';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestLevelData(
  overrides?: Partial<SignalCorpsLevelData>,
): SignalCorpsLevelData {
  const tower1: TowerPlacement = {
    towerId: 'tower-1',
    position: { row: 0, col: 0 },
    config: {
      inputs: [{ name: 'data', type: 'string', required: true, aliasName: 'dataInput' }],
      outputs: [{ name: 'processed', payloadType: 'string' }],
    },
  };
  const tower2: TowerPlacement = {
    towerId: 'tower-2',
    position: { row: 1, col: 1 },
    config: {
      inputs: [{ name: 'count', type: 'number', required: true, transform: 'numberAttribute' }],
      outputs: [{ name: 'result', payloadType: 'number' }],
    },
  };

  const expectedBindings: ParentBinding[] = [
    { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
    { bindingType: 'output', parentHandler: 'onResult', towerPortName: 'result' },
  ];

  const noiseWaves: NoiseWave[] = [
    { waveId: 'wave-1', approachDirection: 'north', typeSignature: 'string', damage: 20 },
    { waveId: 'wave-2', approachDirection: 'south', typeSignature: 'number', damage: 30 },
  ];

  return {
    gridSize: { rows: 3, cols: 3 },
    towerPlacements: [tower1, tower2],
    noiseWaves,
    expectedBindings,
    stationHealth: 100,
    ...overrides,
  };
}

function createLevel(
  data: SignalCorpsLevelData,
): MinigameLevel<SignalCorpsLevelData> {
  return {
    id: 'sc-test-01',
    gameId: 'signal-corps',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Input/Output bindings',
    description: 'Test level',
    data,
  };
}

function createEngine(
  config?: Partial<MinigameEngineConfig>,
): SignalCorpsEngine {
  return new SignalCorpsEngine(config);
}

function initAndStart(
  engine: SignalCorpsEngine,
  data?: SignalCorpsLevelData,
): void {
  engine.initialize(createLevel(data ?? createTestLevelData()));
  engine.start();
}

/** Configure tower-1 with all correct inputs, outputs, and bindings. */
function configureTower1Correctly(engine: SignalCorpsEngine): void {
  engine.submitAction({
    type: 'declare-input',
    towerId: 'tower-1',
    input: { name: 'data', type: 'string', required: true, aliasName: 'dataInput' },
  } as DeclareInputAction);
  engine.submitAction({
    type: 'declare-output',
    towerId: 'tower-1',
    output: { name: 'processed', payloadType: 'string' },
  } as DeclareOutputAction);
  engine.submitAction({
    type: 'set-binding',
    towerId: 'tower-1',
    binding: { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
  } as SetBindingAction);
}

/** Configure tower-2 with all correct inputs, outputs, and bindings. */
function configureTower2Correctly(engine: SignalCorpsEngine): void {
  engine.submitAction({
    type: 'declare-input',
    towerId: 'tower-2',
    input: { name: 'count', type: 'number', required: true, transform: 'numberAttribute' },
  } as DeclareInputAction);
  engine.submitAction({
    type: 'declare-output',
    towerId: 'tower-2',
    output: { name: 'result', payloadType: 'number' },
  } as DeclareOutputAction);
  engine.submitAction({
    type: 'set-binding',
    towerId: 'tower-2',
    binding: { bindingType: 'output', parentHandler: 'onResult', towerPortName: 'result' },
  } as SetBindingAction);
}

/** Configure both towers correctly. */
function configureAllCorrectly(engine: SignalCorpsEngine): void {
  configureTower1Correctly(engine);
  configureTower2Correctly(engine);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SignalCorpsEngine', () => {
  // --- 1. Initialization ---

  describe('Initialization', () => {
    it('should initialize with Loading status and correct tower count in playerTowers map', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.status()).toBe(MinigameStatus.Loading);
      expect(engine.playerTowers().size).toBe(2);
    });

    it('should set stationHealth from level data', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData({ stationHealth: 75 })));

      expect(engine.stationHealth()).toBe(75);
    });

    it('should start with deployCount at 0 and deployResult null', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.deployCount()).toBe(0);
      expect(engine.deployResult()).toBeNull();
    });

    it('should initialize all player towers with empty inputs, outputs, and bindings', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      const towers = engine.playerTowers();
      const tower1 = towers.get('tower-1')!;
      const tower2 = towers.get('tower-2')!;

      expect(tower1.inputs).toEqual([]);
      expect(tower1.outputs).toEqual([]);
      expect(tower1.bindings).toEqual([]);
      expect(tower2.inputs).toEqual([]);
      expect(tower2.outputs).toEqual([]);
      expect(tower2.bindings).toEqual([]);
    });

    it('should expose expected tower count matching level data towerPlacements', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.playerTowers().size).toBe(2);
    });
  });

  // --- 2. Declare Input - valid ---

  describe('Declare Input - valid', () => {
    it('should add input to tower inputs array when tower exists', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true },
      } as DeclareInputAction);

      const tower = engine.playerTowers().get('tower-1')!;
      expect(tower.inputs).toHaveLength(1);
      expect(tower.inputs[0].name).toBe('data');
    });

    it('should return valid: true, scoreChange: 0, livesChange: 0', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true },
      } as DeclareInputAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should allow multiple inputs on the same tower with different names', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true },
      } as DeclareInputAction);
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'label', type: 'string', required: false },
      } as DeclareInputAction);

      const tower = engine.playerTowers().get('tower-1')!;
      expect(tower.inputs).toHaveLength(2);
    });
  });

  // --- 3. Declare Input - invalid ---

  describe('Declare Input - invalid', () => {
    it('should return invalid when towerId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'declare-input',
        towerId: 'non-existent',
        input: { name: 'data', type: 'string', required: true },
      } as DeclareInputAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when input with same name already declared', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true },
      } as DeclareInputAction);

      const result = engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'number', required: false },
      } as DeclareInputAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 4. Declare Output - valid ---

  describe('Declare Output - valid', () => {
    it('should add output to tower outputs array', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);

      const tower = engine.playerTowers().get('tower-1')!;
      expect(tower.outputs).toHaveLength(1);
      expect(tower.outputs[0].name).toBe('processed');
    });

    it('should return valid result', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
    });
  });

  // --- 5. Declare Output - invalid ---

  describe('Declare Output - invalid', () => {
    it('should return invalid for nonexistent tower', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'declare-output',
        towerId: 'non-existent',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid for duplicate output name', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);

      const result = engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'number' },
      } as DeclareOutputAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 6. Remove Input ---

  describe('Remove Input', () => {
    it('should remove input by name and return valid', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true },
      } as DeclareInputAction);

      const result = engine.submitAction({
        type: 'remove-input',
        towerId: 'tower-1',
        inputName: 'data',
      } as RemoveInputAction);

      expect(result.valid).toBe(true);
      expect(engine.playerTowers().get('tower-1')!.inputs).toHaveLength(0);
    });

    it('should return invalid when input name not found', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'remove-input',
        towerId: 'tower-1',
        inputName: 'non-existent',
      } as RemoveInputAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 7. Remove Output ---

  describe('Remove Output', () => {
    it('should remove output by name and return valid', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);

      const result = engine.submitAction({
        type: 'remove-output',
        towerId: 'tower-1',
        outputName: 'processed',
      } as RemoveOutputAction);

      expect(result.valid).toBe(true);
      expect(engine.playerTowers().get('tower-1')!.outputs).toHaveLength(0);
    });

    it('should return invalid when output name not found', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'remove-output',
        towerId: 'tower-1',
        outputName: 'non-existent',
      } as RemoveOutputAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 8. Set Binding - valid ---

  describe('Set Binding - valid', () => {
    it('should add binding with bindingType input to tower', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
      } as SetBindingAction);

      expect(result.valid).toBe(true);
      const tower = engine.playerTowers().get('tower-1')!;
      expect(tower.bindings).toHaveLength(1);
      expect(tower.bindings[0].bindingType).toBe('input');
    });

    it('should add binding with bindingType output to tower', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-2',
        binding: { bindingType: 'output', parentHandler: 'onResult', towerPortName: 'result' },
      } as SetBindingAction);

      expect(result.valid).toBe(true);
      const tower = engine.playerTowers().get('tower-2')!;
      expect(tower.bindings).toHaveLength(1);
      expect(tower.bindings[0].bindingType).toBe('output');
    });

    it('should replace existing binding for the same port name', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'oldProp', towerPortName: 'data' },
      } as SetBindingAction);

      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
      } as SetBindingAction);

      const tower = engine.playerTowers().get('tower-1')!;
      expect(tower.bindings).toHaveLength(1);
      expect(tower.bindings[0].parentProperty).toBe('stationData');
    });
  });

  // --- 9. Set Binding - invalid ---

  describe('Set Binding - invalid', () => {
    it('should return invalid when tower not found', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'set-binding',
        towerId: 'non-existent',
        binding: { bindingType: 'input', parentProperty: 'prop', towerPortName: 'data' },
      } as SetBindingAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when towerPortName is empty', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'prop', towerPortName: '' },
      } as SetBindingAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 10. Remove Binding ---

  describe('Remove Binding', () => {
    it('should remove binding by port name and return valid', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
      } as SetBindingAction);

      const result = engine.submitAction({
        type: 'remove-binding',
        towerId: 'tower-1',
        towerPortName: 'data',
      } as RemoveBindingAction);

      expect(result.valid).toBe(true);
      expect(engine.playerTowers().get('tower-1')!.bindings).toHaveLength(0);
    });

    it('should return invalid when no binding exists for port name', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'remove-binding',
        towerId: 'tower-1',
        towerPortName: 'non-existent',
      } as RemoveBindingAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 11. Deploy - tower config validation ---

  describe('Deploy - tower config validation', () => {
    it('should mark tower as correct when inputs (including aliasName), outputs, and bindings all match expected', () => {
      const engine = createEngine();
      initAndStart(engine);
      configureAllCorrectly(engine);

      const result = engine.deploy()!;

      expect(result.towerResults[0].allCorrect).toBe(true);
      expect(result.towerResults[1].allCorrect).toBe(true);
      expect(result.allTowersCorrect).toBe(true);
    });

    it('should mark tower as incorrect when an input is missing', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Only configure outputs and bindings for tower-1, skip input
      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);
      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
      } as SetBindingAction);

      configureTower2Correctly(engine);

      const result = engine.deploy()!;
      const tower1Eval = result.towerResults.find(t => t.towerId === 'tower-1')!;

      expect(tower1Eval.inputsCorrect).toBe(false);
      expect(tower1Eval.allCorrect).toBe(false);
    });

    it('should mark tower as incorrect when an input has wrong type', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'number', required: true, aliasName: 'dataInput' },
      } as DeclareInputAction);
      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);
      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
      } as SetBindingAction);

      configureTower2Correctly(engine);

      const result = engine.deploy()!;
      const tower1Eval = result.towerResults.find(t => t.towerId === 'tower-1')!;

      expect(tower1Eval.inputsCorrect).toBe(false);
      expect(tower1Eval.allCorrect).toBe(false);
    });

    it('should mark tower as incorrect when aliasName does not match expected', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Tower-1 expects aliasName: 'dataInput', provide wrong one
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true, aliasName: 'wrongAlias' },
      } as DeclareInputAction);
      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);
      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
      } as SetBindingAction);

      configureTower2Correctly(engine);

      const result = engine.deploy()!;
      const tower1Eval = result.towerResults.find(t => t.towerId === 'tower-1')!;

      expect(tower1Eval.inputsCorrect).toBe(false);
      expect(tower1Eval.allCorrect).toBe(false);
    });

    it('should mark tower as incorrect when an output has wrong payloadType', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true, aliasName: 'dataInput' },
      } as DeclareInputAction);
      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'number' },
      } as DeclareOutputAction);
      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
      } as SetBindingAction);

      configureTower2Correctly(engine);

      const result = engine.deploy()!;
      const tower1Eval = result.towerResults.find(t => t.towerId === 'tower-1')!;

      expect(tower1Eval.outputsCorrect).toBe(false);
      expect(tower1Eval.allCorrect).toBe(false);
    });

    it('should mark tower as incorrect when bindings are missing', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Tower-1 correct inputs and outputs, but no binding
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true, aliasName: 'dataInput' },
      } as DeclareInputAction);
      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);

      configureTower2Correctly(engine);

      const result = engine.deploy()!;
      const tower1Eval = result.towerResults.find(t => t.towerId === 'tower-1')!;

      expect(tower1Eval.bindingsCorrect).toBe(false);
      expect(tower1Eval.allCorrect).toBe(false);
    });
  });

  // --- 12. Deploy - wave blocking ---

  describe('Deploy - wave blocking', () => {
    it('should block wave when a correctly configured tower has matching type signature', () => {
      const engine = createEngine();
      initAndStart(engine);
      configureAllCorrectly(engine);

      const result = engine.deploy()!;

      // wave-1 (string) blocked by tower-1, wave-2 (number) blocked by tower-2
      expect(result.waveResults[0].blocked).toBe(true);
      expect(result.waveResults[0].blockedByTowerId).toBe('tower-1');
      expect(result.waveResults[1].blocked).toBe(true);
      expect(result.waveResults[1].blockedByTowerId).toBe('tower-2');
    });

    it('should NOT block wave when tower config is incorrect (even if type matches)', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Tower-1 has wrong type (number instead of string) but wave-1 expects string
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'number', required: true, aliasName: 'dataInput' },
      } as DeclareInputAction);
      engine.submitAction({
        type: 'declare-output',
        towerId: 'tower-1',
        output: { name: 'processed', payloadType: 'string' },
      } as DeclareOutputAction);
      engine.submitAction({
        type: 'set-binding',
        towerId: 'tower-1',
        binding: { bindingType: 'input', parentProperty: 'stationData', towerPortName: 'data' },
      } as SetBindingAction);

      configureTower2Correctly(engine);

      const result = engine.deploy()!;

      // Tower-1 is incorrect, so wave-1 (string) is NOT blocked
      const wave1 = result.waveResults.find(w => w.waveId === 'wave-1')!;
      expect(wave1.blocked).toBe(false);
      expect(wave1.damage).toBe(20);
    });

    it('should NOT block wave when no tower has matching type signature', () => {
      const engine = createEngine();
      const data = createTestLevelData({
        noiseWaves: [
          { waveId: 'wave-x', approachDirection: 'east', typeSignature: 'boolean', damage: 50 },
        ],
      });
      initAndStart(engine, data);
      configureAllCorrectly(engine);

      const result = engine.deploy()!;

      expect(result.waveResults[0].blocked).toBe(false);
      expect(result.waveResults[0].damage).toBe(50);
    });
  });

  // --- 13. Deploy - damage and health ---

  describe('Deploy - damage and health', () => {
    it('should reduce station health by unblocked wave damage', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Don't configure any towers -- all waves unblocked
      const result = engine.deploy()!;

      // wave-1: 20 + wave-2: 30 = 50 damage
      expect(result.totalDamage).toBe(50);
      expect(engine.stationHealth()).toBe(50);
    });

    it('should call fail() when station health reaches 0', () => {
      const engine = createEngine();
      const data = createTestLevelData({
        stationHealth: 30,
        noiseWaves: [
          { waveId: 'wave-1', approachDirection: 'north', typeSignature: 'string', damage: 30 },
        ],
      });
      initAndStart(engine, data);

      // No towers configured, wave deals 30 damage to 30 health
      engine.deploy();

      expect(engine.stationHealth()).toBe(0);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should NOT reduce health for blocked waves', () => {
      const engine = createEngine();
      initAndStart(engine);
      configureAllCorrectly(engine);

      engine.deploy();

      expect(engine.stationHealth()).toBe(100);
    });

    it('should accumulate damage across multiple deploys (health not reset between deploys)', () => {
      const engine = createEngine();
      const data = createTestLevelData({
        stationHealth: 100,
        noiseWaves: [
          { waveId: 'wave-1', approachDirection: 'north', typeSignature: 'boolean', damage: 20 },
        ],
      });
      initAndStart(engine, data);

      // No tower matches boolean type, so wave always unblocked
      // But we need configureAllCorrectly NOT to complete (waves not all blocked)
      configureAllCorrectly(engine);
      engine.deploy(); // -20 -> 80
      expect(engine.stationHealth()).toBe(80);

      engine.deploy(); // -20 -> 60
      expect(engine.stationHealth()).toBe(60);

      engine.deploy(); // -20 -> 40
      expect(engine.stationHealth()).toBe(40);
    });
  });

  // --- 14. Deploy - scoring ---

  describe('Deploy - scoring', () => {
    it('should award maxScore on first deploy with all correct, full health, no timer', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      configureAllCorrectly(engine);

      engine.deploy();

      expect(engine.score()).toBe(1000);
    });

    it('should apply deploy penalty on second deploy', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // First deploy: no configuration at all, game stays Playing (some towers incorrect)
      engine.deploy();
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Now configure everything correctly
      configureAllCorrectly(engine);
      engine.deploy(); // second deploy

      // deployPenalty = max(0.5, 1.0 - 0.15 * (2 - 1)) = 0.85
      // healthBonus: health was 100 - 50 = 50, ratio = 50/100 = 0.5
      // correctnessRatio = 1.0, timeBonus = 1.0
      const expectedScore = Math.round(1000 * 1.0 * 0.5 * 0.85 * 1.0);
      expect(engine.score()).toBe(expectedScore);
    });

    it('should apply health bonus reduction proportional to damage taken', () => {
      const engine = createEngine({ maxScore: 1000 });
      const data = createTestLevelData({
        stationHealth: 100,
        noiseWaves: [
          // Only wave-1 (string) so tower-1 blocks it when correct, wave-2 deals damage
          { waveId: 'wave-1', approachDirection: 'north', typeSignature: 'string', damage: 20 },
          { waveId: 'wave-2', approachDirection: 'south', typeSignature: 'number', damage: 30 },
        ],
      });
      initAndStart(engine, data);

      // First deploy: no towers configured, takes 20+30=50 damage, health -> 50
      engine.deploy();
      expect(engine.stationHealth()).toBe(50);

      // Configure correctly and deploy again
      configureAllCorrectly(engine);
      engine.deploy(); // second deploy, all correct, all blocked, 0 damage

      // healthBonus = clamp(50/100, 0.5, 1.0) = 0.5
      // deployPenalty = max(0.5, 1.0 - 0.15 * (2 - 1)) = 0.85
      // correctnessRatio = 1.0, timeBonus = 1.0
      const expectedScore = Math.round(1000 * 1.0 * 0.5 * 0.85 * 1.0);
      expect(engine.score()).toBe(expectedScore);
    });

    it('should apply time bonus when timerDuration is configured', () => {
      const engine = createEngine({ maxScore: 1000, timerDuration: 60 });
      initAndStart(engine);
      configureAllCorrectly(engine);

      // timeRemaining starts at 60, timerDuration is 60
      // timeBonus = clamp(60/60, 0.5, 1.0) = 1.0
      engine.deploy();

      // With full time, score should be maxScore
      expect(engine.score()).toBe(1000);
    });
  });

  // --- 15. Deploy - completion ---

  describe('Deploy - completion', () => {
    it('should call complete() and set status to Won when all correct + all blocked', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      configureAllCorrectly(engine);

      engine.deploy();

      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBeGreaterThan(0);
    });

    it('should stay Playing when some towers incorrect (allow retry)', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Only configure tower-1, leave tower-2 unconfigured
      configureTower1Correctly(engine);

      const result = engine.deploy()!;

      expect(result.allTowersCorrect).toBe(false);
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });
  });

  // --- 16. Edge cases ---

  describe('Edge cases', () => {
    it('should return invalid for unknown action types', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({ type: 'unknown-action' });

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return null from deploy() when status is not Playing', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still in Loading status

      const result = engine.deploy();

      expect(result).toBeNull();
    });

    it('should not allow submitAction when status is not Playing', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still in Loading status

      const result = engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true },
      } as DeclareInputAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 17. Reset ---

  describe('Reset', () => {
    it('should restore all tower state, health, deploy count on reset()', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Modify state: add inputs, deploy
      engine.submitAction({
        type: 'declare-input',
        towerId: 'tower-1',
        input: { name: 'data', type: 'string', required: true },
      } as DeclareInputAction);
      engine.deploy();

      expect(engine.playerTowers().get('tower-1')!.inputs).toHaveLength(1);
      expect(engine.deployCount()).toBe(1);
      expect(engine.stationHealth()).toBeLessThan(100);

      // Reset
      engine.reset();

      // After reset: everything back to initial
      expect(engine.playerTowers().get('tower-1')!.inputs).toHaveLength(0);
      expect(engine.playerTowers().get('tower-1')!.outputs).toHaveLength(0);
      expect(engine.playerTowers().get('tower-1')!.bindings).toHaveLength(0);
      expect(engine.deployCount()).toBe(0);
      expect(engine.deployResult()).toBeNull();
      expect(engine.stationHealth()).toBe(100);
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });
  });
});
