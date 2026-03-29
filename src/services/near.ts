/**
 * Simulated NEAR Protocol integration.
 * In production, this would use near-api-js to interact with a smart contract.
 */

function generateTxHash(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let hash = "";
  for (let i = 0; i < 44; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export interface BlockchainProof {
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
  contractId: string;
  documentHash: string;
  filecoinCid: string;
}

export async function storeProofOnChain(
  documentHash: string,
  filecoinCid: string
): Promise<BlockchainProof> {
  // Simulate blockchain transaction delay
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

  return {
    transactionHash: generateTxHash(),
    blockHeight: 100000000 + Math.floor(Math.random() * 10000000),
    timestamp: Date.now(),
    contractId: "proofdoc.testnet",
    documentHash,
    filecoinCid,
  };
}

export async function verifyOnChain(
  documentHash: string
): Promise<{ verified: boolean; proof?: BlockchainProof }> {
  await new Promise((r) => setTimeout(r, 800));
  // Verification is handled by the document store
  return { verified: false };
}
