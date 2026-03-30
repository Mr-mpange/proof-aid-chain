use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::UnorderedMap;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault};

/// Storage key for the document proofs map
#[derive(BorshStorageKey, BorshSerialize)]
enum StorageKey {
    DocumentProofs,
}

/// A single document proof stored on-chain
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct DocumentProof {
    /// SHA-256 hash of the document
    pub document_hash: String,
    /// Filecoin/IPFS Content Identifier
    pub filecoin_cid: String,
    /// Unix timestamp (milliseconds) when the proof was stored
    pub timestamp: u64,
    /// NEAR account that submitted this proof
    pub owner: AccountId,
    /// Block height at which the proof was stored
    pub block_height: u64,
}

/// Verification result returned to callers
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct VerificationResult {
    pub verified: bool,
    pub proof: Option<DocumentProof>,
}

/// ProofDoc AI Smart Contract
/// Stores and verifies document proofs on NEAR Protocol
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct ProofDocContract {
    /// Maps document_hash -> DocumentProof
    proofs: UnorderedMap<String, DocumentProof>,
    /// Total number of proofs stored
    total_proofs: u64,
}

#[near_bindgen]
impl ProofDocContract {
    /// Initialize the contract
    #[init]
    pub fn new() -> Self {
        Self {
            proofs: UnorderedMap::new(StorageKey::DocumentProofs),
            total_proofs: 0,
        }
    }

    /// Store a new document proof on-chain.
    /// Requires the caller to pay for storage (~0.01 NEAR per proof).
    ///
    /// # Arguments
    /// * `document_hash` - SHA-256 hash of the document
    /// * `filecoin_cid` - IPFS/Filecoin CID of the stored document
    ///
    /// # Panics
    /// If a proof with the same document_hash already exists.
    #[payable]
    pub fn store_proof(&mut self, document_hash: String, filecoin_cid: String) -> DocumentProof {
        // Validate inputs
        assert!(
            document_hash.len() == 64,
            "document_hash must be a 64-character hex SHA-256 hash"
        );
        assert!(
            !filecoin_cid.is_empty(),
            "filecoin_cid must not be empty"
        );

        // Check for duplicates
        assert!(
            self.proofs.get(&document_hash).is_none(),
            "A proof for this document already exists"
        );

        let proof = DocumentProof {
            document_hash: document_hash.clone(),
            filecoin_cid,
            timestamp: env::block_timestamp_ms(),
            owner: env::predecessor_account_id(),
            block_height: env::block_height(),
        };

        self.proofs.insert(&document_hash, &proof);
        self.total_proofs += 1;

        env::log_str(&format!(
            "ProofDoc: Stored proof for document {} by {}",
            document_hash,
            env::predecessor_account_id()
        ));

        proof
    }

    /// Verify a document by checking if its hash exists on-chain.
    ///
    /// # Arguments
    /// * `document_hash` - SHA-256 hash to verify
    ///
    /// # Returns
    /// `VerificationResult` with verified=true and the proof if found
    pub fn verify_document(&self, document_hash: String) -> VerificationResult {
        match self.proofs.get(&document_hash) {
            Some(proof) => VerificationResult {
                verified: true,
                proof: Some(proof),
            },
            None => VerificationResult {
                verified: false,
                proof: None,
            },
        }
    }

    /// Get a specific proof by document hash
    pub fn get_proof(&self, document_hash: String) -> Option<DocumentProof> {
        self.proofs.get(&document_hash)
    }

    /// Get the total number of proofs stored
    pub fn get_total_proofs(&self) -> u64 {
        self.total_proofs
    }

    /// Get recent proofs (last N entries)
    /// Note: UnorderedMap doesn't guarantee order, but this returns the last N inserted
    pub fn get_recent_proofs(&self, limit: u64) -> Vec<DocumentProof> {
        let total = self.proofs.len();
        let skip = if total > limit { total - limit } else { 0 };
        self.proofs
            .values()
            .skip(skip as usize)
            .take(limit as usize)
            .collect()
    }

    /// Get all proofs by a specific owner
    pub fn get_proofs_by_owner(&self, owner: AccountId) -> Vec<DocumentProof> {
        self.proofs
            .values()
            .filter(|p| p.owner == owner)
            .collect()
    }
}

// ===================== TESTS =====================

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn get_context(predecessor: &str) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor.parse().unwrap());
        builder.attached_deposit(near_sdk::NearToken::from_millinear(10).as_yoctonear());
        builder
    }

    #[test]
    fn test_store_and_verify() {
        let context = get_context("alice.testnet");
        testing_env!(context.build());

        let mut contract = ProofDocContract::new();

        let hash = "a".repeat(64);
        let cid = "bafy2bzaceexample123456789".to_string();

        let proof = contract.store_proof(hash.clone(), cid.clone());
        assert_eq!(proof.document_hash, hash);
        assert_eq!(proof.filecoin_cid, cid);
        assert_eq!(proof.owner.to_string(), "alice.testnet");

        let result = contract.verify_document(hash);
        assert!(result.verified);
        assert!(result.proof.is_some());

        assert_eq!(contract.get_total_proofs(), 1);
    }

    #[test]
    fn test_verify_nonexistent() {
        let context = get_context("alice.testnet");
        testing_env!(context.build());

        let contract = ProofDocContract::new();
        let result = contract.verify_document("b".repeat(64));
        assert!(!result.verified);
        assert!(result.proof.is_none());
    }

    #[test]
    #[should_panic(expected = "A proof for this document already exists")]
    fn test_duplicate_proof() {
        let context = get_context("alice.testnet");
        testing_env!(context.build());

        let mut contract = ProofDocContract::new();
        let hash = "c".repeat(64);

        contract.store_proof(hash.clone(), "cid1".to_string());
        contract.store_proof(hash, "cid2".to_string()); // Should panic
    }
}
