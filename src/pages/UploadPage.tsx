import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Hash,
  HardDrive,
  Link2,
  Lock,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetwork } from "@/context/NetworkContext";
import { computeSHA256 } from "@/services/hashing";
import { uploadToFilecoin } from "@/services/filecoin";
import { storeProofOnChain } from "@/services/near";
import { encryptDocument } from "@/services/lit";
import { uploadToLighthouse } from "@/services/filecoin-real";
import { storeProofOnNearMainnet } from "@/services/near-real";
import { encryptWithLit } from "@/services/lit-real";
import { analyzeDocument, type AIAnalysisResult } from "@/services/ai";
import { documentStore, type DocumentRecord } from "@/store/documentStore";
import { toast } from "sonner";

type Step = "idle" | "hashing" | "filecoin" | "blockchain" | "encryption" | "ai" | "done";

const steps: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "hashing", label: "Computing Hash", icon: Hash },
  { key: "filecoin", label: "Uploading to IPFS/Filecoin", icon: HardDrive },
  { key: "blockchain", label: "Storing Proof on NEAR", icon: Link2 },
  { key: "encryption", label: "Encrypting via Lit Protocol", icon: Lock },
  { key: "ai", label: "AI Analysis", icon: Brain },
];

export default function UploadPage() {
  const { config, isReal } = useNetwork();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<DocumentRecord | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(f.type)) {
      toast.error("Please upload a PDF or image file");
      return;
    }
    setFile(f);
    setResult(null);
    setStep("idle");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const processDocument = async () => {
    if (!file) return;

    // Validate testnet requirements
    if (isReal) {
      if (!config.lighthouseApiKey) {
        toast.error("Please configure Lighthouse API key in settings");
        return;
      }
      if (!config.nearAccountId) {
        toast.error("Please connect your NEAR wallet in settings");
        return;
      }
    }

    try {
      // Step 1: Hash
      setStep("hashing");
      const hash = await computeSHA256(file);

      const existing = documentStore.findByHash(hash);
      if (existing) {
        toast.info("This document is already registered!");
        setResult(existing);
        setStep("done");
        return;
      }

      // Step 2: Filecoin/IPFS
      setStep("filecoin");
      let filecoinResult;
      if (isReal) {
        const lhResult = await uploadToLighthouse(file, config.lighthouseApiKey);
        filecoinResult = {
          cid: lhResult.cid,
          size: lhResult.size,
          timestamp: lhResult.timestamp,
          network: lhResult.network,
          gatewayUrl: lhResult.gatewayUrl,
        };
      } else {
        const simResult = await uploadToFilecoin(file);
        filecoinResult = {
          cid: simResult.cid,
          size: simResult.size,
          timestamp: simResult.timestamp,
          network: simResult.network,
        };
      }

      // Step 3: Blockchain
      setStep("blockchain");
      let blockchainProof;
      if (isReal) {
        const nearResult = await storeProofOnNearMainnet(hash, filecoinResult.cid);
        blockchainProof = {
          transactionHash: nearResult.transactionHash,
          blockHeight: nearResult.blockHeight,
          timestamp: nearResult.timestamp,
          contractId: nearResult.contractId,
          documentHash: nearResult.documentHash,
          filecoinCid: nearResult.filecoinCid,
          explorerUrl: nearResult.explorerUrl,
        };
      } else {
        const simResult = await storeProofOnChain(hash, filecoinResult.cid);
        blockchainProof = {
          transactionHash: simResult.transactionHash,
          blockHeight: simResult.blockHeight,
          timestamp: simResult.timestamp,
          contractId: simResult.contractId,
          documentHash: simResult.documentHash,
          filecoinCid: simResult.filecoinCid,
        };
      }

      // Step 4: Lit Encryption
      setStep("encryption");
      const ownerAddress = isReal
        ? config.nearAccountId || "0x" + hash.slice(0, 40)
        : "0x" + hash.slice(0, 40);

      let encryptionResult;
      if (isReal) {
        const litResult = await encryptWithLit(hash, ownerAddress);
        encryptionResult = {
          encryptedDataHash: litResult.encryptedDataHash,
          accessControlConditions: JSON.stringify(litResult.accessControlConditions),
          owner: litResult.owner,
          isLocked: litResult.isLocked,
          network: litResult.network,
        };
      } else {
        const simResult = await encryptDocument(hash, ownerAddress);
        encryptionResult = {
          encryptedDataHash: simResult.encryptedDataHash,
          accessControlConditions: simResult.accessControlConditions,
          owner: simResult.owner,
          isLocked: simResult.isLocked,
        };
      }

      // Step 5: AI Analysis
      setStep("ai");
      const aiResult = await analyzeDocument(file);

      // Store record
      const record: DocumentRecord = {
        id: crypto.randomUUID(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hash,
        filecoin: {
          cid: filecoinResult.cid,
          size: filecoinResult.size,
          timestamp: filecoinResult.timestamp,
          network: filecoinResult.network,
        },
        blockchain: {
          transactionHash: blockchainProof.transactionHash,
          blockHeight: blockchainProof.blockHeight,
          timestamp: blockchainProof.timestamp,
          contractId: blockchainProof.contractId,
          documentHash: blockchainProof.documentHash,
          filecoinCid: blockchainProof.filecoinCid,
        },
        encryption: {
          encryptedDataHash: encryptionResult.encryptedDataHash,
          accessControlConditions: typeof encryptionResult.accessControlConditions === 'string'
            ? encryptionResult.accessControlConditions
            : JSON.stringify(encryptionResult.accessControlConditions),
          owner: encryptionResult.owner,
          isLocked: encryptionResult.isLocked,
        },
        aiAnalysis: aiResult,
        createdAt: Date.now(),
        mode: config.mode,
        explorerUrl: (blockchainProof as any).explorerUrl,
        gatewayUrl: (filecoinResult as any).gatewayUrl,
      };

      documentStore.add(record);
      setResult(record);
      setStep("done");
      toast.success(
        isReal
          ? "Document processed on testnet!"
          : "Document processed (simulated)!"
      );
    } catch (err: any) {
      toast.error(err.message || "An error occurred during processing");
      setStep("idle");
    }
  };

  const reset = () => {
    setFile(null);
    setStep("idle");
    setResult(null);
  };

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Upload Document</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a PDF or image to hash, store, encrypt, and analyze
          {isReal && (
            <span className="ml-1 text-primary font-medium">
              — using real testnet integrations
            </span>
          )}
        </p>
      </div>

      {/* Drop zone */}
      {step === "idle" && !result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5 glow-primary"
              : file
              ? "border-accent bg-accent/5"
              : "border-border hover:border-muted-foreground"
          }`}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf,.png,.jpg,.jpeg,.webp";
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFile(f);
            };
            input.click();
          }}
        >
          {file ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <FileText className="h-7 w-7 text-accent" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB • {file.type}
                </p>
              </div>
              <Button onClick={(e) => { e.stopPropagation(); processDocument(); }} className="mt-2">
                <Upload className="mr-2 h-4 w-4" />
                Process Document
              </Button>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Drop your document here</p>
                <p className="text-sm text-muted-foreground">PDF, PNG, JPG, or WebP</p>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Processing steps */}
      {step !== "idle" && step !== "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <p className="text-sm font-medium text-muted-foreground">Processing {file?.name}...</p>
          <div className="space-y-3">
            {steps.map((s, i) => {
              const isActive = s.key === step;
              const isDone = i < currentStepIndex;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                      isDone
                        ? "bg-accent/15 text-accent"
                        : isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <s.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isDone ? "text-accent" : isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                    {isActive && isReal && (
                      <span className="ml-1 text-xs text-primary/60">(testnet)</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && step === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Processing Complete
                {result.mode === "testnet" && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                    TESTNET
                  </span>
                )}
              </h3>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="mr-1 h-4 w-4" /> New Upload
              </Button>
            </div>

            <ResultCard icon={Hash} title="SHA-256 Hash" value={result.hash} mono />
            <ResultCard
              icon={HardDrive}
              title="Filecoin CID"
              value={result.filecoin.cid}
              mono
              extra={`Network: ${result.filecoin.network}`}
              link={result.gatewayUrl}
            />
            <ResultCard
              icon={Link2}
              title="NEAR Proof"
              value={result.blockchain.transactionHash}
              mono
              extra={`Block: ${result.blockchain.blockHeight} • Contract: ${result.blockchain.contractId}`}
              link={result.explorerUrl}
            />
            <ResultCard
              icon={Lock}
              title="Lit Encryption"
              value={result.encryption.isLocked ? "🔒 Encrypted & Locked" : "🔓 Unlocked"}
              extra={`Owner: ${result.encryption.owner.slice(0, 10)}...${result.encryption.owner.slice(-8)}`}
            />
            <AIResultCard result={result.aiAnalysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  title,
  value,
  mono,
  extra,
  link,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  mono?: boolean;
  extra?: string;
  link?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-primary hover:text-primary/80"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <p className={`text-sm text-foreground break-all ${mono ? "font-mono" : ""}`}>{value}</p>
      {extra && <p className="text-xs text-muted-foreground mt-1 font-mono">{extra}</p>}
    </div>
  );
}

function AIResultCard({ result }: { result: AIAnalysisResult }) {
  const isAuthentic = result.verdict === "authentic";
  return (
    <div
      className={`rounded-xl border p-4 ${
        isAuthentic ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Brain className={`h-4 w-4 ${isAuthentic ? "text-accent" : "text-destructive"}`} />
        <span className="text-sm font-medium text-muted-foreground">AI Analysis</span>
        <span
          className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isAuthentic ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
          }`}
        >
          {isAuthentic ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {isAuthentic ? "Authentic" : "Suspicious"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        Confidence: {(result.confidence * 100).toFixed(1)}% • {result.analysisTime}ms
      </p>
      <ul className="space-y-1">
        {result.findings.map((f, i) => (
          <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
            <span className={`mt-1 h-1 w-1 rounded-full shrink-0 ${isAuthentic ? "bg-accent" : "bg-destructive"}`} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
