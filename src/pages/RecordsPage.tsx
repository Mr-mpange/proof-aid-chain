import { motion } from "framer-motion";
import {
  Hash,
  HardDrive,
  Link2,
  Lock,
  Brain,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Unlock,
  Database,
  ExternalLink,
} from "lucide-react";
import { useDocumentRecords } from "@/hooks/useDocumentRecords";
import { Button } from "@/components/ui/button";
import { documentStore, type DocumentRecord } from "@/store/documentStore";
import { decryptDocument } from "@/services/lit";
import { useState } from "react";
import { toast } from "sonner";

export default function RecordsPage() {
  const records = useDocumentRecords();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Document Records</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {records.length} document{records.length !== 1 ? "s" : ""} registered on-chain
          </p>
        </div>
        {records.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              documentStore.clear();
              toast.success("All records cleared");
            }}
          >
            Clear All
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center"
        >
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="font-medium text-foreground">No records yet</p>
          <p className="text-sm text-muted-foreground">
            Upload a document to create your first verifiable record
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {records.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <RecordCard record={record} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecordCard({ record }: { record: DocumentRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const isAuthentic = record.aiAnalysis.verdict === "authentic";

  const handleDecrypt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await decryptDocument(
      record.encryption.encryptedDataHash,
      record.encryption.owner,
      record.encryption.owner
    );
    setAccessStatus(result.message);
    toast.success(result.message);
  };

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer transition-colors hover:border-primary/30"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{record.fileName}</p>
          <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {new Date(record.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {record.mode === "mainnet" && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary">
              TESTNET
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isAuthentic
                ? "bg-accent/15 text-accent"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {isAuthentic ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {isAuthentic ? "Authentic" : "Suspicious"}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-border p-4 space-y-3 bg-secondary/30"
        >
          <DetailRow icon={Hash} label="SHA-256" value={record.hash} mono />
          <DetailRow icon={HardDrive} label="Filecoin CID" value={record.filecoin.cid} mono />
          <DetailRow icon={Link2} label="NEAR Tx" value={record.blockchain.transactionHash} mono />
          <DetailRow
            icon={Lock}
            label="Lit Status"
            value={
              accessStatus
                ? `🔓 ${accessStatus}`
                : `🔒 Encrypted (Owner: ${record.encryption.owner.slice(0, 8)}...)`
            }
          />
          <DetailRow
            icon={Brain}
            label="AI Confidence"
            value={`${(record.aiAnalysis.confidence * 100).toFixed(1)}%`}
          />

          <div className="pt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleDecrypt}>
              <Unlock className="mr-1.5 h-3.5 w-3.5" />
              Decrypt Access
            </Button>
            {record.explorerUrl && (
              <a href={record.explorerUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  NEAR Explorer
                </Button>
              </a>
            )}
            {record.gatewayUrl && (
              <a href={record.gatewayUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  IPFS Gateway
                </Button>
              </a>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
      <span className="text-xs text-muted-foreground shrink-0 w-24">{label}</span>
      <span className={`text-xs text-foreground break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
