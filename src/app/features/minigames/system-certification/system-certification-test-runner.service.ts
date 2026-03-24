// ---------------------------------------------------------------------------
// SystemCertificationTestRunnerServiceImpl — test execution and coverage
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service is scoped to the System Certification
// component tree. Providing it locally ensures automatic cleanup on
// component destroy and prevents leaked state between minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import type { SystemCertificationTestRunnerService } from './system-certification.types';
import {
  calculateCoverage,
  aggregateTestResults,
  type SourceCodeBlock,
  type CoverageResult,
  type TestResult,
  type CertificationThreshold,
  type QualityScore,
} from './system-certification.types';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class SystemCertificationTestRunnerServiceImpl implements SystemCertificationTestRunnerService {
  private _sourceCode: SourceCodeBlock | null = null;
  private _lastCoverage: CoverageResult | null = null;

  // =========================================================================
  // loadSourceCode
  // =========================================================================

  loadSourceCode(source: SourceCodeBlock): void {
    this._sourceCode = source;
    // Initialize coverage: all testable points are uncovered
    this._lastCoverage = calculateCoverage(source.testablePoints, []);
  }

  // =========================================================================
  // runTests
  // =========================================================================

  runTests(testCode: string, sourceCode: SourceCodeBlock): readonly TestResult[] {
    const testBlockRegex = /it\(\s*(['"`])(.+?)\1\s*,\s*(?:(?:async\s*)?\(\)\s*=>\s*\{|function\s*\(\)\s*\{)([\s\S]*?)(?:\}\s*\))/g;

    const results: TestResult[] = [];
    const testableSet = new Set(sourceCode.testablePoints);
    let match: RegExpExecArray | null;

    while ((match = testBlockRegex.exec(testCode)) !== null) {
      const testName = match[2];
      const testBody = match[3];

      // Extract numeric literals from the test body that match testable points
      const numberRegex = /\b(\d+)\b/g;
      const coveredLines: number[] = [];
      let numMatch: RegExpExecArray | null;

      while ((numMatch = numberRegex.exec(testBody)) !== null) {
        const lineNum = parseInt(numMatch[1], 10);
        if (testableSet.has(lineNum)) {
          coveredLines.push(lineNum);
        }
      }

      results.push({
        testName,
        passed: true,
        coveredLines: [...new Set(coveredLines)],
      });
    }

    // Update internal coverage state from this run
    const summary = aggregateTestResults(results);
    this._lastCoverage = calculateCoverage(
      sourceCode.testablePoints,
      summary.coveredLineNumbers,
    );

    return results;
  }

  // =========================================================================
  // calculateCoverage
  // =========================================================================

  calculateCoverage(testResults: readonly TestResult[]): CoverageResult {
    if (!this._sourceCode) {
      return { totalLines: 0, coveredLines: 0, percentage: 0, uncoveredLineNumbers: [] };
    }

    const summary = aggregateTestResults(testResults);
    return calculateCoverage(
      this._sourceCode.testablePoints,
      summary.coveredLineNumbers,
    );
  }

  // =========================================================================
  // evaluateTestQuality
  // =========================================================================

  evaluateTestQuality(testResults: readonly TestResult[]): QualityScore {
    const summary = aggregateTestResults(testResults);

    if (summary.totalTests === 0) {
      return { qualityMultiplier: 0, redundantCount: 0, totalTests: 0 };
    }

    const qualityMultiplier = Math.max(
      0,
      1 - summary.redundantTestCount / summary.totalTests,
    );

    return {
      qualityMultiplier,
      redundantCount: summary.redundantTestCount,
      totalTests: summary.totalTests,
    };
  }

  // =========================================================================
  // isThresholdMet
  // =========================================================================

  isThresholdMet(coverage: CoverageResult, threshold: CertificationThreshold): boolean {
    return coverage.percentage >= threshold.minCoverage;
  }

  // =========================================================================
  // getUncoveredLines
  // =========================================================================

  getUncoveredLines(): number[] {
    if (!this._lastCoverage) {
      return [];
    }
    return [...this._lastCoverage.uncoveredLineNumbers];
  }

  // =========================================================================
  // reset
  // =========================================================================

  reset(): void {
    this._sourceCode = null;
    this._lastCoverage = null;
  }
}
