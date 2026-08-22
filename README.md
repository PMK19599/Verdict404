# Verdict404

> **AI shouldn't grade its own homework.**

Verdict404 is an **agent-first independent verification service** for autonomous AI agents.

An agent can submit code for verification, receive an **HTTP 402 Payment Required** challenge, pay **0.01 USDC through x402 on Algorand TestNet**, and receive an independent **PASS / FAIL / ERROR verdict with evidence**.

---

## The Problem

AI agents are increasingly capable of generating code, structured outputs, decisions, and actions.

But there is a reliability problem:

**The same AI that generates an output is often trusted to evaluate whether that output is correct.**

An autonomous agent needs an independent service it can ask:

> "Can someone else verify this result for me?"

Verdict404 turns verification into a **machine-to-machine, pay-per-use service**.

---

## The Solution

Verdict404 provides a paid verification endpoint:

```text
POST /verify