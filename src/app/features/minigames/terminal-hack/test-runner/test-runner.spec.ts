import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TerminalHackTestRunnerComponent } from './test-runner';
import type { FormTestCase } from '../terminal-hack.types';
import type { TestCaseResult } from '../terminal-hack.engine';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const SAMPLE_TEST_CASES: FormTestCase[] = [
  {
    id: 'tc1',
    description: 'Valid login credentials',
    inputValues: { username: 'admin', password: 'secret' },
    expectedValid: true,
  },
  {
    id: 'tc2',
    description: 'Empty username fails required',
    inputValues: { username: '', password: 'secret' },
    expectedValid: false,
    expectedErrors: { username: ['required'] },
  },
  {
    id: 'tc3',
    description: 'Short password fails minLength',
    inputValues: { username: 'admin', password: 'ab' },
    expectedValid: false,
    expectedErrors: { password: ['minLength'] },
  },
];

const ALL_PASS_RESULTS: TestCaseResult[] = [
  { testCaseId: 'tc1', passed: true, expectedValid: true, actualValid: true, errorMismatches: [] },
  { testCaseId: 'tc2', passed: true, expectedValid: false, actualValid: false, errorMismatches: [] },
  { testCaseId: 'tc3', passed: true, expectedValid: false, actualValid: false, errorMismatches: [] },
];

const MIXED_RESULTS: TestCaseResult[] = [
  { testCaseId: 'tc1', passed: true, expectedValid: true, actualValid: true, errorMismatches: [] },
  { testCaseId: 'tc2', passed: false, expectedValid: false, actualValid: true, errorMismatches: ['username'] },
  { testCaseId: 'tc3', passed: false, expectedValid: false, actualValid: true, errorMismatches: ['password'] },
];

// ---------------------------------------------------------------------------
// Test host -- drives the sub-component via inputs/outputs
// ---------------------------------------------------------------------------

@Component({
  template: `<app-terminal-hack-test-runner
    [testCases]="testCases"
    [testResults]="testResults"
    [isRunning]="isRunning"
    (runTestsRequested)="onRunTestsRequested()" />`,
  imports: [TerminalHackTestRunnerComponent],
})
class TestHost {
  testCases: FormTestCase[] = SAMPLE_TEST_CASES;
  testResults: readonly TestCaseResult[] | null = null;
  isRunning = false;
  onRunTestsRequested = vi.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TerminalHackTestRunnerComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let element: HTMLElement;

  async function setup(overrides: Partial<TestHost> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    Object.assign(host, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    fixture?.destroy();
  });

  // --- 1. Test case listing: renders all test cases ---

  it('should render one case element per test case', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES });
    const cases = element.querySelectorAll('.test-runner__case');
    expect(cases.length).toBe(3);
  });

  // --- 2. Test case listing: displays description ---

  it('should display the description text for each test case', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES });
    const cases = element.querySelectorAll('.test-runner__case');
    expect(cases[0].textContent).toContain('Valid login credentials');
    expect(cases[1].textContent).toContain('Empty username fails required');
    expect(cases[2].textContent).toContain('Short password fails minLength');
  });

  // --- 3. Test case listing: displays expected outcome ---

  it('should display Valid/Invalid badge per test case based on expectedValid', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES });
    const badges = element.querySelectorAll('.test-runner__expected');
    expect(badges.length).toBe(3);
    expect(badges[0].textContent).toContain('Valid');
    expect(badges[1].textContent).toContain('Invalid');
    expect(badges[2].textContent).toContain('Invalid');
  });

  // --- 4. Pass/fail rendering: shows pass icon for passing test ---

  it('should show pass icon for each passing test result', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, testResults: ALL_PASS_RESULTS });
    const passIcons = element.querySelectorAll('.test-runner__icon--pass');
    expect(passIcons.length).toBe(3);
  });

  // --- 5. Pass/fail rendering: shows fail icon for failing test ---

  it('should show fail icon for each failing test result', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, testResults: MIXED_RESULTS });
    const failIcons = element.querySelectorAll('.test-runner__icon--fail');
    expect(failIcons.length).toBe(2);
  });

  // --- 6. Pass/fail rendering: applies --pass class for passing test ---

  it('should apply --pass class on case rows that passed', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, testResults: ALL_PASS_RESULTS });
    const passCases = element.querySelectorAll('.test-runner__case--pass');
    expect(passCases.length).toBe(3);
  });

  // --- 7. Pass/fail rendering: applies --fail class for failing test ---

  it('should apply --fail class on case rows that failed', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, testResults: MIXED_RESULTS });
    const failCases = element.querySelectorAll('.test-runner__case--fail');
    expect(failCases.length).toBe(2);
    const passCases = element.querySelectorAll('.test-runner__case--pass');
    expect(passCases.length).toBe(1);
  });

  // --- 8. Pass rate display: shows correct count ---

  it('should show "1/3 tests passed" for mixed results', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, testResults: MIXED_RESULTS });
    const passRate = element.querySelector('.test-runner__pass-rate');
    expect(passRate).toBeTruthy();
    expect(passRate!.textContent).toContain('1/3 tests passed');
  });

  // --- 9. Pass rate display: shows all pass ---

  it('should show "3/3 tests passed" when all tests pass', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, testResults: ALL_PASS_RESULTS });
    const passRate = element.querySelector('.test-runner__pass-rate');
    expect(passRate).toBeTruthy();
    expect(passRate!.textContent).toContain('3/3 tests passed');
  });

  // --- 10. Pass rate display: hidden before first run ---

  it('should not show pass rate element when testResults is null', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, testResults: null });
    const passRate = element.querySelector('.test-runner__pass-rate');
    expect(passRate).toBeFalsy();
  });

  // --- 11. Running state: applies --running class when isRunning ---

  it('should apply --running class on root when isRunning is true', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, isRunning: true });
    const root = element.querySelector('.test-runner--running');
    expect(root).toBeTruthy();
  });

  // --- 12. Running state: no --running class when not running ---

  it('should not apply --running class on root when isRunning is false', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, isRunning: false });
    const root = element.querySelector('.test-runner--running');
    expect(root).toBeFalsy();
  });

  // --- 13. Run request event: emits on button click ---

  it('should emit runTestsRequested when the Run Tests button is clicked', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES });
    const button = element.querySelector('.test-runner__run-btn') as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();
    expect(host.onRunTestsRequested).toHaveBeenCalled();
  });

  // --- 14. Run request event: button disabled when isRunning ---

  it('should disable the Run Tests button when isRunning is true', async () => {
    await setup({ testCases: SAMPLE_TEST_CASES, isRunning: true });
    const button = element.querySelector('.test-runner__run-btn') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(true);
  });

  // --- 15. Edge case: empty test cases ---

  it('should render 0 case elements and no pass rate when testCases is empty', async () => {
    await setup({ testCases: [], testResults: null });
    const cases = element.querySelectorAll('.test-runner__case');
    expect(cases.length).toBe(0);
    const passRate = element.querySelector('.test-runner__pass-rate');
    expect(passRate).toBeFalsy();
  });

  // --- 16. Edge case: results with no test cases ---

  it('should show "0/0 tests passed" when testCases is empty and testResults is empty array', async () => {
    await setup({ testCases: [], testResults: [] });
    const cases = element.querySelectorAll('.test-runner__case');
    expect(cases.length).toBe(0);
    const passRate = element.querySelector('.test-runner__pass-rate');
    expect(passRate).toBeTruthy();
    expect(passRate!.textContent).toContain('0/0 tests passed');
  });
});
