# Verdict404

> **AI shouldn't grade its own homework.**

Verdict404 is an **independent, pay-per-use verification layer for autonomous AI agents**.

Instead of allowing an AI agent to evaluate its own generated code or structured output, Verdict404 provides an external verification service that returns a deterministic **PASS / FAIL / ERROR** verdict with an evidence trace.

Verification is paid only when it is requested through **x402**, using **0.01 USDC on Algorand TestNet**.

---

## The Problem

Autonomous AI agents are becoming capable of generating code, structured outputs, and taking actions on behalf of users.

But this creates a trust problem:

> **Who verifies the agent's output when the agent itself is the one doing the evaluation?**

If the same system generates an answer and decides that the answer is correct, there is a risk of **self-evaluation, hallucinated correctness, and unchecked failures**.

Verification can also become an always-on infrastructure cost even when it is only needed occasionally.

Verdict404 approaches verification differently:

> **Verification should be an on-demand infrastructure service — and you should pay only when you use it.**

---

## The Solution

Verdict404 acts as an independent verification layer between an autonomous agent and the result it wants to trust.

An agent sends its generated code or structured output to Verdict404. The gateway requires payment through **x402**, settles **0.01 USDC on Algorand TestNet**, and then forwards the request to a deterministic verification engine.

The engine evaluates the submitted payload against predefined verification rules and returns:

- **PASS** — all verification checks succeeded.
- **FAIL** — one or more checks failed.
- **ERROR** — the input could not be evaluated reliably.

Every verdict includes an **evidence trace**, showing which checks passed or failed.

### Core Workflow

```text
Autonomous Agent
       │
       ▼
POST /verify
       │
       ▼
Verdict404 Gateway
       │
       ├── HTTP 402 Payment Required
       │
       ▼
x402 Payment
0.01 USDC on Algorand TestNet
       │
       ▼
Payment Settlement
       │
       ▼
Independent Verification Engine
       │
       ▼
PASS / FAIL / ERROR
       │
       ▼
Evidence Trace