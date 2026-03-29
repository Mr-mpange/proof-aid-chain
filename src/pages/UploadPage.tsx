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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeSHA256 } from "@/services/hashing";
import { uploadToFilecoin } from "@/services/filecoin";
import { storeProofOnChain } from "@/services/near";
import { encryptDocument } from "@/services/lit";
import { analyzeDocument, type AIAnalysisResult } from "@/services/ai";
import { documentStore, type DocumentRecord } from "@/store/documentStore";
import { toast } from "sonner";

type Step = "idle" | "hashing" | "filecoin" | "blockchain" | "encryption" | "ai" | "done";

const steps: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "hashing", label: "Computing Hash", icon: Hash },
  { key: "filecoin", label: "Uploading to Filecoin", icon: HardDrive },
  { key: "blockchain", label: "Storing Proof on NEAR", icon: Link2 },
  { key: "encryption", label: "Encrypting via Lit", icon: Lock },
  { key: "ai", label: "AI Analysis", icon: Brain },
];

export default function UploadPage() {
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

    try {
      // Step 1: Hash
      setStep("hashing");
      const hash = await computeSHA256(file);

      // Check duplicate
      const existing = documentStore.findByHash(hash);
      if (existing) {
        toast.info("This document is already registered!");
        setResult(existing);
        setStep("done");
        return;
      }

      // Step 2: Filecoin
      setStep("filecoin");
      const filecoinResult = await uploadToFilecoin(file);

      // Step 3: Blockchain
      setStep("blockchain");
      const blockchainProof = await storeProofOnChain(hash, filecoinResult.cid);

      // Step 4: Lit Encryption
      setStep("encryption");
      const ownerAddress = "0x" + hash.slice(0, 40);
      const encryptionResult = await encryptDocument(hash, ownerAddress);

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
        filecoin: filecoinResult,
        blockchain: blockchainProof,
        encryption: encryptionResult,
        aiAnalysis: aiResult,
        createdAt: Date.now(),
      };

      documentStore.add(record);
      setResult(record);
      setStep("done");
      toast.success("Document processed and stored successfully!");
    } catch (err) {
      toast.error("An error occurred during processing");
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
                <p className="font-medium text-foreground">
                  Drop your document here
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, PNG, JPG, or WebP
                </p>
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
              </h3>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="mr-1 h-4 w-4" /> New Upload
              </Button>
            </div>

            <ResultCard
              icon={Hash}
              title="SHA-256 Hash"
              color="primary"
              value={result.hash}
              mono
            />
            <ResultCard
              icon={HardDrive}
              title="Filecoin CID"
              color="primary"
              value={result.filecoin.cid}
              mono
              extra={`Network: ${result.filecoin.network}`}
            />
            <ResultCard
              icon={Link2}
              title="NEAR Proof"
              color="primary"
              value={result.blockchain.transactionHash}
              mono
              extra={`Block: ${result.blockchain.blockHeight} • Contract: ${result.blockchain.contractId}`}
            />
            <ResultCard
              icon={Lock}
              title="Lit Encryption"
              color="primary"
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
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  value: string;
  mono?: boolean;
  extra?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <p
        className={`text-sm text-foreground break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
      {extra && (
        <p className="text-xs text-muted-foreground mt-1 font-mono">{extra}</p>
      )}
    </div>
  );
}

function AIResultCard({ result }: { result: AIAnalysisResult }) {
  const isAuthentic = result.verdict === "authentic";
  return (
    <div
      className={`rounded-xl border p-4 ${
        isAuthentic
          ? "border-accent/30 bg-accent/5"
          : "border-destructive/30 bg-destructive/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Brain className={`h-4 w-4 ${isAuthentic ? "text-accent" : "text-destructive"}`} />
        <span className="text-sm font-medium text-muted-foreground">AI Analysis</span>
        <span
          className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isAuthentic
              ? "bg-accent/15 text-accent"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {isAuthentic ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
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
