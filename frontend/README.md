# Verdict404 Frontend

> **"AI shouldn't grade its own homework."**
> Independent verification infrastructure for autonomous AI agents over x402 on Algorand.

---

## Getting Started

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The frontend will start at `http://localhost:5173`.

### 3. Production Build

```bash
npm run build
npm run preview
```

---

## Authoritative Tasks Supported

1. **`safe_divide`** (Python 3):
   - Verifies that a Python function named `divide(a, b)` has exactly 2 parameters, includes a division operation `/`, has an explicit zero-division guard, and returns a value.
2. **`validate_json`** (JSON Schema):
   - Verifies that structured AI output has required `name` (string) and `age` (integer) fields and is valid JSON.

---

## 9-State Verification Pipeline

The UI steps through the complete flow:
1. `IDLE` - Ready for input
2. `REQUESTING` - Submitting payload to POST `/verify`
3. `PAYMENT_REQUIRED` - 402 challenge (0.01 USDC on Algorand TestNet)
4. `PAYING` - x402 facilitator micropayment broadcast
5. `PAYMENT_SETTLED` - On-chain confirmation & transaction ID
6. `VERIFYING` - Independent AST & invariant validation engine
7. `PASS` / `FAIL` / `ERROR` - Itemized evidence traces, confidence scores, and raw JSON response

---

## Connecting to the Live Gateway

By default, the frontend runs in **Mock Sandbox Mode** matching the exact `docs/API.md` contract.

To connect to the live backend x402 Gateway:
1. Ensure the gateway is running (e.g. at `http://127.0.0.1:3000`).
2. Toggle the **Mock Sandbox / Live Gateway** button in the top navigation bar, OR set:
   ```env
   VITE_GATEWAY_URL=http://127.0.0.1:3000
   VITE_USE_MOCK=false
   ```
   in `frontend/.env`.
3. The service layer in `frontend/src/services/api.ts` cleanly directs requests to `POST /verify` and `GET /`.
