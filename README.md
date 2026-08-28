# Verdict404

> **AI shouldn't grade its own homework.**

Verdict404 is an independent, pay-per-use verification layer for autonomous AI agents. Instead of trusting agents to self-evaluate their own outputs, Verdict404 provides an external verification service that evaluates agent-generated code, structured data, and actions, returning a deterministic **PASS / FAIL / ERROR** verdict via an x402 payment flow settled on Algorand.

### Current Status / Limitations
**Status:** Working prototype on Algorand TestNet. Verification rules are deterministic and currently cover three demonstration targets. The system is intended to demonstrate the verification/payment architecture rather than serve as production financial infrastructure.

---

## Live Endpoints

*   **Frontend (Interactive Demo):** https://verdict404.vercel.app
*   **x402 Payment Gateway:** https://verdict404-gateway.onrender.com
*   **Verification Engine:** https://verdict404-verify.onrender.com

---

## Architecture & Stack

The architecture cleanly separates the paid access gateway from the deterministic verification engine.

```text
    Autonomous Agent / Frontend
             |
             v
   [ x402 Payment Gateway ]  (Node.js / TypeScript)
             |
      (Algorand TestNet)
             |
             v
  [ Verification Engine ]    (Python / FastAPI)
```

*   **Frontend:** React + Vite
*   **x402 Gateway:** Node.js + TypeScript (Express) + `@algorandfoundation/algokit-utils`
*   **Verification Engine:** Python + FastAPI

---

## Core Workflow (x402 + Algorand)

Verification is treated as an on-demand, paid capability:

1.  **Request:** An autonomous agent or user submits a payload via `POST /verify`.
2.  **Payment Required:** The Verdict404 Gateway intercepts the request and issues an HTTP 402 Payment Required response.
3.  **Settlement:** The client executes a payment of **0.01 USDC** on the Algorand TestNet.
4.  **Verification:** Upon confirming settlement, the payload is forwarded to the independent Verification Engine.
5.  **Verdict:** The engine evaluates the payload and returns a verdict alongside an evidence trace.

---

## Verification Targets

The engine currently supports three independent deterministic verification rulesets:

1.  **`safe_divide` (Python):** Verifies that Python division code explicitly guards against zero-division errors.
2.  **`validate_json` (JSON):** Validates that an agent-generated JSON object strictly matches required schemas and data types.
3.  **`agent_action` (JSON):** Verifies autonomous agent policy intents before execution (e.g., enforcing that a `send_payment` action is <= 100 USDC).

### Example Payload (`POST /verify`)
```json
{
  "task": "agent_action",
  "language": "json",
  "code": "{\"action\": \"send_payment\", \"amount\": 50, \"currency\": \"USDC\", \"recipient\": \"ALICE\"}"
}
```

---

## The Verdict Model

The verifier does not just return a binary boolean; it distinguishes between a failed rule and a failure to evaluate.

| Verdict | Meaning |
|---|---|
| **PASS** | The payload was evaluated and all required verification checks succeeded. |
| **FAIL** | The payload was evaluated successfully, but one or more checks failed. |
| **ERROR** | The payload could not be evaluated reliably (e.g., syntax errors, invalid JSON). |

---

## Evidence & On-Chain Proof

Verdict404 doesn't just claim code "looks correct"—it exposes the explicit invariants evaluated to form the verdict. Every response includes an `evidence` array detailing exactly which tests passed or failed.

**Example Evidence Trace:**
```json
"evidence": [
  "PASS: supported action 'send_payment' detected.",
  "PASS: payment amount is a positive number.",
  "PASS: payment amount is within the 100 USDC policy limit.",
  "PASS: payment currency is USDC.",
  "PASS: payment recipient is present."
]
```

**On-Chain Payment Proof:**
Every successful verification is backed by an on-chain x402 payment. 
*   **Network:** Algorand TestNet
*   **Asset:** USDC (Asset ID: `10458941`)
*   **Cost:** `0.01 USDC`
*   **Example TestNet Transaction:** [`3DCJL2LNH2UKRQQXZK6637R0G474XISMPPGJFUEEOAAL6UYZH5AA`](https://testnet.algoexplorer.io/tx/3DCJL2LNH2UKRQQXZK6637R0G474XISMPPGJFUEEOAAL6UYZH5AA)

---

## Local Development Setup

To run the monorepo locally, you need to spin up the three independent services.

### 1. Verification Engine (Python)
```bash
cd verify-service
python -m venv venv
source venv/bin/activate
pip install fastapi pydantic uvicorn
uvicorn app:app --reload --port 8000
```

### 2. x402 Gateway (Node.js)
```bash
cd x402-gateway
pnpm install
pnpm run dev
```

### 3. Frontend (React)
```bash
cd frontend
pnpm install
pnpm run dev
```
