import { VerifyRequest, VerifyResponse } from '../types/verdict';

/**
 * Mock verification engine that accurately mirrors the logic and response format
 * specified in docs/API.md for both safe_divide and validate_json.
 */
export function executeMockVerification(request: VerifyRequest): VerifyResponse {
  const { task, language, code } = request;

  if (task === 'safe_divide') {
    return evaluateSafeDivide(code, language);
  } else if (task === 'validate_json') {
    return evaluateValidateJson(code, language);
  }

  return {
    service: 'Verdict404',
    task,
    language,
    verdict: 'ERROR',
    tests_passed: 0,
    tests_failed: 0,
    confidence: 0,
    evidence: [`ERROR: Unsupported verification task '${task}'.`],
    error: `Unknown task '${task}'`,
  };
}

function evaluateSafeDivide(code: string, language: string): VerifyResponse {
  const cleanCode = code.trim();

  // Basic syntax check: def divide signature format
  const defMatch = cleanCode.match(/def\s+divide\s*\(([^)]*)\)\s*:/);
  if (!defMatch && !cleanCode.includes('def divide')) {
    return {
      service: 'Verdict404',
      task: 'safe_divide',
      language,
      verdict: 'ERROR',
      tests_passed: 0,
      tests_failed: 0,
      confidence: 0,
      evidence: [
        'ERROR: SyntaxError - No function definition `def divide(...)` found in submitted code.',
      ],
      error: 'SyntaxError: Invalid Python function definition',
    };
  }

  if (cleanCode.includes('def divide') && !defMatch) {
    return {
      service: 'Verdict404',
      task: 'safe_divide',
      language,
      verdict: 'ERROR',
      tests_passed: 0,
      tests_failed: 0,
      confidence: 0,
      evidence: [
        'ERROR: SyntaxError - Malformed function header or missing colon in `def divide`.',
      ],
      error: 'SyntaxError: invalid syntax (missing colon or unmatched parentheses)',
    };
  }

  const rawParams = (defMatch ? defMatch[1] : '').trim();
  const params = rawParams
    ? rawParams.split(',').map((p) => p.trim().split('=')[0].trim()).filter(Boolean)
    : [];

  const evidence: string[] = [];
  let passed = 0;
  let failed = 0;

  // Check 1: divide() accepts exactly two parameters
  if (params.length === 2) {
    evidence.push('PASS: divide() accepts two parameters.');
    passed++;
  } else {
    evidence.push(`FAIL: divide() expects exactly 2 parameters, got ${params.length}.`);
    failed++;
  }

  // Check 2: a division operation exists
  const hasDivision = /\b\w+\s*\/\s*\w+/.test(cleanCode) || cleanCode.includes('/');
  if (hasDivision) {
    evidence.push('PASS: division operation detected.');
    passed++;
  } else {
    evidence.push('FAIL: no division operator (/) detected in function body.');
    failed++;
  }

  // Check 3: an explicit zero-division guard exists
  const hasGuard =
    /(if\s+([a-zA-Z0-9_]+)\s*==\s*0|if\s+not\s+([a-zA-Z0-9_]+)|if\s+([a-zA-Z0-9_]+)\s*<=\s*0|if\s+([a-zA-Z0-9_]+)\s*!=\s*0|except\s+ZeroDivisionError)/i.test(
      cleanCode
    );

  if (hasGuard) {
    evidence.push('PASS: zero-division guard detected.');
    passed++;
  } else {
    evidence.push('FAIL: no explicit zero-division guard detected.');
    failed++;
  }

  // Check 4: the function returns a result
  const hasReturn = /\breturn\b/.test(cleanCode);
  if (hasReturn) {
    evidence.push('PASS: function returns a result.');
    passed++;
  } else {
    evidence.push('FAIL: function does not contain a return statement.');
    failed++;
  }

  const total = passed + failed;
  const confidence = Math.round((passed / total) * 100);
  const verdict = failed === 0 ? 'PASS' : 'FAIL';

  return {
    service: 'Verdict404',
    task: 'safe_divide',
    language,
    verdict,
    tests_passed: passed,
    tests_failed: failed,
    confidence,
    evidence,
  };
}

function evaluateValidateJson(code: string, language: string): VerifyResponse {
  let parsed: any;
  try {
    parsed = JSON.parse(code);
  } catch (err: any) {
    return {
      service: 'Verdict404',
      task: 'validate_json',
      language,
      verdict: 'ERROR',
      tests_passed: 0,
      tests_failed: 0,
      confidence: 0,
      evidence: [
        `ERROR: Malformed JSON payload. Parse error: ${err?.message || 'Invalid syntax'}.`,
      ],
      error: `JSONParseError: ${err?.message || 'Invalid JSON syntax'}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      service: 'Verdict404',
      task: 'validate_json',
      language,
      verdict: 'FAIL',
      tests_passed: 0,
      tests_failed: 4,
      confidence: 0,
      evidence: [
        'FAIL: Top-level JSON payload must be an object (not an array, string, or primitive).',
        "FAIL: required field 'name' is missing.",
        "FAIL: required field 'age' is missing.",
        "FAIL: 'name' must be a string and 'age' must be an integer.",
      ],
    };
  }

  const evidence: string[] = [];
  let passed = 0;
  let failed = 0;

  // Check 1: required field name exists
  if ('name' in parsed) {
    evidence.push("PASS: required field 'name' exists.");
    passed++;
  } else {
    evidence.push("FAIL: required field 'name' is missing.");
    failed++;
  }

  // Check 2: required field age exists
  if ('age' in parsed) {
    evidence.push("PASS: required field 'age' exists.");
    passed++;
  } else {
    evidence.push("FAIL: required field 'age' is missing.");
    failed++;
  }

  // Check 3: name is a string
  if (typeof parsed.name === 'string') {
    evidence.push("PASS: 'name' is a string.");
    passed++;
  } else {
    evidence.push("FAIL: 'name' must be a string.");
    failed++;
  }

  // Check 4: age is an integer
  if (typeof parsed.age === 'number' && Number.isInteger(parsed.age)) {
    evidence.push("PASS: 'age' is an integer.");
    passed++;
  } else {
    evidence.push("FAIL: 'age' must be an integer.");
    failed++;
  }

  const total = passed + failed;
  const confidence = Math.round((passed / total) * 100);
  const verdict = failed === 0 ? 'PASS' : 'FAIL';

  return {
    service: 'Verdict404',
    task: 'validate_json',
    language,
    verdict,
    tests_passed: passed,
    tests_failed: failed,
    confidence,
    evidence,
  };
}
