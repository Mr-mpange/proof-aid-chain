# ProofDoc AI — NEAR Smart Contract

## Overview

This is the NEAR Protocol smart contract for ProofDoc AI. It stores document proofs on-chain with:

- **Document hash** (SHA-256)
- **Filecoin CID** (IPFS content identifier)  
- **Timestamp** (block timestamp)
- **Owner** (NEAR account that submitted the proof)

## Contract Methods

### Write Methods (require signing)

| Method | Description | Parameters |
|--------|-------------|------------|
| `store_proof` | Store a new document proof | `document_hash: String, filecoin_cid: String` |

### View Methods (free, no signing)

| Method | Description | Parameters |
|--------|-------------|------------|
| `verify_document` | Check if a document hash exists | `document_hash: String` |
| `get_proof` | Get proof by hash | `document_hash: String` |
| `get_total_proofs` | Get total proof count | — |
| `get_recent_proofs` | Get last N proofs | `limit: u64` |
| `get_proofs_by_owner` | Get proofs by account | `owner: AccountId` |

## Setup & Deployment

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install NEAR CLI
npm install -g near-cli

# Login to NEAR testnet
near login
```

### Create a testnet account

Visit [MyNearWallet Testnet](https://testnet.mynearwallet.com) to create an account.

### Deploy

```bash
chmod +x deploy.sh
./deploy.sh YOUR_ACCOUNT.testnet
```

### Manual deployment

```bash
# Build
cargo build --target wasm32-unknown-unknown --release

# Deploy
near deploy --accountId YOUR_ACCOUNT.testnet \
  --wasmFile target/wasm32-unknown-unknown/release/proofdoc_contract.wasm

# Initialize
near call YOUR_ACCOUNT.testnet new '{}' --accountId YOUR_ACCOUNT.testnet
```

## Usage Examples

```bash
# Store a proof (costs ~0.01 NEAR for storage)
near call proofdoc.testnet store_proof \
  '{"document_hash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","filecoin_cid":"bafy2bzaceexample"}' \
  --accountId YOUR_ACCOUNT.testnet \
  --deposit 0.01

# Verify a document
near view proofdoc.testnet verify_document \
  '{"document_hash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}'

# Get total count
near view proofdoc.testnet get_total_proofs '{}'

# Get recent proofs
near view proofdoc.testnet get_recent_proofs '{"limit": 10}'
```

## Updating the Frontend

To use your deployed contract instead of the demo contract, update `PROOF_CONTRACT` in `src/services/near-real.ts`:

```typescript
const PROOF_CONTRACT = "YOUR_ACCOUNT.testnet";
```

And update the `functionCall` to use `store_proof`:

```typescript
const result = await account.functionCall({
  contractId: PROOF_CONTRACT,
  methodName: "store_proof",
  args: { document_hash: hash, filecoin_cid: cid },
  gas: BigInt("30000000000000"),
  attachedDeposit: BigInt("10000000000000000000000"), // 0.01 NEAR
});
```
