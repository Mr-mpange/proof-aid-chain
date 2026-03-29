/**
 * In-memory document record store.
 * Persists to localStorage for demo continuity.
 */

import type { FilecoinResult } from "@/services/filecoin";
import type { BlockchainProof } from "@/services/near";
import type { EncryptionResult } from "@/services/lit";
import type { AIAnalysisResult } from "@/services/ai";

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  hash: string;
  filecoin: FilecoinResult;
  blockchain: BlockchainProof;
  encryption: EncryptionResult;
  aiAnalysis: AIAnalysisResult;
  createdAt: number;
}

const STORAGE_KEY = "proofdoc-records";

function loadRecords(): DocumentRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: DocumentRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

let records: DocumentRecord[] = loadRecords();
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((l) => l());
}

export const documentStore = {
  getAll(): DocumentRecord[] {
    return [...records];
  },

  add(record: DocumentRecord): void {
    records = [record, ...records];
    saveRecords(records);
    notify();
  },

  findByHash(hash: string): DocumentRecord | undefined {
    return records.find((r) => r.hash === hash);
  },

  subscribe(listener: () => void): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  clear(): void {
    records = [];
    saveRecords(records);
    notify();
  },
};
