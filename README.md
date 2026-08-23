# Verdict404

> **AI shouldn't grade its own homework.**

Verdict404 is an **independent, pay-per-use verification layer for autonomous AI agents**.

Instead of allowing an AI agent to evaluate its own generated code or structured output, Verdict404 provides an external verification service that returns a deterministic **PASS / FAIL / ERROR** verdict with an evidence trace.

Verification is requested through **x402** and currently costs **0.01 USDC on Algorand TestNet**.

---

## The Problem

Autonomous AI agents are increasingly capable of generating code, structured outputs, decisions, and actions on behalf of users.

But this creates a fundamental trust problem:

> **Who verifies the agent's output when the agent itself is the one doing the evaluation?**

If the same system generates an output and decides that the output is correct, there is a risk of:

- Self-evaluation
- Hallucinated correctness
- Unchecked failures
- Unsafe code execution
- Invalid structured outputs reaching downstream systems

There is also a cost problem.

Verification may only be needed occasionally, but traditional infrastructure can require services to remain available continuously.

That creates unnecessary resource usage and cost.

Verdict404 approaches this differently:

> **Verification should be an on-demand infrastructure service — and you should pay only when you use it.**

---

## The Solution

Verdict404 acts as an **independent verification layer** between an autonomous agent and the result it wants to trust.

An agent submits generated code or structured output to Verdict404.

The system then:

1. Receives the verification request.
2. Enforces the x402 payment requirement.
3. Requests payment of **0.01 USDC**.
4. Settles the payment on **Algorand TestNet**.
5. Sends the payload to an independent verification engine.
6. Evaluates the payload against predefined deterministic rules.
7. Returns a **PASS / FAIL / ERROR** verdict.
8. Provides an evidence trace explaining the result.

### Core Workflow

```text
Autonomous Agent
       |
       v
   POST /verify
       |
       v
Verdict404 Gateway
       |
       v
HTTP 402 Payment Required
       |
       v
    x402 Payment
    0.01 USDC
       |
       v
Algorand TestNet Settlement
       |
       v
Independent Verification Engine
       |
       v
PASS / FAIL / ERROR
       |
       v
Evidence Trace
```

---

# What We Built

Verdict404 currently provides a working paid verification gateway with **two deterministic verification targets**:

1. `safe_divide` — Python code verification
2. `validate_json` — structured JSON verification

The purpose of having two targets is important.

We are **not building a product that only checks one `divide()` function**.

`safe_divide` demonstrates independent verification of generated code, while `validate_json` demonstrates that the same verification infrastructure can also validate structured outputs.

The underlying architecture can therefore support additional verification modules later.

---

# Verification Target 1: `safe_divide`

`safe_divide` verifies a Python function against four deterministic invariants.

The verifier checks:

1. `divide()` accepts exactly two parameters.
2. A division operation exists.
3. An explicit zero-division guard exists.
4. The function returns a result.

### Passing Example

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

Expected result:

```text
PASS
Tests passed: 4
Tests failed: 0
Confidence: 100%
```

Evidence trace:

```text
PASS: divide() accepts two parameters.
PASS: division operation detected.
PASS: zero-division guard detected.
PASS: function returns a result.
```

### Failing Example

```python
def divide(a, b):
    return a / b
```

The function performs division but does not explicitly guard against division by zero.

Expected result:

```text
FAIL
Tests passed: 3
Tests failed: 1
Confidence: 75%
```

Evidence trace:

```text
PASS: divide() accepts two parameters.
PASS: division operation detected.
FAIL: no explicit zero-division guard detected.
PASS: function returns a result.
```

This demonstrates an important property of Verdict404:

> The verifier does not simply say that code "looks correct". It evaluates explicit invariants and exposes the evidence behind the verdict.

---

# Verification Target 2: `validate_json`

Autonomous agents frequently generate structured data that is passed directly into other services.

A JSON payload can be syntactically valid while still containing invalid fields or incorrect data types.

`validate_json` demonstrates independent verification of this type of agent-generated output.

The current verifier checks:

1. Required field `name` exists.
2. Required field `age` exists.
3. `name` is a string.
4. `age` is an integer.

### Passing Example

```json
{
  "name": "Alice",
  "age": 22
}
```

Expected result:

```text
PASS
Tests passed: 4
Tests failed: 0
Confidence: 100%
```

Evidence trace:

```text
PASS: required field 'name' exists.
PASS: required field 'age' exists.
PASS: 'name' is a string.
PASS: 'age' is an integer.
```

### Failing Example

```json
{
  "name": "Alice",
  "age": "twenty"
}
```

Expected result:

```text
FAIL
Tests passed: 3
Tests failed: 1
Confidence: 75%
```

Evidence trace:

```text
PASS: required field 'name' exists.
PASS: required field 'age' exists.
PASS: 'name' is a string.
FAIL: 'age' must be an integer.
```

This proves that the verification infrastructure is not tied to a single Python example.

The same paid verification layer can independently evaluate different types of agent-generated payloads.

---

# Verdict Model

Verdict404 uses three possible outcomes:

| Verdict | Meaning |
|---|---|
| **PASS** | All required verification checks succeeded. |
| **FAIL** | The payload was evaluated successfully, but one or more checks failed. |
| **ERROR** | The payload could not be evaluated reliably because of invalid input, syntax, parsing, or another verification error. |

This distinction matters.

### PASS

The verifier successfully evaluated the payload and every required rule passed.

### FAIL

The verifier successfully evaluated the payload, but one or more rules were violated.

### ERROR

The verifier could not reliably complete the evaluation.

For example:

- Invalid Python syntax
- Malformed JSON
- Invalid request structure
- Unsupported verification target

Therefore:

> **FAIL means "we evaluated it and it violated a rule."**

while:

> **ERROR means "we could not reliably evaluate it."**

---

# x402 + Algorand Integration

Verdict404 uses **x402** to make verification a machine-to-machine, pay-per-request service.

Instead of requiring an autonomous agent to maintain a subscription, the verification endpoint can require payment when the verification capability is actually requested.

The payment flow is:

```text
Agent requests verification
          |
          v
Verdict404 Gateway
          |
          v
HTTP 402 Payment Required
          |
          v
x402 payment
          |
          v
0.01 USDC
          |
          v
Algorand TestNet settlement
          |
          v
Independent verification
          |
          v
PASS / FAIL / ERROR
```

The important design principle is:

> **Verification is paid for when verification is requested.**

---

# Why x402 Matters

Verdict404 is not simply a verification API with a payment button.

The larger goal is to demonstrate that **autonomous software can consume verification as a paid capability**.

An autonomous agent can:

1. Submit its output.
2. Receive a machine-readable payment requirement.
3. Complete the x402 payment flow.
4. Retry the request.
5. Receive an independent verification result.

This makes verification suitable for automated agent-to-service interactions.

The agent does not need a human to manually approve every verification request.

---

# Why Pay-Per-Use?

Consider a service that is needed only occasionally.

A traditional model might look like:

```text
Monthly subscription
        |
        v
Always-available infrastructure
        |
        v
Pay even when unused
```

Verdict404 demonstrates an alternative:

```text
Need verification
        |
        v
Request verification
        |
        v
Pay 0.01 USDC
        |
        v
Receive independent verdict
```

The goal is to make verification **demand-driven instead of permanently paid for**.

This is especially relevant for autonomous agents because their need for external capabilities can change dynamically from task to task.

---

# Real-World Impact

Verdict404 is designed for environments where autonomous systems need to produce outputs or take actions without a human manually reviewing every step.

## AI Coding Agents

An AI coding agent could request independent verification before:

- Executing generated code
- Deploying generated code
- Passing generated code to another system

## Structured-Output Agents

Agents generating JSON, configuration, or structured payloads could request validation before their output reaches downstream systems.

## Tool-Using Agents

Before an autonomous agent executes a tool call, an external verifier could check:

- Required parameters
- Parameter types
- Allowed values
- Predefined constraints

## Multi-Agent Systems

One agent can request verification from an independent service rather than trusting another agent's self-evaluation.

## Automated Workflows

Verification can be inserted only at points where additional confidence is required.

---

# The Larger Idea

The core idea behind Verdict404 is not:

> "Let's verify Python code."

The deeper idea is:

> **Verification itself can become a composable capability that autonomous agents can request and pay for when they need it.**

Just as an autonomous agent may consume capabilities such as:

```text
Search
Compute
Storage
API
Payment
```

it could also consume:

```text
Verification
```

The agent does not need to permanently operate its own verification infrastructure.

It can request an independent verifier when needed.

---

# Live Demo

### Frontend

https://verdict404.vercel.app

### Verification Gateway

https://verdict404-gateway.onrender.com

### Verification Engine

https://verdict404-verify.onrender.com

The frontend demonstrates the complete verification experience:

```text
Select verification target
        |
        v
Submit autonomous payload
        |
        v
x402 payment requirement
        |
        v
Payment / settlement
        |
        v
Independent verification
        |
        v
PASS / FAIL / ERROR
        |
        v
Evidence trace
```

The interface currently demonstrates:

- Python `safe_divide`
- JSON `validate_json`

---

# API

## `POST /verify`

The main verification endpoint exposed by the Verdict404 gateway.

### Python Example

```json
{
  "task": "safe_divide",
  "language": "python",
  "code": "def divide(a, b):\n    if b == 0:\n        return None\n    return a / b"
}
```

### JSON Example

```json
{
  "task": "validate_json",
  "language": "json",
  "code": "{\"name\":\"Alice\",\"age\":22}"
}
```

Current supported verification combinations:

```text
safe_divide + python
validate_json + json
```

---

# Example API Response

A successful Python verification response:

```json
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
```

A failed JSON verification can return:

```json
{
  "service": "Verdict404",
  "task": "validate_json",
  "language": "json",
  "verdict": "FAIL",
  "tests_passed": 3,
  "tests_failed": 1,
  "confidence": 75,
  "evidence": [
    "PASS: required field 'name' exists.",
    "PASS: required field 'age' exists.",
    "PASS: 'name' is a string.",
    "FAIL: 'age' must be an integer."
  ]
}
```

The evidence array makes the result inspectable instead of returning only a single PASS or FAIL value.

---

# On-Chain & Payment Details

Verdict404 uses Algorand TestNet for the payment settlement layer.

| Property | Value |
|---|---|
| Network | Algorand TestNet |
| Payment asset | USDC |
| Verification price | 0.01 USDC |
| Payment protocol | x402 |
| Payment model | Pay-per-request |
| Payment recipient | Configured Algorand address |

### Public Payment Recipient

```text
DKDPLWC6LSEAYGJS5M7X5B4UAUWQZXV66VHUDCGELMP3XY4OXVOTXF6FX4
```

---

# Architecture

Verdict404 separates the user-facing interface, payment gateway, and verification engine.

```text
                     Autonomous Agent
                            |
                            v
                    +---------------+
                    |   Frontend    |
                    |    Vercel     |
                    +-------+-------+
                            |
                            | POST /verify
                            v
                    +---------------+
                    |  Verdict404   |
                    |    Gateway    |
                    |    Render     |
                    +-------+-------+
                            |
                            v
                       x402 Payment
                            |
                            v
                    +---------------+
                    |   Algorand    |
                    |   TestNet     |
                    |   0.01 USDC   |
                    +-------+-------+
                            |
                            v
                    +---------------+
                    | Verification  |
                    |    Engine     |
                    |    Render     |
                    +-------+-------+
                            |
                +-----------+-----------+
                |           |           |
                v           v           v
              PASS        FAIL        ERROR
                |           |           |
                +-----------+-----------+
                            |
                            v
                     Evidence Trace
```

---

# Component Responsibilities

## Frontend

The frontend provides the interactive verification experience.

Responsibilities include:

- Selecting verification targets
- Editing agent-generated payloads
- Submitting verification requests
- Displaying payment state
- Displaying settlement state
- Displaying verification results
- Showing evidence traces

## x402 Gateway

The gateway is the paid entry point into the verification service.

Responsibilities include:

- API request handling
- Input validation
- x402 payment enforcement
- Payment configuration
- Forwarding valid requests to the verification engine
- Returning the final verification response

## Verification Engine

The verification engine performs the deterministic checks.

Current modules:

```text
safe_divide
    |
    +-- Python invariant verification

validate_json
    |
    +-- JSON schema/type verification
```

The separation is intentional.

The component responsible for enforcing paid access is separate from the component responsible for determining whether a submitted payload passes the verification rules.

---

# Verification Demonstration

Verdict404 demonstrates three meaningful outcomes.

## PASS

A valid payload satisfies every invariant.

```text
safe_divide
     |
     v
4 checks
     |
     +-- PASS
     +-- PASS
     +-- PASS
     +-- PASS
     |
     v
VERDICT: PASS
Confidence: 100%
```

## FAIL

A valid payload is successfully evaluated but violates one or more rules.

```text
safe_divide
     |
     v
4 checks
     |
     +-- PASS
     +-- PASS
     +-- FAIL
     +-- PASS
     |
     v
VERDICT: FAIL
Confidence: 75%
```

## ERROR

The verifier cannot reliably evaluate the payload.

Examples include:

- Invalid Python syntax
- Malformed JSON
- Unsupported task/language combinations
- Invalid request structure

```text
Malformed input
       |
       v
Verification cannot be completed
       |
       v
VERDICT: ERROR
```

This gives agents a meaningful distinction between:

> **"The output is wrong."**

and

> **"The output could not be evaluated."**

---

# Security & Trust Model

Verdict404 does not claim that a deterministic verifier can prove arbitrary software correctness.

Instead, the current prototype defines explicit verification invariants and evaluates submitted payloads against those rules.

The trust boundary is therefore transparent:

```text
Agent-generated output
          |
          v
Independent verifier
          |
          v
Explicit verification rules
          |
          v
Evidence
          |
          v
Machine-readable verdict
```

The evidence trace makes the reason for the verdict inspectable rather than hiding the decision behind a single unexplained score.

---

# Current Prototype Scope

The hackathon prototype intentionally focuses on proving the **complete infrastructure loop** rather than attempting to build a universal code-analysis platform.

The working loop is:

```text
Agent payload
     |
     v
Paid endpoint
     |
     v
x402
     |
     v
Algorand settlement
     |
     v
Independent verification
     |
     v
Deterministic verdict
     |
     v
Evidence
```

The two verification targets demonstrate that the architecture can support different payload types.

---

# Local Development

## Prerequisites

- Node.js
- pnpm
- Python 3
- Git
- An Algorand-compatible wallet for TestNet payment testing

## Clone the Repository

```bash
git clone https://github.com/PMK19599/Verdict404.git
cd Verdict404
```

## Project Structure

```text
Verdict404/
|
+-- frontend/
|   +-- Web interface
|
+-- x402-gateway/
|   +-- Paid verification gateway
|
+-- verify-service/
|   +-- Deterministic verification engine
|
+-- agent-demo/
|   +-- Agent/client demonstration
|
+-- README.md
```

---

# Environment Configuration

Deployment configuration is supplied through environment variables.

Example:

```text
AVM_ADDRESS=<Algorand payment recipient>
FACILITATOR_URL=<x402 facilitator>
VERIFY_SERVICE_URL=<verification engine URL>
```

Secrets and deployment-specific credentials should be configured through the deployment environment rather than committed to the repository.

---

# Future Scope

The current prototype demonstrates deterministic verification for Python code and JSON outputs.

The same architecture can be extended with additional verification modules, including:

- API request and response validation
- Agent tool-call policy checks
- Security and safety invariants
- Configuration validation
- Data validation
- Schema verification
- Domain-specific compliance checks
- Smart-contract invariant verification
- Multiple independent verification providers
- Additional programming languages
- More complex test suites
- Dynamic verification pricing based on verification complexity

A future version could allow agents to discover verification capabilities dynamically:

```text
Agent
  |
  v
Discover verifier
  |
  v
Select verification capability
  |
  v
Request verification
  |
  v
Pay through x402
  |
  v
Submit payload
  |
  v
Receive independent verdict
```

The long-term vision is:

> **Verification as a composable, pay-per-use capability that autonomous agents can discover, purchase, and consume programmatically.**

---

# Demo Sequence

For the hackathon demonstration, the recommended flow is:

### 1. Introduce the problem

> "AI shouldn't grade its own homework."

Explain that an autonomous agent can generate an output and potentially evaluate its own output.

### 2. Show `safe_divide`

Start with the guarded implementation:

```python
def divide(a, b):
    if b == 0:
        return None
    return a / b
```

Run verification.

Show:

```text
PASS
4 checks passed
0 checks failed
100% confidence
0.01 USDC
```

### 3. Demonstrate an actual failure

Replace it with:

```python
def divide(a, b):
    return a / b
```

Run verification again.

Show:

```text
FAIL
3 checks passed
1 check failed
75% confidence
```

Point to the evidence trace:

```text
FAIL: no explicit zero-division guard detected.
```

### 4. Show that the system is not limited to Python

Switch to `validate_json`.

Use:

```json
{
  "name": "Alice",
  "age": 22
}
```

Run verification and show PASS.

Then change it to:

```json
{
  "name": "Alice",
  "age": "twenty"
}
```

Run verification again.

Show the resulting FAIL and evidence.

### 5. Explain x402

Point out that verification is not simply free backend logic.

The request passes through the paid gateway:

```text
Request
  |
  v
HTTP 402
  |
  v
0.01 USDC
  |
  v
Algorand TestNet settlement
  |
  v
Verification
  |
  v
Verdict + Evidence
```

### 6. Finish with the larger idea

> **We are not building a better `divide()` function. We are building a verification layer that autonomous agents can pay for and consume whenever they need independent trust.**

---

# Hackathon

Verdict404 was built for the **Global x402 Challenge**.

The project explores how x402 can enable autonomous agents to consume **pay-per-use verification services** without requiring continuous subscriptions.

The prototype combines:

- Autonomous-agent verification
- Deterministic verification rules
- x402 payment requirements
- Algorand TestNet settlement
- Independent verification infrastructure
- Evidence-backed PASS / FAIL / ERROR results

---

# Team

## Verdict404

### Purushotham K (PMK)

System architecture, verification design, x402 integration, frontend integration, product direction, and pitch.

### Gagan M

Full-stack development, gateway/backend integration, frontend implementation, and deployment.

---

# Demo Links

### Frontend

https://verdict404.vercel.app

### Verification Gateway

https://verdict404-gateway.onrender.com

### Verification Engine

https://verdict404-verify.onrender.com

---

# Key Takeaway

> **AI shouldn't grade its own homework.**

Verdict404 provides an independent verification boundary for autonomous AI systems.

It demonstrates how verification can become a **machine-to-machine, pay-per-use service** powered by **x402 and Algorand TestNet**.

Instead of trusting an agent to say:

```text
"My output is correct."
```

the agent can request:

```text
"Verify this independently."
```

and receive:

```text
PASS / FAIL / ERROR
+
Evidence
+
Pay-per-use settlement
```

---

# License

This project is provided for hackathon and demonstration purposes.