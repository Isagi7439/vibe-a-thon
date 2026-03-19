import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { AgentConfig, PhoneCandidate, SerperSearchResult } from "../types/index";
import { getX402Client } from "../web3/x402Integration";

// ─── Curated fallback phone dataset (used when no SERPER_API_KEY is set) ──────
const FALLBACK_PHONES: PhoneCandidate[] = [
  {
    model: "Samsung Galaxy S24 Ultra",
    price: "$1,299",
    processor: "Snapdragon 8 Gen 3",
    ram: "12 GB",
    storage: "256 GB / 512 GB / 1 TB",
    camera: "200MP main + 50MP periscope + 10MP + 12MP",
    battery: "5000 mAh",
    display: "6.8\" QHD+ Dynamic AMOLED 2X 120Hz",
    snippet: "Best Android flagship of 2024, exceptional camera and S-Pen.",
  },
  {
    model: "Apple iPhone 16 Pro Max",
    price: "$1,199",
    processor: "Apple A18 Pro",
    ram: "8 GB",
    storage: "256 GB / 512 GB / 1 TB",
    camera: "48MP main + 12MP ultrawide + 48MP 5x telephoto",
    battery: "4685 mAh",
    display: "6.9\" Super Retina XDR OLED 120Hz",
    snippet: "Best iPhone ever, top-tier performance and camera ecosystem.",
  },
  {
    model: "Google Pixel 9 Pro",
    price: "$999",
    processor: "Google Tensor G4",
    ram: "16 GB",
    storage: "128 GB / 256 GB / 512 GB / 1 TB",
    camera: "50MP main + 48MP ultrawide + 48MP 5x telephoto",
    battery: "4700 mAh",
    display: "6.3\" LTPO OLED 1-120Hz",
    snippet: "Best computational photography, 7 years of updates guaranteed.",
  },
  {
    model: "OnePlus 12",
    price: "$799",
    processor: "Snapdragon 8 Gen 3",
    ram: "12 GB / 16 GB",
    storage: "256 GB / 512 GB",
    camera: "50MP main + 48MP ultrawide + 64MP 3x telephoto (Hasselblad)",
    battery: "5400 mAh",
    display: "6.82\" LTPO AMOLED 1-120Hz ProXDR",
    snippet: "Flagship killer with fastest wired charging (100W) and Hasselblad cameras.",
  },
  {
    model: "Samsung Galaxy A55",
    price: "$449",
    processor: "Exynos 1480",
    ram: "8 GB",
    storage: "128 GB / 256 GB",
    camera: "50MP OIS main + 12MP ultrawide + 5MP macro",
    battery: "5000 mAh",
    display: "6.6\" FHD+ Super AMOLED+ 120Hz",
    snippet: "Best mid-ranger from Samsung with premium build and 4 years updates.",
  },
  {
    model: "Poco F6 Pro",
    price: "$449",
    processor: "Snapdragon 8 Gen 2",
    ram: "12 GB / 16 GB",
    storage: "256 GB / 512 GB",
    camera: "50MP OIS main + 8MP ultrawide + 2MP macro",
    battery: "5000 mAh",
    display: "6.67\" LTPO AMOLED 1-120Hz",
    snippet: "Best performance per dollar with Snapdragon 8 Gen 2, ideal for gaming.",
  },
  {
    model: "Nothing Phone 2a",
    price: "$349",
    processor: "MediaTek Dimensity 7200 Pro",
    ram: "8 GB / 12 GB",
    storage: "128 GB / 256 GB",
    camera: "50MP OIS main + 50MP ultrawide",
    battery: "5000 mAh",
    display: "6.7\" AMOLED 120Hz",
    snippet: "Unique glyph design, clean Android, great camera for the price.",
  },
  {
    model: "Motorola Edge 50 Pro",
    price: "$449",
    processor: "Snapdragon 7 Gen 3",
    ram: "12 GB",
    storage: "256 GB",
    camera: "50MP OIS main + 13MP ultrawide + 10MP 3x telephoto",
    battery: "4500 mAh",
    display: "6.7\" pOLED 1-144Hz HDR10+",
    snippet: "Smooth 144Hz display, near-stock Android, great value flagship features.",
  },
  {
    model: "Realme GT 6",
    price: "$499",
    processor: "Snapdragon 8s Gen 3",
    ram: "12 GB / 16 GB",
    storage: "256 GB / 512 GB",
    camera: "50MP Sony Lytia main + 8MP ultrawide + 50MP 3x telephoto",
    battery: "5500 mAh",
    display: "6.78\" LTPS AMOLED 1-120Hz",
    snippet: "Excellent gaming performance, industry-leading display brightness.",
  },
  {
    model: "Xiaomi 14",
    price: "$899",
    processor: "Snapdragon 8 Gen 3",
    ram: "12 GB / 16 GB",
    storage: "256 GB / 512 GB / 1 TB",
    camera: "50MP Leica main + 50MP ultrawide + 50MP 3.2x telephoto",
    battery: "4610 mAh",
    display: "6.36\" AMOLED 144Hz",
    snippet: "Compact flagship with Leica cameras, 90W fast charging, and top chipset.",
  },
  {
    model: "Samsung Galaxy S24+",
    price: "$999",
    processor: "Snapdragon 8 Gen 3",
    ram: "12 GB",
    storage: "256 GB / 512 GB",
    camera: "50MP main + 12MP ultrawide + 10MP 3x telephoto",
    battery: "4900 mAh",
    display: "6.7\" QHD+ Dynamic AMOLED 2X 120Hz",
    snippet: "Excellent all-rounder with 7 years updates and bright display.",
  },
  {
    model: "Vivo X100 Pro",
    price: "$899",
    processor: "MediaTek Dimensity 9300",
    ram: "16 GB",
    storage: "256 GB / 512 GB",
    camera: "50MP ZEISS main + 50MP ultrawide + 100MP 4.3x periscope",
    battery: "5400 mAh",
    display: "6.78\" LTPO AMOLED 1-120Hz",
    snippet: "Elite camera system with ZEISS optics and massive battery.",
  },
  {
    model: "Apple iPhone 16",
    price: "$799",
    processor: "Apple A18",
    ram: "8 GB",
    storage: "128 GB / 256 GB / 512 GB",
    camera: "48MP main + 12MP ultrawide",
    battery: "3561 mAh",
    display: "6.1\" Super Retina XDR OLED 60Hz",
    snippet: "Entry flagship iPhone with Apple Intelligence, camera control button.",
  },
  {
    model: "Samsung Galaxy A35",
    price: "$299",
    processor: "Exynos 1380",
    ram: "6 GB / 8 GB",
    storage: "128 GB / 256 GB",
    camera: "50MP OIS main + 8MP ultrawide + 5MP macro",
    battery: "5000 mAh",
    display: "6.6\" FHD+ Super AMOLED 120Hz",
    snippet: "Solid mid-range with Samsung polish, 4 years of OS updates.",
  },
  {
    model: "Redmi Note 13 Pro+",
    price: "$349",
    processor: "MediaTek Dimensity 7200 Ultra",
    ram: "8 GB / 12 GB",
    storage: "256 GB / 512 GB",
    camera: "200MP OIS main + 8MP ultrawide + 2MP macro",
    battery: "5000 mAh",
    display: "6.67\" 1.5K AMOLED 120Hz 1800nits",
    snippet: "200MP camera and fast 120W charging at a mid-range price.",
  },
  {
    model: "ASUS ROG Phone 8 Pro",
    price: "$1,099",
    processor: "Snapdragon 8 Gen 3",
    ram: "16 GB / 24 GB",
    storage: "512 GB / 1 TB",
    camera: "50MP main + 13MP ultrawide + 32MP 3x telephoto",
    battery: "5500 mAh",
    display: "6.78\" AMOLED 165Hz LTPO",
    snippet: "Ultimate gaming phone with active cooling, 165Hz display, max RAM.",
  },
  {
    model: "Nubia Red Magic 9 Pro",
    price: "$649",
    processor: "Snapdragon 8 Gen 3",
    ram: "12 GB / 16 GB",
    storage: "256 GB / 512 GB",
    camera: "50MP main + 50MP ultrawide + 2MP macro",
    battery: "6500 mAh",
    display: "6.8\" AMOLED 120Hz",
    snippet: "Gaming beast with built-in fan cooling and huge 6500mAh battery.",
  },
  {
    model: "Google Pixel 8a",
    price: "$499",
    processor: "Google Tensor G3",
    ram: "8 GB",
    storage: "128 GB / 256 GB",
    camera: "64MP OIS main + 13MP ultrawide",
    battery: "4492 mAh",
    display: "6.1\" OLED 120Hz",
    snippet: "Best mid-range camera phone, clean Android 14, 7 years updates.",
  },
  {
    model: "OnePlus Nord 4",
    price: "$449",
    processor: "Snapdragon 7+ Gen 3",
    ram: "8 GB / 12 GB / 16 GB",
    storage: "128 GB / 256 GB",
    camera: "50MP OIS main + 8MP ultrawide",
    battery: "5500 mAh",
    display: "6.74\" AMOLED 120Hz",
    snippet: "Metal unibody mid-ranger with flagship chipset and 100W charging.",
  },
  {
    model: "Sony Xperia 1 VI",
    price: "$1,299",
    processor: "Snapdragon 8 Gen 3",
    ram: "12 GB",
    storage: "256 GB / 512 GB",
    camera: "52MP Zeiss main + 12MP ultrawide + 12MP 7.1x periscope",
    battery: "5000 mAh",
    display: "6.5\" 4K OLED 1-120Hz",
    snippet: "Professional content creator phone with Zeiss, 4K display, audio focus.",
  },
];

// ─── Main Research Service ─────────────────────────────────────────────────────

let agentConfig: AgentConfig | null = null;

export function initResearch(cfg: AgentConfig): void {
  agentConfig = cfg;
}

function buildSearchQueries(
  budget: string,
  usageType: string,
  processor: string,
  cameraPriority: string,
  brand?: string
): string[] {
  const queries: string[] = [
    `best smartphones ${budget} budget 2025 ${usageType}`,
    `top phones ${budget} ${processor} processor 2025 review`,
    `best ${cameraPriority} camera phones ${budget} 2025`,
  ];
  if (brand && brand.toLowerCase() !== "any" && brand.toLowerCase() !== "no preference") {
    queries.push(`best ${brand} phones ${budget} 2025`);
  }
  return queries;
}

export async function searchSerper(
  query: string,
  apiKey: string,
  httpClient: AxiosInstance
): Promise<PhoneCandidate[]> {
  const url = "https://google.serper.dev/search";
  const response = await httpClient.post<SerperSearchResult>(
    url,
    { q: query, num: 10 },
    { headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" } }
  );

  const results: PhoneCandidate[] = [];
  const organic = response.data.organic ?? [];

  for (const item of organic) {
    // Extract phone model name heuristically from title
    if (item.title && item.snippet) {
      results.push({
        model: item.title.replace(/\s*[-|–].*$/, "").trim(),
        snippet: item.snippet,
        source: item.link,
      });
    }
  }
  return results;
}

function deduplicateCandidates(candidates: PhoneCandidate[]): PhoneCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = c.model.toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchPhones(
  requirements: import("../types/index").UserRequirements,
  maxCandidates: number
): Promise<PhoneCandidate[]> {
  if (!agentConfig) throw new Error("Research service not initialized");

  // If no Serper key, use fallback dataset
  if (!agentConfig.serperApiKey) {
    console.log("\n  ℹ  No SERPER_API_KEY found — using built-in phone dataset.\n");
    return filterFallbackByRequirements(requirements);
  }

  const httpClient = agentConfig.x402Enabled ? getX402Client() : axios.create();
  const queries = buildSearchQueries(
    requirements.budget,
    requirements.usageType,
    requirements.processor,
    requirements.cameraPriority,
    requirements.preferredBrand
  );

  const allResults: PhoneCandidate[] = [];

  for (const q of queries) {
    try {
      const results = await searchSerper(q, agentConfig.serperApiKey, httpClient);
      allResults.push(...results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  ⚠  Search query failed: "${q}" — ${msg}`);
    }
  }

  // Merge with fallback if we got too few results
  const combined = [...allResults, ...FALLBACK_PHONES];
  const unique = deduplicateCandidates(combined);
  return unique.slice(0, maxCandidates);
}

function filterFallbackByRequirements(
  req: import("../types/index").UserRequirements
): PhoneCandidate[] {
  // Parse budget range and strip commas to correctly parse numbers like 50,000
  let sanitizedBudget = req.budget.toLowerCase().replace(/,/g, '');
  // Convert 'k' notation to thousands (e.g. '5k' -> '5000')
  sanitizedBudget = sanitizedBudget.replace(/(\d+)k/g, (match, p1) => String(parseInt(p1, 10) * 1000));
  
  const budgetNums = sanitizedBudget.match(/\d+/g)?.map(Number) ?? [];
  let maxBudget = budgetNums.length > 0 ? Math.max(...budgetNums) : Infinity;
  let minBudget = budgetNums.length > 1 ? Math.min(...budgetNums) : 0;

  // Simple heuristic for INR -> USD conversion for fallback list filtering
  if (req.budget.toLowerCase().includes('₹') || req.budget.toLowerCase().includes('inr') || maxBudget >= 4000) {
    maxBudget = maxBudget / 83;
    minBudget = minBudget / 83;
  }

  return FALLBACK_PHONES.filter((phone) => {
    // Budget filter
    const priceMatch = phone.price?.match(/\d[\d,]*/)?.[0].replace(/,/g, "");
    if (priceMatch) {
      const price = parseInt(priceMatch, 10);
      if (price > maxBudget * 1.2) return false; // 20% buffer
      if (minBudget > 0 && price < minBudget * 0.7) return false;
    }

    // Processor preference
    if (
      req.processor.toLowerCase() !== "any" &&
      req.processor.toLowerCase() !== "no preference"
    ) {
      const procLower = (phone.processor ?? "").toLowerCase();
      const reqProcLower = req.processor.toLowerCase();
      if (
        !procLower.includes(reqProcLower) &&
        !reqProcLower.includes("any")
      ) {
        // Don't hard exclude — just push towards relevant ones
      }
    }

    return true;
  });
}

export function hashCandidates(candidates: PhoneCandidate[]): string {
  const str = JSON.stringify(candidates);
  return crypto.createHash("sha256").update(str).digest("hex");
}
