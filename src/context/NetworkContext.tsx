import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type NetworkMode = "simulated" | "mainnet";

interface NetworkConfig {
  mode: NetworkMode;
  nearAccountId: string | null;
  lighthouseApiKey: string;
  litConnected: boolean;
}

interface NetworkContextType {
  config: NetworkConfig;
  setMode: (mode: NetworkMode) => void;
  setNearAccountId: (id: string | null) => void;
  setLighthouseApiKey: (key: string) => void;
  setLitConnected: (connected: boolean) => void;
  isReal: boolean;
}

const STORAGE_KEY = "proofdoc-network-config";

function loadConfig(): NetworkConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...defaultConfig, ...parsed };
    }
  } catch {}
  return defaultConfig;
}

const defaultConfig: NetworkConfig = {
  mode: "simulated",
  nearAccountId: null,
  lighthouseApiKey: "",
  litConnected: false,
};

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<NetworkConfig>(loadConfig);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const setMode = useCallback((mode: NetworkMode) => {
    setConfig((c) => ({ ...c, mode }));
  }, []);

  const setNearAccountId = useCallback((nearAccountId: string | null) => {
    setConfig((c) => ({ ...c, nearAccountId }));
  }, []);

  const setLighthouseApiKey = useCallback((lighthouseApiKey: string) => {
    setConfig((c) => ({ ...c, lighthouseApiKey }));
  }, []);

  const setLitConnected = useCallback((litConnected: boolean) => {
    setConfig((c) => ({ ...c, litConnected }));
  }, []);

  const isReal = config.mode === "mainnet";

  return (
    <NetworkContext.Provider
      value={{ config, setMode, setNearAccountId, setLighthouseApiKey, setLitConnected, isReal }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
