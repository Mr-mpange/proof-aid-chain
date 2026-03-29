import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeSHA256 } from "@/services/hashing";
import { documentStore } from "@/store/documentStore";

type Status = "idle" | "processing" | "verified" | "tampered";

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [hash, setHash] = useState("");
  const [matchedName, setMatchedName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setStatus("idle");
    setHash("");
    setMatchedName("");
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

  const verify = async () => {
    if (!file) return;
    setStatus("processing");

    const computedHash = await computeSHA256(file);
    setHash(computedHash);

    // Simulate verification delay
    await new Promise((r) => setTimeout(r, 1200));

    const record = documentStore.findByHash(computedHash);
    if (record) {
      setMatchedName(record.fileName);
      setStatus("verified");
    } else {
      setStatus("tampered");
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setHash("");
    setMatchedName("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Verify Document</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a document to verify it against stored blockchain proofs
        </p>
      </div>

      {(status === "idle" || status === "processing") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
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
          className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5 glow-primary"
              : file
              ? "border-accent bg-accent/5"
              : "border-border hover:border-muted-foreground"
          }`}
        >
          {file ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <FileText className="h-7 w-7 text-accent" />
              </div>
              <p className="font-medium text-foreground">{file.name}</p>
              <Button
                onClick={(e) => { e.stopPropagation(); verify(); }}
                disabled={status === "processing"}
              >
                {status === "processing" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                {status === "processing" ? "Verifying..." : "Verify Document"}
              </Button>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium text-foreground">Drop document to verify</p>
              <p className="text-sm text-muted-foreground">PDF, PNG, JPG, or WebP</p>
            </>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {(status === "verified" || status === "tampered") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div
              className={`rounded-2xl border-2 p-8 text-center ${
                status === "verified"
                  ? "border-accent/40 bg-accent/5 glow-accent"
                  : "border-destructive/40 bg-destructive/5"
              }`}
            >
              {status === "verified" ? (
                <CheckCircle2 className="h-16 w-16 text-accent mx-auto mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              )}
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {status === "verified" ? "✅ Verified" : "❌ Not Verified"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {status === "verified"
                  ? `This document matches the record for "${matchedName}"`
                  : "No matching record found — this document may have been tampered with"}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Computed Hash</span>
              </div>
              <p className="text-sm text-foreground font-mono break-all">{hash}</p>
            </div>

            <div className="text-center">
              <Button variant="outline" onClick={reset}>
                Verify Another
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
