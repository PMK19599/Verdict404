import fs from "fs";
import algosdk from "algosdk";

const secret = fs.readFileSync(".payer-secret.txt", "utf8");

const address = secret
  .match(/^ADDRESS=(.+)$/m)?.[1]
  ?.trim();

const mnemonic = secret
  .match(/^MNEMONIC=(.+)$/m)?.[1]
  ?.trim();

if (!address || !mnemonic) {
  throw new Error("Missing ADDRESS or MNEMONIC in .payer-secret.txt");
}

const account = algosdk.mnemonicToSecretKey(mnemonic);

const algod = new algosdk.Algodv2(
  "",
  "https://testnet-api.algonode.cloud",
  ""
);

const suggestedParams =
  await algod.getTransactionParams().do();

const txn =
  algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: address,
    receiver: address,
    amount: 0,
    assetIndex: 10458941,
    suggestedParams
  });

const signedTxn = txn.signTxn(account.sk);

const result =
  await algod.sendRawTransaction(signedTxn).do();

console.log("USDC opt-in submitted");
console.log("TXID:", result.txid);