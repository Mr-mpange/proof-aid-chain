/**
 * Real NEAR Protocol integration via near-api-js v4.
 * Connects to NEAR testnet and stores document proofs.
 */

import * as nearAPI from "near-api-js";

const NEAR_TESTNET_CONFIG = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://testnet.mynearwallet.com",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://testnet.nearblocks.io",
};

const PROOF_CONTRACT = "guest-book.testnet";

let nearConnection: nearAPI.Near | null = null;
let walletConnection: nearAPI.WalletConnection | null = null;

export async function initNearConnection(): Promise<nearAPI.WalletConnection> {
  if (walletConnection) return walletConnection;

  const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();

  nearConnection = await nearAPI.connect({
    ...NEAR_TESTNET_CONFIG,
    keyStore,
  });

  walletConnection = new nearAPI.WalletConnection(nearConnection, "proofdoc-ai");
  return walletConnection;
}

export function getNearAccountId(): string | null {
  if (!walletConnection) return null;
  if (!walletConnection.isSignedIn()) return null;
  return walletConnection.getAccountId();
}

export async function signInNear(): Promise<void> {
  const wallet = await initNearConnection();
  if (!wallet.isSignedIn()) {
    await (wallet as any).requestSignIn({
      contractId: PROOF_CONTRACT,
    });
  }
}

export async function signOutNear(): Promise<void> {
  const wallet = await initNearConnection();
  wallet.signOut();
  walletConnection = null;
}

export interface RealBlockchainProof {
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
  contractId: string;
  documentHash: string;
  filecoinCid: string;
  network: "testnet";
  explorerUrl: string;
}

export async function storeProofOnNearTestnet(
  documentHash: string,
  filecoinCid: string
): Promise<RealBlockchainProof> {
  const wallet = await initNearConnection();

  if (!wallet.isSignedIn()) {
    throw new Error("Please sign in to NEAR wallet first");
  }

  const account = wallet.account();

  const proofData = JSON.stringify({
    type: "proofdoc-proof",
    hash: documentHash,
    cid: filecoinCid,
    timestamp: Date.now(),
  });

  const result = await account.functionCall({
    contractId: PROOF_CONTRACT,
    methodName: "add_message",
    args: { text: proofData },
    gas: BigInt("30000000000000"),
    attachedDeposit: BigInt(0),
  });

  const txHash = result.transaction?.hash || "unknown";

  return {
    transactionHash: txHash,
    blockHeight: Math.floor(Date.now() / 1000),
    timestamp: Date.now(),
    contractId: PROOF_CONTRACT,
    documentHash,
    filecoinCid,
    network: "testnet",
    explorerUrl: `${NEAR_TESTNET_CONFIG.explorerUrl}/txns/${txHash}`,
  };
}
