# Verdict404 API Contract

Verdict404 exposes an x402-protected verification service for AI agents.

## Architecture

Live frontend flow:

Frontend
→ Verdict404 Paying Agent
→ Verdict404 x402 Gateway
→ Verification Engine
→ PASS / FAIL / ERROR

Local paying agent:
http://127.0.0.1:3100

Local x402 gateway:
http://127.0.0.1:3000

Local verification engine:
http://127.0.0.1:8000

Important integration rule:

The browser frontend must use the Paying Agent on port 3100 for real x402 verification.

The browser must NOT contain payer mnemonics, private keys, recovery phrases, or signing credentials.

The browser should NOT call the FastAPI verification engine directly in live mode.

The browser should NOT attempt to perform the current local mnemonic-based x402 signing flow itself.

---

## Paying Agent Health

### GET http://127.0.0.1:3100/

Example response:

{
  "service": "Verdict404 Paying Agent",
  "status": "running",
  "version": "0.1",
  "payer": "ALGORAND_PAYER_ADDRESS",
  "gateway": "http://127.0.0.1:3000/verify",
  "network": "Algorand TestNet"
}

The Paying Agent securely holds the local TestNet payer signer and performs the real x402 payment flow on behalf of the demo frontend.

The payer mnemonic remains local and is never returned to the frontend.

---

## Live Frontend Verification

### POST http://127.0.0.1:3100/verify

This is the recommended live frontend integration endpoint.

Standard request:

{
  "task": "TASK_NAME",
  "language": "LANGUAGE",
  "code": "CONTENT_TO_VERIFY"
}

The Paying Agent:

1. receives the frontend request
2. calls the x402-protected gateway
3. receives HTTP 402 Payment Required
4. signs and submits the x402 payment
5. completes Algorand TestNet settlement
6. receives the verification result
7. returns payment proof and the Verdict404 result to the frontend

Example successful response:

{
  "payment": {
    "success": true,
    "payer": "ALGORAND_PAYER_ADDRESS",
    "transaction": "ALGORAND_TRANSACTION_ID",
    "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI="
  },
  "result": {
    "service": "Verdict404",
    "task": "safe_divide",
    "language": "python",
    "verdict": "PASS",
    "tests_passed": 4,
    "tests_failed": 0,
    "confidence": 100,
    "evidence": [
      "PASS: divide() accepts two parameters.",
      "PASS: division operation detected.",
      "PASS: zero-division guard detected.",
      "PASS: function returns a result."
    ]
  }
}

The frontend should display the real payment transaction when payment.transaction is present.

Do not generate fake transaction IDs in live mode.

---

## x402 Gateway Health

### GET http://127.0.0.1:3000/

Example response:

{
  "service": "Verdict404 x402 Gateway",
  "status": "running",
  "version": "0.3",
  "payment": "x402 enabled",
  "network": "Algorand TestNet",
  "verification_endpoint": "/verify",
  "supported_tasks": [
    "safe_divide",
    "validate_json"
  ]
}

---

## x402-Protected Gateway Endpoint

### POST http://127.0.0.1:3000/verify

This endpoint is protected by x402.

Valid unpaid requests receive:

HTTP 402 Payment Required

Current verification price:

0.01 USDC

Current network:

Algorand TestNet

The Paying Agent uses this gateway endpoint internally.

The browser frontend should not use this endpoint directly for the current real payment flow because signing credentials must not be exposed in browser JavaScript.

---

## Pre-Payment Validation

The gateway performs lightweight request validation before the x402 payment middleware.

Obviously invalid requests are rejected before payment so callers are not charged unnecessarily.

Examples rejected before payment:

- malformed JSON
- missing task
- missing language
- missing or empty code
- unsupported task
- unsupported task/language combination

Example invalid request:

{
  "task": "banana",
  "language": "xyz",
  "code": "hello"
}

Example response:

HTTP 422

{
  "service": "Verdict404",
  "task": "banana",
  "language": "xyz",
  "verdict": "ERROR",
  "tests_passed": 0,
  "tests_failed": 0,
  "confidence": 0,
  "evidence": [
    "Unsupported verification task or task/language combination."
  ]
}

Supported task/language pairs:

safe_divide + python

validate_json + json

---

## Standard Verification Result

Verifier responses use this shape:

{
  "service": "Verdict404",
  "task": "TASK_NAME",
  "language": "LANGUAGE",
  "verdict": "PASS",
  "tests_passed": 4,
  "tests_failed": 0,
  "confidence": 100,
  "evidence": [
    "PASS: example verification evidence."
  ]
}

Possible verdicts:

- PASS
- FAIL
- ERROR

---

## Task: safe_divide

Purpose:

Verify a Python function named divide.

Request:

{
  "task": "safe_divide",
  "language": "python",
  "code": "def divide(a, b):\n    if b == 0:\n        return None\n    return a / b"
}

Checks:

1. divide() accepts exactly two parameters
2. a division operation exists
3. an explicit zero-division guard exists
4. the function returns a result

PASS example:

{
  "service": "Verdict404",
  "task": "safe_divide",
  "language": "python",
  "verdict": "PASS",
  "tests_passed": 4,
  "tests_failed": 0,
  "confidence": 100,
  "evidence": [
    "PASS: divide() accepts two parameters.",
    "PASS: division operation detected.",
    "PASS: zero-division guard detected.",
    "PASS: function returns a result."
  ]
}

FAIL example input:

def divide(a, b):
    return a / b

FAIL example result:

{
  "service": "Verdict404",
  "task": "safe_divide",
  "language": "python",
  "verdict": "FAIL",
  "tests_passed": 3,
  "tests_failed": 1,
  "confidence": 75,
  "evidence": [
    "PASS: divide() accepts two parameters.",
    "PASS: division operation detected.",
    "FAIL: no explicit zero-division guard detected.",
    "PASS: function returns a result."
  ]
}

---

## Task: validate_json

Purpose:

Verify structured JSON generated by an AI agent.

Current MVP expects:

- name -> string
- age -> integer

Request:

{
  "task": "validate_json",
  "language": "json",
  "code": "{\"name\":\"Alice\",\"age\":22}"
}

Checks:

1. required field name exists
2. required field age exists
3. name is a string
4. age is an integer

PASS example:

{
  "service": "Verdict404",
  "task": "validate_json",
  "language": "json",
  "verdict": "PASS",
  "tests_passed": 4,
  "tests_failed": 0,
  "confidence": 100,
  "evidence": [
    "PASS: required field 'name' exists.",
    "PASS: required field 'age' exists.",
    "PASS: 'name' is a string.",
    "PASS: 'age' is an integer."
  ]
}

FAIL example input:

{
  "name": 123
}

FAIL example result:

{
  "service": "Verdict404",
  "task": "validate_json",
  "language": "json",
  "verdict": "FAIL",
  "tests_passed": 1,
  "tests_failed": 3,
  "confidence": 25,
  "evidence": [
    "PASS: required field 'name' exists.",
    "FAIL: required field 'age' is missing.",
    "FAIL: 'name' must be a string.",
    "FAIL: 'age' must be an integer."
  ]
}

Malformed JSON returns ERROR.

---

## Frontend Integration Modes

Verdict404 frontend should preserve two clearly separated modes.

### Mock Sandbox

Used for:

- UI development
- offline visual demonstrations
- quick testing without spending TestNet USDC

Mock mode may simulate:

- HTTP 402
- payment progression
- settlement
- transaction identifiers

All simulated payment information must remain clearly labeled as simulated.

### Live x402 Mode

Live mode must call:

POST http://127.0.0.1:3100/verify

Live mode must use the actual response returned by the Paying Agent.

Live mode must not simulate payment success or transaction IDs.

Recommended frontend states:

- IDLE
- REQUESTING
- PAYMENT_REQUIRED
- PAYING
- PAYMENT_SETTLED
- VERIFYING
- PASS
- FAIL
- ERROR

Recommended visible flow:

User submits content
→ Paying Agent
→ x402 Gateway
→ HTTP 402 Payment Required
→ x402 payment
→ Algorand settlement
→ independent verification
→ PASS / FAIL / ERROR

---

## Security Boundary

Never expose any of the following in frontend code:

- wallet mnemonic
- recovery phrase
- private key
- payer secret
- .env
- .payer-secret.txt

Signing credentials must never be bundled into browser JavaScript.

Current local architecture keeps the signer inside the Paying Agent process on port 3100.

The frontend receives only safe output such as:

- payer public address
- transaction ID
- payment success state
- network
- verification result

---

## Supported Tasks

Task: safe_divide
Language: Python
Purpose: Python code verification

Task: validate_json
Language: JSON
Purpose: Structured AI output validation

---

## Local Service Summary

Frontend:
http://localhost:5173

Paying Agent:
http://127.0.0.1:3100

x402 Gateway:
http://127.0.0.1:3000

Verification Engine:
http://127.0.0.1:8000

Live frontend verification endpoint:
POST http://127.0.0.1:3100/verify

Protected x402 gateway endpoint:
POST http://127.0.0.1:3000/verify