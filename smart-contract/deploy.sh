#!/bin/bash
# =========================================================
# ProofDoc AI — NEAR Smart Contract Deployment Script
# =========================================================
#
# This script builds and deploys the ProofDoc contract
# to NEAR testnet.
#
# Prerequisites:
#   1. Install Rust: https://rustup.rs/
#   2. Add WASM target: rustup target add wasm32-unknown-unknown
#   3. Install NEAR CLI: npm install -g near-cli
#   4. Login to NEAR: near login
#
# Usage:
#   ./deploy.sh <account-id>
#
# Example:
#   ./deploy.sh proofdoc.testnet
#
# To create a testnet account:
#   near create-account proofdoc.YOUR_ACCOUNT.testnet \
#     --masterAccount YOUR_ACCOUNT.testnet \
#     --initialBalance 10
# =========================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ProofDoc AI — Contract Deployment  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"

# Check for account ID argument
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a NEAR testnet account ID${NC}"
    echo ""
    echo "Usage: ./deploy.sh <account-id>"
    echo "Example: ./deploy.sh proofdoc.testnet"
    echo ""
    echo "To create a new testnet account:"
    echo "  1. Visit https://testnet.mynearwallet.com"
    echo "  2. Create account"
    echo "  3. Run: near login"
    exit 1
fi

CONTRACT_ACCOUNT=$1

# Check prerequisites
echo -e "\n${YELLOW}[1/5] Checking prerequisites...${NC}"

if ! command -v rustup &> /dev/null; then
    echo -e "${RED}Rust is not installed. Install from https://rustup.rs/${NC}"
    exit 1
fi
echo "  ✓ Rust installed"

if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "  → Adding wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi
echo "  ✓ WASM target ready"

if ! command -v near &> /dev/null; then
    echo -e "${RED}NEAR CLI not installed. Run: npm install -g near-cli${NC}"
    exit 1
fi
echo "  ✓ NEAR CLI installed"

# Build the contract
echo -e "\n${YELLOW}[2/5] Building smart contract...${NC}"
cd "$(dirname "$0")"
cargo build --target wasm32-unknown-unknown --release

# Find the WASM file
WASM_FILE="target/wasm32-unknown-unknown/release/proofdoc_contract.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo -e "${RED}Build failed: WASM file not found${NC}"
    exit 1
fi

WASM_SIZE=$(wc -c < "$WASM_FILE")
echo "  ✓ Contract built (${WASM_SIZE} bytes)"

# Deploy the contract
echo -e "\n${YELLOW}[3/5] Deploying to NEAR testnet...${NC}"
echo "  Account: $CONTRACT_ACCOUNT"
echo "  Network: testnet"

near deploy \
    --accountId "$CONTRACT_ACCOUNT" \
    --wasmFile "$WASM_FILE" \
    --networkId testnet

echo "  ✓ Contract deployed"

# Initialize the contract
echo -e "\n${YELLOW}[4/5] Initializing contract...${NC}"
near call "$CONTRACT_ACCOUNT" new '{}' \
    --accountId "$CONTRACT_ACCOUNT" \
    --networkId testnet \
    || echo "  (Contract may already be initialized)"

echo "  ✓ Contract initialized"

# Verify deployment
echo -e "\n${YELLOW}[5/5] Verifying deployment...${NC}"
near view "$CONTRACT_ACCOUNT" get_total_proofs '{}' --networkId testnet

echo -e "\n${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Deployment Successful! 🚀       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "Contract: ${GREEN}$CONTRACT_ACCOUNT${NC}"
echo -e "Explorer: ${GREEN}https://testnet.nearblocks.io/address/$CONTRACT_ACCOUNT${NC}"
echo ""
echo "Test commands:"
echo "  # Store a proof:"
echo "  near call $CONTRACT_ACCOUNT store_proof \\"
echo "    '{\"document_hash\":\"a]...64chars...\",\"filecoin_cid\":\"bafy2bzace...\"}' \\"
echo "    --accountId YOUR_ACCOUNT.testnet --deposit 0.01"
echo ""
echo "  # Verify a document:"
echo "  near view $CONTRACT_ACCOUNT verify_document \\"
echo "    '{\"document_hash\":\"a...64chars...\"}'"
echo ""
echo "  # Get total proofs:"
echo "  near view $CONTRACT_ACCOUNT get_total_proofs '{}'"
