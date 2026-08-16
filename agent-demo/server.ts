import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

import {
  x402Client,
  wrapFetchWithPayment,
  x402HTTPClient
} from "@x402/fetch";

import {
  toClientAvmSigner,
  ExactAvmScheme
} from "@x402/avm";

import algosdk from "algosdk";

const ALGORAND_TESTNET =
  "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";

const GATEWAY_URL =
  process.env.GATEWAY_URL ||
  "http://127.0.0.1:3000/verify";

const PORT = Number(
  process.env.AGENT_SERVER_PORT || 3100
);

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const secretPath =
  path.join(__dirname, ".payer-secret.txt");

if (!fs.existsSync(secretPath)) {
  throw new Error(
    `Payer secret file not found at ${secretPath}`
  );
}

const secretFile =
  fs.readFileSync(secretPath, "utf8");

const mnemonic =
  secretFile
    .match(/^MNEMONIC=(.+)$/m)?.[1]
    ?.trim();

if (!mnemonic) {
  throw new Error(
    "MNEMONIC not found in .payer-secret.txt"
  );
}

const account =
  algosdk.mnemonicToSecretKey(mnemonic);

const privateKeyBase64 =
  Buffer
    .from(account.sk)
    .toString("base64");

const signer =
  toClientAvmSigner(privateKeyBase64);

const client =
  new x402Client();

client.register(
  ALGORAND_TESTNET,
  new ExactAvmScheme(signer)
);

const fetchWithPayment =
  wrapFetchWithPayment(fetch, client);

const paymentHttpClient =
  new x402HTTPClient(client);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":
      "http://localhost:5173",

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type"
  };
}

function sendJson(
  response: http.ServerResponse,
  status: number,
  body: unknown
) {
  response.writeHead(
    status,
    {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  );

  response.end(
    JSON.stringify(body)
  );
}

async function readJsonBody(
  request: http.IncomingMessage
): Promise<unknown> {
  return new Promise(
    (resolve, reject) => {
      let data = "";

      request.on(
        "data",
        chunk => {
          data += chunk;

          if (data.length > 1_000_000) {
            reject(
              new Error(
                "Request body too large"
              )
            );

            request.destroy();
          }
        }
      );

      request.on(
        "end",
        () => {
          try {
            resolve(
              JSON.parse(data || "{}")
            );
          } catch {
            reject(
              new Error(
                "Request body must be valid JSON"
              )
            );
          }
        }
      );

      request.on(
        "error",
        reject
      );
    }
  );
}

const server =
  http.createServer(
    async (request, response) => {
      if (
        request.method === "OPTIONS"
      ) {
        response.writeHead(
          204,
          corsHeaders()
        );

        response.end();
        return;
      }

      if (
        request.method === "GET" &&
        request.url === "/"
      ) {
        sendJson(
          response,
          200,
          {
            service:
              "Verdict404 Paying Agent",
            status: "running",
            version: "0.1",
            payer: signer.address,
            gateway: GATEWAY_URL,
            network:
              "Algorand TestNet"
          }
        );

        return;
      }

      if (
        request.method !== "POST" ||
        request.url !== "/verify"
      ) {
        sendJson(
          response,
          404,
          {
            error: "Not found"
          }
        );

        return;
      }

      try {
        const body =
          await readJsonBody(request);

        console.log(
          "\nVerification requested."
        );

        console.log(
          "Payer:",
          signer.address
        );

        const paidResponse =
          await fetchWithPayment(
            GATEWAY_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(body)
            }
          );

        console.log(
  "Gateway HTTP:",
  paidResponse.status,
  paidResponse.statusText
);

console.log(
  "Gateway response headers:",
  Object.fromEntries(
    paidResponse.headers.entries()
  )
);

let payment: unknown = null;

try {
  payment =
    paymentHttpClient
      .getPaymentSettleResponse(
        name =>
          paidResponse.headers.get(
            name
          )
      );
} catch (error) {
  console.warn(
    "Settlement header could not be parsed:",
    error instanceof Error
      ? error.message
      : error
  );
}

let result: unknown;

        try {
          result =
            await paidResponse.json();
        } catch {
          result = {
            verdict: "ERROR",
            evidence: [
              "Gateway returned a non-JSON response."
            ]
          };
        }

        console.log(
          "Settlement:",
          payment
        );

        sendJson(
          response,
          paidResponse.ok ? 200 : 502,
          {
            payment,
            result
          }
        );
      } catch (error) {
        console.error(
          "AGENT SERVER ERROR:",
          error
        );

        sendJson(
          response,
          500,
          {
            payment: null,

            result: {
              service: "Verdict404",
              verdict: "ERROR",
              tests_passed: 0,
              tests_failed: 0,
              confidence: 0,
              evidence: [
                error instanceof Error
                  ? error.message
                  : "Unknown paying-agent error"
              ]
            }
          }
        );
      }
    }
  );

server.listen(
  PORT,
  "127.0.0.1",
  () => {
    console.log(
      `Verdict404 paying agent running on http://127.0.0.1:${PORT}`
    );

    console.log(
      "Payer:",
      signer.address
    );

    console.log(
      "Gateway:",
      GATEWAY_URL
    );
  }
);