import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import algosdk from "algosdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const payerSecretPath = path.join(__dirname, ".payer-secret.txt");
const gatewayDir = path.join(__dirname, "..", "x402-gateway");
const receiverSecretPath = path.join(gatewayDir, ".receiver-secret.txt");
const gatewayEnvPath = path.join(gatewayDir, ".env");

const USDC_ASSET_ID = 10458941;
const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
const FACILITATOR_URL = "https://facilitator.goplausible.xyz";
const VERIFY_SERVICE_URL = "http://127.0.0.1:8000";

const algod = new algosdk.Algodv2("", ALGOD_SERVER, "");

function getOrCreateAccount(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const address = content.match(/^ADDRESS=(.+)$/m)?.[1]?.trim();
    const mnemonic = content.match(/^MNEMONIC=(.+)$/m)?.[1]?.trim();
    if (address && mnemonic) {
      const account = algosdk.mnemonicToSecretKey(mnemonic);
      return { address, mnemonic, account, isNew: false };
    }
  }
  const account = algosdk.generateAccount();
  const address = account.addr.toString();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  const content = `ADDRESS=${address}\nMNEMONIC=${mnemonic}\n`;
  fs.writeFileSync(filePath, content, { mode: 0o600 });
  return { address, mnemonic, account, isNew: true };
}

async function getAccountInfo(address) {
  try {
    const info = await algod.accountInformation(address).do();
const algoMicro = Number(info.amount || 0);
const algo = (algoMicro / 1e6).toFixed(4);
    
    let usdcOptedIn = false;
    let usdcAmount = 0;
    
    const assets = info.assets || [];
    for (const a of assets) {
      const assetId = typeof a.assetId === "bigint" ? Number(a.assetId) : (a["asset-id"] || a.assetId);
      if (assetId === USDC_ASSET_ID) {
        usdcOptedIn = true;
        const amount = typeof a.amount === "bigint" ? Number(a.amount) : a.amount;
        usdcAmount = (amount / 1e6).toFixed(2);
        break;
      }
    }
    return { algo, algoMicro, usdcOptedIn, usdcAmount, raw: info };
  } catch (err) {
    if (err?.message?.includes("404") || err?.status === 404) {
      return { algo: "0.0000", algoMicro: 0, usdcOptedIn: false, usdcAmount: "0.00", unfunded: true };
    }
    throw err;
  }
}

async function optInAsset(account, address) {
  try {
    const suggestedParams = await algod.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: address,
      receiver: address,
      amount: 0,
      assetIndex: USDC_ASSET_ID,
      suggestedParams,
    });
    const signedTxn = txn.signTxn(account.sk);
    const res = await algod.sendRawTransaction(signedTxn).do();
    console.log(`[OPT-IN] Opted into USDC (Asset ID ${USDC_ASSET_ID}) - TxID: ${res.txid}`);
    await algosdk.waitForConfirmation(algod, res.txid, 4);
    return true;
  } catch (err) {
    console.error(`[OPT-IN FAILED] ${err?.message || err}`);
    return false;
  }
}

async function main() {
  console.log("=== Verdict404 Account Setup & Balance Check ===");

  const payer = getOrCreateAccount(payerSecretPath);
  console.log(`Payer Account:    ${payer.address} (${payer.isNew ? "Generated" : "Existing"})`);

  const receiver = getOrCreateAccount(receiverSecretPath);
  console.log(`Receiver Account: ${receiver.address} (${receiver.isNew ? "Generated" : "Existing"})`);

  // Write / Update x402-gateway/.env
  const envContent = `# Verdict404 x402 Gateway Configuration
AVM_ADDRESS=${receiver.address}
FACILITATOR_URL=${FACILITATOR_URL}
VERIFY_SERVICE_URL=${VERIFY_SERVICE_URL}
`;
  fs.writeFileSync(gatewayEnvPath, envContent);
  console.log(`Updated x402-gateway/.env with AVM_ADDRESS=${receiver.address}`);

  console.log("\nChecking Algorand TestNet Status...");
  const payerInfo = await getAccountInfo(payer.address);
  console.log(`Payer Balance:    ${payerInfo.algo} ALGO | ${payerInfo.usdcAmount} USDC | Opted into USDC: ${payerInfo.usdcOptedIn}`);

  const receiverInfo = await getAccountInfo(receiver.address);
  console.log(`Receiver Balance: ${receiverInfo.algo} ALGO | ${receiverInfo.usdcAmount} USDC | Opted into USDC: ${receiverInfo.usdcOptedIn}`);

  // Try auto opt-in if funded with ALGO but not opted in
  if (payerInfo.algoMicro >= 200000 && !payerInfo.usdcOptedIn) {
    console.log("Payer has ALGO, opting in to USDC...");
    await optInAsset(payer.account, payer.address);
  }
  if (receiverInfo.algoMicro >= 200000 && !receiverInfo.usdcOptedIn) {
    console.log("Receiver has ALGO, opting in to USDC...");
    await optInAsset(receiver.account, receiver.address);
  }
}

main().catch(console.error);
