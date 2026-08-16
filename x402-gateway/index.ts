import { config } from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
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
  process.env.VERIFY_SERVICE_URL || "http://127.0.0.1:8000";

if (!avmAddress || !facilitatorUrl) {
  console.error(
    "Missing environment variables: AVM_ADDRESS or FACILITATOR_URL"
  );
  process.exit(1);
}

const facilitatorClient = new HTTPFacilitatorClient({
  url: facilitatorUrl
});

const resourceServer = new x402ResourceServer(facilitatorClient);

resourceServer.register(
  ALGORAND_TESTNET_CAIP2,
  new ExactAvmScheme()
);

const app = new Hono();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-402-Payment", "Payment-Signature", "Payment-Required", "*"],
  exposeHeaders: ["*"]
}));

app.get("/", (c) => {
  return c.json({
    service: "Verdict404 x402 Gateway",
    status: "running",
    version: "0.2",
    payment: "x402 enabled",
    network: "Algorand TestNet",
    verification_endpoint: "/verify"
  });
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
        description: "Independent code verification by Verdict404",
        mimeType: "application/json"
      }
    },
    resourceServer
  )
);

app.post("/verify", async (c) => {
  try {
    const body = await c.req.json();

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

    return c.json(result);
  } catch (error) {
    console.error(error);

    return c.json(
      {
        verdict: "ERROR",
        evidence: "Gateway could not reach verifier"
      },
      500
    );
  }
});

serve({
  fetch: app.fetch,
  port: 3000
});

console.log(
  "Verdict404 x402 gateway running on http://127.0.0.1:3000"
);