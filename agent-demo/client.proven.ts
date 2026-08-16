import fs from "fs";

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

const secretFile = fs.readFileSync(
  ".payer-secret.txt",
  "utf8"
);

const mnemonic =
  secretFile.match(/^MNEMONIC=(.+)$/m)?.[1]?.trim();

if (!mnemonic) {
  throw new Error(
    "MNEMONIC not found in .payer-secret.txt"
  );
}

const account =
  algosdk.mnemonicToSecretKey(mnemonic);

const privateKeyBase64 =
  Buffer.from(account.sk).toString("base64");

const signer =
  toClientAvmSigner(privateKeyBase64);

async function main() {
  console.log(
    "Verdict404 payer:",
    signer.address
  );

  const client = new x402Client();

  client.register(
    ALGORAND_TESTNET,
    new ExactAvmScheme(signer)
  );

  const fetchWithPayment =
    wrapFetchWithPayment(fetch, client);

  console.log(
    "Requesting paid verification..."
  );

  const response =
  await fetchWithPayment(
    "http://127.0.0.1:3000/verify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        task: "safe_divide",
        language: "python",
        code: `def divide(a, b):
    return a / b`
      })
    }
  );

  console.log(
    "HTTP:",
    response.status,
    response.statusText
  );

  const paymentResponse =
    new x402HTTPClient(
      client
    ).getPaymentSettleResponse(
      name => response.headers.get(name)
    );

  console.log("\nPayment settlement:");
  console.log(
    JSON.stringify(
      paymentResponse,
      null,
      2
    )
  );

  console.log("\nVerdict404 result:");

  console.log(
    JSON.stringify(
      await response.json(),
      null,
      2
    )
  );
}

main().catch(error => {
  console.error("CLIENT ERROR:");
  console.error(error);
  process.exit(1);
});