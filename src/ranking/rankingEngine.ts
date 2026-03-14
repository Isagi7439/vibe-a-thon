import { PhoneCandidate, RankedPhone, UserRequirements } from "../types/index";
import { chatWithRetry } from "../services/llmService";

// ─── Ranking Engine ──────────────────────────────────────────────────────────

const RANK_SYSTEM_TEMPLATE = `You are an expert smartphone analyst. Your task is to analyze candidate phones and select the TOP 10 best matches for a user's specific requirements.

You MUST return ONLY a valid JSON array of exactly 10 objects (or fewer if fewer candidates are provided).
Each object must follow this exact schema:
{
  "rank": <number>,
  "model": "<full model name>",
  "price": "<price with currency>",
  "processor": "<chip name>",
  "ram": "<RAM specs>",
  "storage": "<storage options>",
  "camera": "<camera specs>",
  "battery": "<battery capacity>",
  "display": "<display specs>",
  "best_for": "<gaming|photography|casual|all-rounder>",
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "summary": "<2-3 sentence expert summary explaining why this phone fits the user's needs>",
  "purchase_link": "<amazon or manufacturer URL if known, else empty string>"
}

Return ONLY the JSON array. No markdown, no explanation, no code fences.`;

function buildRankingPrompt(
  candidates: PhoneCandidate[],
  requirements: UserRequirements
): string {
  const reqSummary = `
USER REQUIREMENTS:
- Budget: ${requirements.budget}
- Preferred Processor: ${requirements.processor}
- Minimum RAM: ${requirements.minRam} GB
- Minimum Storage: ${requirements.minStorage} GB
- Camera Priority: ${requirements.cameraPriority}
- Primary Usage: ${requirements.usageType}
- Preferred Brand: ${requirements.preferredBrand ?? "No preference"}
- Display Preference: ${requirements.displayPreference ?? "No preference"}
- Battery Preference: ${requirements.batteryPreference ?? "No preference"}
`;

  const candidatesJSON = JSON.stringify(
    candidates.map((c) => ({
      model: c.model,
      price: c.price ?? "Unknown",
      processor: c.processor ?? "Unknown",
      ram: c.ram ?? "Unknown",
      storage: c.storage ?? "Unknown",
      camera: c.camera ?? "Unknown",
      battery: c.battery ?? "Unknown",
      display: c.display ?? "Unknown",
      snippet: c.snippet ?? "",
    })),
    null,
    2
  );

  return `${reqSummary}

CANDIDATE PHONES (${candidates.length} total):
${candidatesJSON}

RANKING INSTRUCTIONS:
1. Prioritize phones that match the budget range strictly (within 15% over budget max)
2. Weight heavily towards the primary usage type: ${requirements.usageType}
3. Camera priority is: ${requirements.cameraPriority} — adjust weight accordingly
4. Minimum requirements: ${requirements.minRam}GB RAM, ${requirements.minStorage}GB storage
5. If a brand preference was stated, prefer that brand for ties
6. Fill in any missing specs intelligently based on your knowledge of the phone model
7. Set "best_for" to the PRIMARY use case this phone excels at
8. The "summary" must directly reference the user's stated requirements

Return the top 10 ranked phones as a JSON array.`;
}

function extractJSON(text: string): string {
  // Try to find JSON array in the response
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];

  // Try JSON object wrapped in code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1];

  return text.trim();
}

function validateRankedPhone(obj: unknown, idx: number): RankedPhone {
  if (typeof obj !== "object" || obj === null) {
    throw new Error(`Item ${idx} is not an object`);
  }

  const p = obj as Record<string, unknown>;

  return {
    rank: typeof p.rank === "number" ? p.rank : idx + 1,
    model: String(p.model ?? "Unknown"),
    price: String(p.price ?? "N/A"),
    processor: String(p.processor ?? "N/A"),
    ram: String(p.ram ?? "N/A"),
    storage: String(p.storage ?? "N/A"),
    camera: String(p.camera ?? "N/A"),
    battery: String(p.battery ?? "N/A"),
    display: String(p.display ?? "N/A"),
    best_for: String(p.best_for ?? "all-rounder"),
    key_strengths: Array.isArray(p.key_strengths)
      ? (p.key_strengths as unknown[]).map(String)
      : ["N/A"],
    summary: String(p.summary ?? "N/A"),
    purchase_link: String(p.purchase_link ?? ""),
  };
}

export async function rankPhones(
  candidates: PhoneCandidate[],
  requirements: UserRequirements
): Promise<RankedPhone[]> {
  if (candidates.length === 0) {
    throw new Error("No candidate phones to rank");
  }

  const prompt = buildRankingPrompt(candidates, requirements);

  let rawResponse: string;
  try {
    rawResponse = await chatWithRetry(
      `${RANK_SYSTEM_TEMPLATE}\n\n${prompt}`,
      3
    );
  } catch (err) {
    throw new Error(`LLM ranking failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  let parsed: unknown;
  try {
    const jsonStr = extractJSON(rawResponse);
    parsed = JSON.parse(jsonStr);
  } catch {
    // Second attempt: ask LLM to fix it
    const fixPrompt = `The following text should be a JSON array but failed to parse. 
Fix it and return ONLY the valid JSON array (no explanation, no markdown):
${rawResponse}`;

    try {
      const fixedResponse = await chatWithRetry(fixPrompt, 2);
      const fixedJson = extractJSON(fixedResponse);
      parsed = JSON.parse(fixedJson);
    } catch (e2) {
      throw new Error(`JSON parsing failed after retry: ${e2}`);
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error("LLM response was not a JSON array");
  }

  const ranked: RankedPhone[] = parsed
    .slice(0, 10)
    .map((item, idx) => validateRankedPhone(item, idx));

  // Ensure ranks are sequential
  ranked.forEach((p, i) => {
    p.rank = i + 1;
  });

  return ranked;
}
