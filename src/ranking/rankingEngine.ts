import { PhoneCandidate, RankedPhone, UserRequirements } from "../types/index";
import { chatWithRetry } from "../services/llmService";

// ─── Ranking Engine ──────────────────────────────────────────────────────────

const RANK_SYSTEM_TEMPLATE = `You are an expert smartphone analyst. Your task is to analyze candidate phones and select the TOP 10 best matches for a user's specific requirements.

You MUST return ONLY a valid JSON array of exactly 10 objects (or fewer if fewer candidates are provided).
Each object must follow this exact schema:
{
  "rank": <number>,
  "model": "<full model name>",
  "price": "<estimated price STRICTLY in Indian Rupees (₹). E.g. ₹50,000. If original is USD, multiply by 83. DO NOT OUTPUT $>",
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

If NO candidate phones meet the STRICT user requirements (especially budget, RAM, or storage), you MUST NOT return any phones. Instead, return a JSON object exactly like this:
{
  "error": "No phones match your strict requirements.",
  "suggestion": "<A friendly suggestion telling the user exactly which specifications they should change (e.g. increase budget to ₹X, lower RAM to Y) to get the closest desirable result>"
}

Return ONLY the JSON array (or the error JSON object). No markdown, no explanation, no code fences.`;

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
    candidates.map((c) => {
      let finalPrice = c.price ?? "Unknown";
      
      // Pre-compute USD -> INR for the prompt so the LLM doesn't hallucinate math
      const lowerBudget = requirements.budget.toLowerCase();
      if ((lowerBudget.includes('₹') || lowerBudget.includes('inr') || lowerBudget.includes('k')) && finalPrice.includes('$')) {
        const numMatch = finalPrice.match(/[\d,.]+/);
        if (numMatch) {
          const usdValue = parseFloat(numMatch[0].replace(/,/g, ''));
          if (!isNaN(usdValue)) {
            finalPrice = `₹${Math.round(usdValue * 83).toLocaleString('en-IN')}`;
          }
        }
      }

      return {
        model: c.model,
        price: finalPrice,
        processor: c.processor ?? "Unknown",
        ram: c.ram ?? "Unknown",
        storage: c.storage ?? "Unknown",
        camera: c.camera ?? "Unknown",
        battery: c.battery ?? "Unknown",
        display: c.display ?? "Unknown",
        snippet: c.snippet ?? "",
      };
    }),
    null,
    2
  );

  return `${reqSummary}

CANDIDATE PHONES (${candidates.length} total):
${candidatesJSON}

RANKING INSTRUCTIONS:
1. AT NO POINT recommend a phone with less than ${requirements.minRam}GB RAM or less than ${requirements.minStorage}GB storage. This is a STRICT HARDBOUND MINIMUM.
2. CRITICAL BUDGET CHECK: You MUST NEVER recommend a phone that significantly exceeds the user's stated budget (${requirements.budget}). Convert known USD prices to INR (~83 INR = 1 USD) for comparison. If a phone is over the budget, DISQUALIFY IT immediately.
3. If all candidate phones are disqualified (e.g. because they cost ₹100k but the budget is ₹5k), YOU MUST stop and return the error JSON object with a helpful suggestion. Do NOT output invalid phones.
4. Weight heavily towards the primary usage type: ${requirements.usageType}
5. Camera priority is: ${requirements.cameraPriority} — adjust weight accordingly
6. If a brand preference was stated, prefer that brand for ties
7. Fill in any missing specs intelligently based on your knowledge of the phone model
8. Set "best_for" to the PRIMARY use case this phone excels at
9. The "summary" must directly reference the user's stated requirements and output estimated prices accurately in the requested currency (${requirements.budget}).

Return the top 10 ranked phones as a JSON array.`;
}

function extractJSON(text: string): string {
  // Try to find JSON array or JSON object in the response
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1];
  
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];

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

  // Natively pre-filter candidates by budget so the LLM doesn't have an opportunity to hallucinate
  let sanitizedBudget = requirements.budget.toLowerCase().replace(/,/g, '');
  sanitizedBudget = sanitizedBudget.replace(/(\d+)k/g, (m, p1) => String(parseInt(p1, 10) * 1000));
  const budgetNums = sanitizedBudget.match(/\d+/g)?.map(Number) ?? [];
  let maxBudget = budgetNums.length > 0 ? Math.max(...budgetNums) : Infinity;
  
  // If user budget looks like USD, normalize it to INR for systemic comparison
  if (!sanitizedBudget.includes('₹') && !sanitizedBudget.includes('inr') && maxBudget < 4000) {
    maxBudget *= 83;
  }

  const validCandidates = candidates.filter((c) => {
    const priceStr = c.price || "";
    let usdValue = NaN;
    if (priceStr.includes('$')) {
      const numMatch = priceStr.match(/[\d,.]+/);
      if (numMatch) usdValue = parseFloat(numMatch[0].replace(/,/g, ''));
    }
    
    // Natively disqualify candidates that exceed the user's stated budget by >15%
    if (!isNaN(usdValue)) {
      const inrPrice = usdValue * 83;
      if (inrPrice > maxBudget * 1.15) return false;
    }
    return true;
  });

  if (validCandidates.length === 0) {
    throw new Error(`NO_MATCH:I forcefully disqualified all ${candidates.length} candidates found because none of them met your extremely strict specs. The closest candidates found significantly exceeded your stated budget of ${requirements.budget}. Please try adjusting your budget or performance requirements.`);
  }

  const prompt = buildRankingPrompt(validCandidates, requirements);

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
    if (parsed && typeof parsed === "object" && "suggestion" in parsed) {
      throw new Error(`NO_MATCH:${(parsed as any).suggestion}`);
    }
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
