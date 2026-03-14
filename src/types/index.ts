// ─── Shared TypeScript Types ───────────────────────────────────────────────────

export interface UserRequirements {
  budget: string;              // e.g. "$300-$500"
  processor: string;           // "Snapdragon" | "MediaTek" | "Apple" | "Any"
  minRam: number;              // GB
  minStorage: number;          // GB
  cameraPriority: "low" | "medium" | "high" | "flagship";
  usageType: "gaming" | "photography" | "casual" | "all-rounder";
  preferredBrand?: string;
  displayPreference?: string;
  batteryPreference?: string;
}

export interface PhoneCandidate {
  model: string;
  price?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  camera?: string;
  battery?: string;
  display?: string;
  score?: number;
  source?: string;
  snippet?: string;
}

export interface RankedPhone {
  rank: number;
  model: string;
  price: string;
  processor: string;
  ram: string;
  storage: string;
  camera: string;
  battery: string;
  display: string;
  best_for: string;
  key_strengths: string[];
  summary: string;
  purchase_link?: string;
}

export interface SerperSearchResult {
  organic: Array<{
    title: string;
    link: string;
    snippet: string;
    position: number;
  }>;
  answerBox?: {
    title: string;
    answer: string;
    snippet: string;
  };
}

export interface AvalancheLogEntry {
  timestamp: number;
  requirementsHash: string;
  recommendationsHash: string;
  topModel: string;
  txHash?: string;
}

export interface AgentConfig {
  groqApiKey: string;
  groqModel: string;
  serperApiKey?: string;
  avalancheRpc: string;
  privateKey?: string;
  x402Enabled: boolean;
  maxCandidates: number;
  debug: boolean;
}
