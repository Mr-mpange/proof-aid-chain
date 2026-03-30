import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Wifi,
  WifiOff,
  Key,
  Wallet,
  Loader2,
  ExternalLink,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNetwork } from "@/context/NetworkContext";
import {
  initNearConnection,
  signInNear,
  signOutNear,
  getNearAccountId,
} from "@/services/near-real";
import { toast } from "sonner";

export default function SettingsPanel() {
  const { config, setMode, setNearAccountId, setLighthouseApiKey } = useNetwork();
  const [open, setOpen] = useState(false);
  const [nearLoading, setNearLoading] = useState(false);
  const [lhKey, setLhKey] = useState(config.lighthouseApiKey);

  const handleToggleMode = () => {
    const newMode = config.mode === "simulated" ? "mainnet" : "simulated";
    setMode(newMode);
    toast.success(`Switched to ${newMode} mode`);
  };

  const handleNearConnect = async () => {
    setNearLoading(true);
    try {
      const wallet = await initNearConnection();
      if (wallet.isSignedIn()) {
        const id = getNearAccountId();
        setNearAccountId(id);
        toast.success(`Connected as ${id}`);
      } else {
        await signInNear();
        // Will redirect — state saved after redirect
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to connect NEAR wallet");
    } finally {
      setNearLoading(false);
    }
  };

  const handleNearDisconnect = async () => {
    await signOutNear();
    setNearAccountId(null);
    toast.success("Disconnected from NEAR");
  };

  const handleSaveLighthouse = () => {
    setLighthouseApiKey(lhKey);
    toast.success("Lighthouse API key saved");
  };

  // Check NEAR connection on open
  const checkNear = async () => {
    try {
      await initNearConnection();
      const id = getNearAccountId();
      if (id) setNearAccountId(id);
    } catch {}
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) checkNear();
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="text-muted-foreground hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-xl z-50 space-y-4"
          >
            <h3 className="text-sm font-semibold text-foreground">Network Settings</h3>

            {/* Mode Toggle */}
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                {config.mode === "mainnet" ? (
                  <Wifi className="h-4 w-4 text-accent" />
                ) : (
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {config.mode === "mainnet" ? "Mainnet" : "Simulated"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {config.mode === "mainnet"
                      ? "Real blockchain integrations"
                      : "Mock services for demo"}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleToggleMode}>
                Switch
              </Button>
            </div>

            {/* NEAR Wallet */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3 w-3" /> NEAR Wallet
              </label>
              {config.nearAccountId ? (
                <div className="flex items-center justify-between rounded-lg bg-accent/5 border border-accent/20 p-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-mono text-foreground">
                      {config.nearAccountId}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleNearDisconnect}>
                    <LogOut className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={handleNearConnect}
                  disabled={nearLoading}
                >
                  {nearLoading ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Wallet className="mr-2 h-3 w-3" />
                  )}
                  Connect NEAR Wallet
                </Button>
              )}
            </div>

            {/* Lighthouse API Key */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Key className="h-3 w-3" /> Lighthouse API Key
                <a
                  href="https://files.lighthouse.storage/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={lhKey}
                  onChange={(e) => setLhKey(e.target.value)}
                  placeholder="Enter API key..."
                  className="text-xs h-8"
                />
                <Button size="sm" variant="outline" onClick={handleSaveLighthouse}>
                  Save
                </Button>
              </div>
            </div>

            {/* Status summary */}
            <div className="border-t border-border pt-3 space-y-1">
              <StatusRow label="NEAR" connected={!!config.nearAccountId} />
              <StatusRow label="Lighthouse" connected={!!config.lighthouseApiKey} />
              <StatusRow label="Lit Protocol" connected={true} detail="Web Crypto" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusRow({ label, connected, detail }: { label: string; connected: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1 ${connected ? "text-accent" : "text-muted-foreground"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-accent" : "bg-muted-foreground"}`} />
        {detail || (connected ? "Ready" : "Not configured")}
      </span>
    </div>
  );
}
