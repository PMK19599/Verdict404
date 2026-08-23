import { config } from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

import {
  paymentMiddleware,
  x402ResourceServer
} from "@x402/hono";

import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactAvmScheme } from "@x402/avm/exact/server";

import {
  USDC_TESTNET_ASA_ID
} from "@x402/avm";

const ALGORAND_TESTNET_CAIP2 =
  "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";

config();

const avmAddress = process.env.AVM_ADDRESS;
const facilitatorUrl = process.env.FACILITATOR_URL;

const verifyServiceUrl =
  process.env.VERIFY_SERVICE_URL ||
  "http://127.0.0.1:8000";

if (!avmAddress || !facilitatorUrl) {
  console.error(
    "Missing environment variables: AVM_ADDRESS or FACILITATOR_URL"
  );

  process.exit(1);
}

const facilitatorClient =
  new HTTPFacilitatorClient({
    url: facilitatorUrl
  });

const resourceServer =
  new x402ResourceServer(facilitatorClient);

resourceServer.register(
  ALGORAND_TESTNET_CAIP2,
  new ExactAvmScheme()
);

type GatewayEnv = {
  Variables: {
    verificationBody: Record<string, unknown>;
  };
};

const app = new Hono<GatewayEnv>();

// CORS / browser preflight support.
// Must run before x402 payment middleware so OPTIONS /verify
// is answered without requiring a payment.
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');

  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://verdict404.vercel.app'
  ];

  const isVercelPreview =
    typeof origin === 'string' &&
    /^https:\/\/verdict404-[a-z0-9-]+\.vercel\.app$/i.test(origin);

  if (
    origin &&
    (allowedOrigins.includes(origin) || isVercelPreview)
  ) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    const requestedHeaders =
      c.req.header('Access-Control-Request-Headers');

    c.header(
      'Access-Control-Allow-Headers',
      requestedHeaders ||
        'Content-Type, X-PAYMENT, X-PAYMENT-RESPONSE, PAYMENT-SIGNATURE'
    );

    c.header('Access-Control-Max-Age', '86400');
    c.header('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT, X-PAYMENT-RESPONSE');
  }

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  await next();
});

app.get("/", (c) => {
  return c.json({
    service: "Verdict404 x402 Gateway",
    status: "running",
    version: "0.3",
    payment: "x402 enabled",
    network: "Algorand TestNet",
    verification_endpoint: "/verify",
    supported_tasks: [
      "safe_divide",
      "validate_json",
      "agent_action"
    ]
  });
});

/*
 * Pre-payment validation.
 *
 * This runs BEFORE x402 middleware so obviously invalid
 * requests are rejected without charging the caller.
 */
app.use("/verify", async (c, next) => {
  if (c.req.method !== "POST") {
    await next();
    return;
  }

  let body: Record<string, unknown>;

  try {
    body = await c.req.raw.clone().json();
  } catch {
    c.status(400);

    return c.json({
      service: "Verdict404",
      task: "unknown",
      language: "unknown",
      verdict: "ERROR",
      tests_passed: 0,
      tests_failed: 0,
      confidence: 0,
      evidence: [
        "Request body must contain valid JSON."
      ]
    });
  }

  const task = body.task;
  const language = body.language;
  const code = body.code;

  if (
    typeof task !== "string" ||
    task.trim() === ""
  ) {
    c.status(400);

    return c.json({
      service: "Verdict404",
      task: "unknown",
      language:
        typeof language === "string"
          ? language.toLowerCase()
          : "unknown",
      verdict: "ERROR",
      tests_passed: 0,
      tests_failed: 0,
      confidence: 0,
      evidence: [
        "Field 'task' is required."
      ]
    });
  }

  if (
    typeof language !== "string" ||
    language.trim() === ""
  ) {
    c.status(400);

    return c.json({
      service: "Verdict404",
      task,
      language: "unknown",
      verdict: "ERROR",
      tests_passed: 0,
      tests_failed: 0,
      confidence: 0,
      evidence: [
        "Field 'language' is required."
      ]
    });
  }

  if (
    typeof code !== "string" ||
    code.trim() === ""
  ) {
    c.status(400);

    return c.json({
      service: "Verdict404",
      task,
      language: language.toLowerCase(),
      verdict: "ERROR",
      tests_passed: 0,
      tests_failed: 0,
      confidence: 0,
      evidence: [
        "Field 'code' must contain content to verify."
      ]
    });
  }

  const normalizedLanguage =
    language.toLowerCase();

  const validTaskLanguagePair =
    (
      task === "safe_divide" &&
      normalizedLanguage === "python"
    ) ||
    (
      task === "validate_json" &&
      normalizedLanguage === "json"
    ) ||
    (
      task === "agent_action" &&
      normalizedLanguage === "json"
    );

  if (!validTaskLanguagePair) {
    c.status(422);

    return c.json({
      service: "Verdict404",
      task,
      language: normalizedLanguage,
      verdict: "ERROR",
      tests_passed: 0,
      tests_failed: 0,
      confidence: 0,
      evidence: [
        (
          "Unsupported verification task or "
          + "task/language combination."
        )
      ]
    });
  }

  await next();
});

app.use(
  paymentMiddleware(
    {
      "POST /verify": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.01",
            network: ALGORAND_TESTNET_CAIP2,
            payTo: avmAddress,
            extra: {
              asset: USDC_TESTNET_ASA_ID
            }
          }
        ],

        description:
          "Independent verification by Verdict404",

        mimeType: "application/json"
      }
    },

    resourceServer
  )
);

app.post("/verify", async (c) => {
  try {
    const body = c.get("verificationBody");

    const response = await fetch(
      `${verifyServiceUrl}/run-tests`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(body)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      c.status(502);

      return c.json({
        service: "Verdict404",
        task:
          typeof body?.task === "string"
            ? body.task
            : "unknown",
        language:
          typeof body?.language === "string"
            ? body.language.toLowerCase()
            : "unknown",
        verdict: "ERROR",
        tests_passed: 0,
        tests_failed: 0,
        confidence: 0,
        evidence: [
          "Verification engine returned an error."
        ]
      });
    }

    return c.json(result);
  } catch (error) {
    console.error(error);

    c.status(500);

    return c.json({
      service: "Verdict404",
      task: "unknown",
      language: "unknown",
      verdict: "ERROR",
      tests_passed: 0,
      tests_failed: 0,
      confidence: 0,
      evidence: [
        "Gateway could not reach verification engine."
      ]
    });
  }
});

serve({
  fetch: app.fetch,
  port: 3000
});

console.log(
  "Verdict404 x402 gateway running on http://127.0.0.1:3000"
);
