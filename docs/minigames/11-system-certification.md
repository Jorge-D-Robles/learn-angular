# Minigame: System Certification

## Summary

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| Number              | 11                                                |
| Angular Topic       | Testing                                           |
| Curriculum Chapters | Ch 32 (Testing)                                   |
| Core Mechanic       | Test writing challenge with real-time test runner |
| Difficulty Tiers    | Basic / Intermediate / Advanced / Boss            |
| Total Levels        | 18                                                |

## Concept

The player writes unit and integration tests for pre-built station components. A real-time test runner executes tests as they're written, showing pass/fail status and a coverage meter. The goal is to achieve full test coverage by writing tests that exercise all component behavior.

## Station Narrative

Before any station system goes live, it must pass **System Certification** — a rigorous testing protocol. The player is the certification officer, writing tests to verify that each module works correctly before deployment.

## Gameplay

### Core Mechanic

- Left panel: source code of the component/service being tested (read-only)
- Right panel: test file editor where the player writes tests
- Bottom panel: test runner output (pass/fail for each test, coverage percentage)
- Coverage meter fills as more code paths are tested
- Target: reach the required coverage threshold to certify the system

### Controls

- **Test editor** — write test code (describe, it, expect)
- **Run tests** — execute all tests (auto-runs on save)
- **Coverage view** — toggle to see which lines are covered/uncovered
- **Hint** — highlights an uncovered code path (costs points)

### Win/Lose Conditions

- **Win:** Coverage threshold met (e.g., 80% for basic, 100% for advanced)
- **Lose:** Timer expires without meeting coverage threshold
- **Scoring:** Coverage percentage + test quality (no redundant tests) + speed + no hints

## Level Progression

### Basic Tier (Levels 1-6)

| Level | Concept Introduced             | Description                                  |
| ----- | ------------------------------ | -------------------------------------------- |
| 1     | First test                     | Write a single test for a component property |
| 2     | TestBed.configureTestingModule | Set up component test environment            |
| 3     | Component creation test        | Verify component creates successfully        |
| 4     | Property testing               | Test component properties and defaults       |
| 5     | Method testing                 | Test component methods with expect()         |
| 6     | Multiple assertions            | Test several behaviors in one describe block |

### Intermediate Tier (Levels 7-12)

| Level | Concept Introduced | Description                                    |
| ----- | ------------------ | ---------------------------------------------- |
| 7     | DOM testing        | Query rendered template, check text content    |
| 8     | Event testing      | Simulate clicks, verify handlers called        |
| 9     | Input testing      | Set input properties, verify rendering changes |
| 10    | Output testing     | Subscribe to outputs, trigger events           |
| 11    | Service testing    | Test injectable service with TestBed           |
| 12    | Service mock/spy   | Mock dependencies with jasmine.createSpyObj    |

### Advanced Tier (Levels 13-17)

| Level | Concept Introduced      | Description                                  |
| ----- | ----------------------- | -------------------------------------------- |
| 13    | Async testing           | fakeAsync, tick, flush for async operations  |
| 14    | HTTP testing            | HttpTestingController for HTTP service tests |
| 15    | Router testing          | RouterTestingModule, testing navigation      |
| 16    | Integration tests       | Test parent-child component interaction      |
| 17    | Full coverage challenge | Achieve 100% coverage on a complex component |

### Boss Level (Level 18)

**"Full Station Certification"** — A complex module with a component, service, and child component. Must write tests covering: component creation, property binding, event handling, service interaction, HTTP calls (mocked), async behavior, and DOM rendering. Target: 95% coverage with no redundant tests.

## Angular Concepts Covered

1. TestBed.configureTestingModule
2. ComponentFixture and DebugElement
3. describe/it/expect structure
4. Component property and method testing
5. DOM query and text content verification
6. Event simulation (triggerEventHandler, click)
7. Input/output testing
8. Service testing with TestBed
9. Mocking with spies (jasmine.createSpyObj)
10. fakeAsync/tick/flush
11. HttpTestingController
12. Router testing utilities
13. Code coverage analysis

## Replay Modes

### Endless Mode

Procedurally generated components of increasing complexity. Write tests until you fail to meet coverage within time limit.

### Speed Run

Fixed set of 6 components to certify. Par time: 10 minutes.

### Daily Challenge

Specific component to test (e.g., "Today: certify the navigation service — achieve 90% coverage").

## Visual Design

- Clean, professional testing lab aesthetic
- Coverage meter is a prominent gauge on screen
- Passing tests: green checkmarks with satisfying animation
- Failing tests: red X with error message highlight
- Coverage overlay on source code: green (covered), red (uncovered), yellow (partially covered)
- Full certification: "CERTIFIED" stamp animation, module glows green

## Technical Notes

- Test execution uses a sandboxed test runner environment
- Coverage is calculated by tracking which source lines are exercised by test assertions
- Pre-built components are designed with specific testable paths (branches, error handlers)
- Level data: sourceCode, coverageThreshold, timeLimit, availableTestUtilities
