import { motion } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  HardDrive,
  Link2,
  Lock,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wifi,
  WifiOff,
  ArrowRight,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useDocumentRecords } from "@/hooks/useDocumentRecords";
import { useNetwork } from "@/context/NetworkContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const records = useDocumentRecords();
  const { config, isReal } = useNetwork();

  const totalDocs = records.length;
  const authenticDocs = records.filter((r) => r.aiAnalysis.verdict === "authentic").length;
  const suspiciousDocs = totalDocs - authenticDocs;
  const testnetDocs = records.filter((r) => r.mode === "testnet").length;
  const recentDocs = records.slice(0, 5);

  const integrations = [
    {
      name: "NEAR Protocol",
      icon: Link2,
      status: isReal && config.nearAccountId ? "connected" : isReal ? "not configured" : "simulated",
      detail: config.nearAccountId || "Testnet",
      color: "primary" as const,
    },
    {
      name: "Filecoin / IPFS",
      icon: HardDrive,
      status: isReal && config.lighthouseApiKey ? "connected" : isReal ? "not configured" : "simulated",
      detail: config.lighthouseApiKey ? "Lighthouse" : "Mock storage",
      color: "primary" as const,
    },
    {
      name: "Lit Protocol",
      icon: Lock,
      status: isReal ? "connected" : "simulated",
      detail: isReal ? "Web Crypto AES-256" : "Simulated",
      color: "primary" as const,
    },
    {
      name: "AI Analysis",
      icon: Brain,
      status: "active",
      detail: "Document integrity engine",
      color: "accent" as const,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ProofDoc AI — Verifiable Document Trust Platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isReal ? (
              <Wifi className="h-4 w-4 text-primary" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={`text-sm font-medium ${isReal ? "text-primary" : "text-muted-foreground"}`}>
              {isReal ? "Testnet Active" : "Simulated Mode"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Documents"
          value={totalDocs}
          icon={FileText}
          delay={0}
        />
        <StatCard
          label="Verified Authentic"
          value={authenticDocs}
          icon={CheckCircle2}
          accent="accent"
          delay={0.05}
        />
        <StatCard
          label="Flagged Suspicious"
          value={suspiciousDocs}
          icon={AlertTriangle}
          accent="destructive"
          delay={0.1}
        />
        <StatCard
          label="On Testnet"
          value={testnetDocs}
          icon={Activity}
          accent="primary"
          delay={0.15}
        />
      </div>

      {/* Integration Status */}
      <motion.div {...fadeUp} transition={{ delay: 0.2, duration: 0.4 }}>
        <h3 className="text-lg font-semibold text-foreground mb-4">Integration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {integrations.map((int, i) => (
            <motion.div
              key={int.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-${int.color}/10`}>
                <int.icon className={`h-5 w-5 text-${int.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{int.name}</p>
                <p className="text-xs text-muted-foreground truncate">{int.detail}</p>
              </div>
              <StatusBadge status={int.status} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Documents + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Docs */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="md:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Documents</h3>
            {records.length > 0 && (
              <Link to="/records">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>

          {recentDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">No documents yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first document to get started
              </p>
              <Link to="/upload">
                <Button size="sm">Upload Document</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDocs.map((doc, i) => {
                const isAuth = doc.aiAnalysis.verdict === "authentic";
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.04 }}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                        {doc.mode === "testnet" && (
                          <span className="ml-1 text-primary">• testnet</span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isAuth ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {isAuth ? "✓" : "!"}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...fadeUp} transition={{ delay: 0.35, duration: 0.4 }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/upload" className="block">
              <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:glow-primary transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload & Prove</p>
                    <p className="text-[10px] text-muted-foreground">Hash, store, encrypt, analyze</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/verify" className="block">
              <div className="rounded-xl border border-border bg-card p-4 hover:border-accent/30 hover:glow-accent transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Verify Document</p>
                    <p className="text-[10px] text-muted-foreground">Compare against blockchain proofs</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/records" className="block">
              <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary group-hover:bg-secondary/80 transition-colors">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">View Records</p>
                    <p className="text-[10px] text-muted-foreground">Browse all stored proofs</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Network Info */}
          <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Network Info
            </p>
            <InfoRow label="Mode" value={isReal ? "Testnet" : "Simulated"} />
            <InfoRow label="NEAR" value={config.nearAccountId || "Not connected"} />
            <InfoRow label="IPFS" value={config.lighthouseApiKey ? "Lighthouse" : "Not configured"} />
            <InfoRow label="Encryption" value="AES-256-GCM" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: string;
  delay?: number;
}) {
  const colorClass = accent || "foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-4 w-4 text-${colorClass}`} />
      </div>
      <p className={`text-2xl font-bold text-${colorClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    connected: "bg-accent/15 text-accent",
    active: "bg-accent/15 text-accent",
    simulated: "bg-secondary text-muted-foreground",
    "not configured": "bg-destructive/10 text-destructive",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${styles[status] || styles.simulated}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "connected" || status === "active" ? "bg-accent animate-pulse-glow" : status === "not configured" ? "bg-destructive" : "bg-muted-foreground"}`} />
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-mono truncate max-w-[140px]">{value}</span>
    </div>
  );
}
