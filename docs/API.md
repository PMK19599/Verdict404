# Verdict404 API Contract

Verdict404 exposes an x402-protected verification endpoint for AI agents.

## Architecture

Frontend / Agent  
→ Verdict404 x402 Gateway  
→ Verification Engine  
→ PASS / FAIL / ERROR

Local gateway:

`http://127.0.0.1:3000`

Local verification engine:

`http://127.0.0.1:8000`

The frontend should integrate with the gateway, not call the verification engine directly.

---

## Gateway Health

### GET /

Example response:

```json
{
  "service": "Verdict404 x402 Gateway",
  "status": "running",
  "version": "0.2",
  "payment": "x402 enabled",
  "network": "Algorand TestNet",
  "verification_endpoint": "/verify"
}