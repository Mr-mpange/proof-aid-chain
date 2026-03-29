/**
 * Simulated Lit Protocol integration.
 * In production, this would use @lit-protocol/sdk for encryption/decryption.
 */

export interface EncryptionResult {
  encryptedDataHash: string;
  accessControlConditions: string;
  owner: string;
  isLocked: boolean;
}

function generateEncryptedHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export async function encryptDocument(
  documentHash: string,
  ownerAddress: string
): Promise<EncryptionResult> {
  await new Promise((r) => setTimeout(r, 800));

  return {
    encryptedDataHash: generateEncryptedHash(),
    accessControlConditions: JSON.stringify({
      conditionType: "evmBasic",
      chain: "ethereum",
      method: "ownerOf",
      parameters: [ownerAddress],
      returnValueTest: { comparator: "=", value: ownerAddress },
    }),
    owner: ownerAddress,
    isLocked: true,
  };
}

export async function decryptDocument(
  encryptedDataHash: string,
  requestorAddress: string,
  ownerAddress: string
): Promise<{ decrypted: boolean; message: string }> {
  await new Promise((r) => setTimeout(r, 600));

  if (requestorAddress === ownerAddress) {
    return { decrypted: true, message: "Access granted — ownership verified" };
  }
  return { decrypted: false, message: "Access denied — not the document owner" };
}
