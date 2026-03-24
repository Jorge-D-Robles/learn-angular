import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  DeepSpaceRadioLevelData,
  MockEndpoint,
  InterceptorBlock,
  HttpRequestConfig,
  TransmissionResult,
  TestScenario,
  InterceptorType,
  HttpMethod,
} from '../../features/minigames/deep-space-radio/deep-space-radio.types';
import {
  DEEP_SPACE_RADIO_LEVELS,
  DEEP_SPACE_RADIO_LEVEL_PACK,
} from './deep-space-radio.data';

// --- Compile-time type checks ---

const _endpoint: MockEndpoint = {
  url: '/test', method: 'GET', expectedHeaders: {}, expectedBody: null,
  response: null, errorResponse: null,
};
const _interceptor: InterceptorBlock = { id: 'i', type: 'auth', config: {}, order: 1 };
const _request: HttpRequestConfig = {
  method: 'GET', url: '/test', headers: {}, body: undefined, params: {},
};
const _result: TransmissionResult = {
  requestConfig: _request, interceptorsApplied: [], responseData: null,
  statusCode: 200, isSuccess: true,
};
const _scenario: TestScenario = {
  id: 's', description: 'test', requestConfig: _request,
  expectedInterceptorOrder: [], expectedResult: _result,
};
const _levelData: DeepSpaceRadioLevelData = {
  endpoints: [_endpoint], interceptors: [_interceptor],
  testScenarios: [_scenario], expectedResults: [_result],
};
const _levelDef: LevelDefinition<DeepSpaceRadioLevelData> = {
  levelId: 'dsr-basic-01', gameId: 'deep-space-radio', tier: DifficultyTier.Basic,
  order: 1, title: 'Test', conceptIntroduced: 'Test', description: 'Test', data: _levelData,
};

void [_endpoint, _interceptor, _request, _result, _scenario, _levelData, _levelDef];

// --- Valid type values ---

const VALID_INTERCEPTOR_TYPES: readonly InterceptorType[] = [
  'auth', 'logging', 'retry', 'error', 'caching', 'custom',
];
const VALID_HTTP_METHODS: readonly HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(DEEP_SPACE_RADIO_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = DEEP_SPACE_RADIO_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = DEEP_SPACE_RADIO_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = DEEP_SPACE_RADIO_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = DEEP_SPACE_RADIO_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to deep-space-radio', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      expect(level.gameId).toBe('deep-space-radio');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = DEEP_SPACE_RADIO_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });
});

describe('Level ordering', () => {
  it('should have sequential order within each tier', () => {
    const basicOrders = DEEP_SPACE_RADIO_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = DEEP_SPACE_RADIO_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = DEEP_SPACE_RADIO_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = DEEP_SPACE_RADIO_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 endpoint in every level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      expect(level.data.endpoints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 test scenario in every level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      expect(level.data.testScenarios.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Data integrity -- Endpoints', () => {
  it('should have unique endpoint URLs+methods within each level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      const keys = level.data.endpoints.map(ep => `${ep.method}::${ep.url}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('should have valid HTTP methods for all endpoints', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      for (const ep of level.data.endpoints) {
        expect(VALID_HTTP_METHODS).toContain(ep.method);
      }
    }
  });

  it('should have non-empty URL for all endpoints', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      for (const ep of level.data.endpoints) {
        expect(ep.url.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Data integrity -- Interceptors', () => {
  it('should have unique interceptor ids within each level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      if (level.data.interceptors.length === 0) continue;
      const ids = level.data.interceptors.map(i => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have valid interceptor types for all interceptors', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      for (const int of level.data.interceptors) {
        expect(VALID_INTERCEPTOR_TYPES).toContain(int.type);
      }
    }
  });

  it('should have sequential order values for interceptors within each level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      if (level.data.interceptors.length === 0) continue;
      const orders = level.data.interceptors.map(i => i.order);
      const expected = orders.map((_, i) => i + 1);
      expect(orders).toEqual(expected);
    }
  });
});

describe('Data integrity -- Test scenarios', () => {
  it('should have unique scenario ids within each level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      const ids = level.data.testScenarios.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have non-empty description for all scenarios', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      for (const sc of level.data.testScenarios) {
        expect(sc.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have requestConfig with valid HTTP method for all scenarios', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      for (const sc of level.data.testScenarios) {
        expect(VALID_HTTP_METHODS).toContain(sc.requestConfig.method);
      }
    }
  });

  it('should have expectedInterceptorOrder contain only valid interceptor types', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      for (const sc of level.data.testScenarios) {
        for (const type of sc.expectedInterceptorOrder) {
          expect(VALID_INTERCEPTOR_TYPES).toContain(type);
        }
      }
    }
  });
});

describe('Data integrity -- Expected results', () => {
  it('should have expectedResults count match testScenarios count for every level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      expect(level.data.expectedResults.length).toBe(level.data.testScenarios.length);
    }
  });

  it('should have valid statusCode (number) for all expected results', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      for (const res of level.data.expectedResults) {
        expect(typeof res.statusCode).toBe('number');
        expect(res.statusCode).toBeGreaterThanOrEqual(100);
        expect(res.statusCode).toBeLessThan(600);
      }
    }
  });

  it('should have isSuccess boolean defined for all expected results', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      for (const res of level.data.expectedResults) {
        expect(typeof res.isSuccess).toBe('boolean');
      }
    }
  });

  it('should have expectedResults[i] equal to testScenarios[i].expectedResult for every level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      for (let i = 0; i < level.data.testScenarios.length; i++) {
        expect(level.data.expectedResults[i]).toEqual(level.data.testScenarios[i].expectedResult);
      }
    }
  });
});

describe('Data integrity -- Cross-references', () => {
  it('should have scenario requestConfig URLs reference an endpoint URL in the same level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      const endpointUrls = new Set(level.data.endpoints.map(ep => ep.url));
      for (const sc of level.data.testScenarios) {
        expect(endpointUrls.has(sc.requestConfig.url)).toBe(true);
      }
    }
  });

  it('should have scenario expectedInterceptorOrder types match interceptor types available in the level', () => {
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      if (level.data.interceptors.length === 0) continue;
      const availableTypes = new Set(level.data.interceptors.map(i => i.type));
      for (const sc of level.data.testScenarios) {
        for (const type of sc.expectedInterceptorOrder) {
          expect(availableTypes.has(type)).toBe(true);
        }
      }
    }
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern dsr-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^dsr-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of DEEP_SPACE_RADIO_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId deep-space-radio', () => {
    expect(DEEP_SPACE_RADIO_LEVEL_PACK.gameId).toBe('deep-space-radio');
  });

  it('should have levels equal to DEEP_SPACE_RADIO_LEVELS', () => {
    expect(DEEP_SPACE_RADIO_LEVEL_PACK.levels).toBe(DEEP_SPACE_RADIO_LEVELS);
  });
});

describe('Specific level spot checks', () => {
  it('should have Level 1 conceptIntroduced be HttpClient GET', () => {
    const level1 = DEEP_SPACE_RADIO_LEVELS.find(l => l.levelId === 'dsr-basic-01')!;
    expect(level1).toBeDefined();
    expect(level1.conceptIntroduced).toBe('HttpClient GET');
  });

  it('should have Level 1 with exactly 1 endpoint and 0 interceptors', () => {
    const level1 = DEEP_SPACE_RADIO_LEVELS.find(l => l.levelId === 'dsr-basic-01')!;
    expect(level1.data.endpoints.length).toBe(1);
    expect(level1.data.interceptors.length).toBe(0);
  });

  it('should have Level 7 (first interceptor level) with at least 1 interceptor', () => {
    const level7 = DEEP_SPACE_RADIO_LEVELS.find(l => l.levelId === 'dsr-intermediate-01')!;
    expect(level7).toBeDefined();
    expect(level7.data.interceptors.length).toBeGreaterThanOrEqual(1);
  });

  it('should have Level 12 with at least 4 interceptors', () => {
    const level12 = DEEP_SPACE_RADIO_LEVELS.find(l => l.levelId === 'dsr-intermediate-06')!;
    expect(level12).toBeDefined();
    expect(level12.data.interceptors.length).toBeGreaterThanOrEqual(4);
  });

  it('should have Boss level title be Mission Control Protocol', () => {
    const boss = DEEP_SPACE_RADIO_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Mission Control Protocol');
  });

  it('should have Boss level with parTime set to 300', () => {
    const boss = DEEP_SPACE_RADIO_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBe(300);
  });

  it('should have Boss level with at least 6 endpoints and 8 test scenarios', () => {
    const boss = DEEP_SPACE_RADIO_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.endpoints.length).toBeGreaterThanOrEqual(6);
    expect(boss.data.testScenarios.length).toBeGreaterThanOrEqual(8);
  });

  it('should have Boss level with at least 5 interceptors', () => {
    const boss = DEEP_SPACE_RADIO_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.interceptors.length).toBeGreaterThanOrEqual(5);
  });
});
