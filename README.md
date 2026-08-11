\# Verdict404



> \*\*AI shouldn't grade its own homework.\*\*



Verdict404 is an independent verification service for AI agents.



Instead of trusting an AI system to judge its own output, an agent can send code to Verdict404, receive an HTTP `402 Payment Required`, automatically pay a small USDC fee through x402 on Algorand, and receive an independent PASS / FAIL / ERROR verdict with evidence.



\---



\## Problem



AI agents are increasingly generating code, answers, actions, and decisions.



But a major problem remains:



\*\*The same AI that generates an answer is often also trusted to evaluate whether that answer is correct.\*\*



That creates a reliability problem.



An autonomous agent needs a way to ask:



> "Can an independent service verify this result for me?"



Verdict404 provides that verification layer.



\---



\## Solution



Verdict404 exposes a paid verification endpoint:



```text

POST /verify

