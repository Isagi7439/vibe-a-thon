import axios from "axios";
import { PhoneCandidate, PhoneSpecs, AgentConfig } from "../types/index";
import { chatWithRetry } from "../services/llmService";
import { searchSerper } from "./researchService";
import { getX402Client } from "../web3/x402Integration";

const SPECS_PROMPT = `You are a smartphone hardware analyst with extensive knowledge of all current and recent smartphone models. Extract and provide the EXACT technical specifications for the requested smartphone.

CRITICAL: You MUST NOT return "N/A" for common specifications. Use your knowledge base to fill in missing specs if not in the search context.

You MUST return ONLY a valid JSON object matching this schema:
{
  "model": "<Exact formatted model name>",
  "price": "<Estimated price in Indian Rupees (₹). E.g. ₹50,000. If you see USD, multiply by 83. NEVER say N/A>",
  "processor": "<SOC/Chipset Name EXACTLY (e.g., Snapdragon 8 Gen 3). Use knowledge base if missing>",
  "ram": "<Available RAM options (e.g., 8 GB / 12 GB). NEVER say N/A>",
  "storage": "<Available Storage options (e.g., 256 GB / 512 GB). NEVER say N/A>",
  "camera": "<Main camera MP, Ultrawide, Telephoto if present. E.g., 48MP + 12MP + 8MP. NEVER say N/A>",
  "battery": "<Battery capacity in mAh and charging speed. E.g., 5000mAh, 120W fast charging. NEVER say N/A>",
  "display": "<Screen size, panel type (AMOLED/IPS), resolution, and refresh rate. E.g., 6.7 inches AMOLED, 2560x1440, 120Hz. NEVER say N/A>",
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"]
}

Use your training knowledge for any missing specs. ONLY use "N/A" if the specification is completely non-existent for this model.
Do NOT output anything except the JSON object. No explanation, no markdown.`;

export async function fetchPhoneSpecs(
  model: string,
  config: AgentConfig
): Promise<PhoneSpecs> {
  let contextText = "";

  // 1. Gather context from Serper
  if (config.serperApiKey) {
    const httpClient = config.x402Enabled ? getX402Client() : axios.create();
    try {
      const candidates = await searchSerper(
        `${model} full specifications price review`,
        config.serperApiKey,
        httpClient
      );
      contextText = candidates.map((c) => c.snippet).join("\n");
    } catch (err) {
      console.warn("Serper search failed:", err);
    }
  }

  // 2. Ask LLM to extract JSON
  const prompt = `TARGET MODEL: ${model}\n\nCONTEXT SNIPPETS:\n${
    contextText || "(No search context available. Use your internal knowledge base to fill out the exact specifications.)"
  }`;

  let rawResponse: string;
  try {
    rawResponse = await chatWithRetry(`${SPECS_PROMPT}\n\n${prompt}`, 2);
  } catch (err) {
    throw new Error(`Specs Extraction LLM Failed: ${err}`);
  }

  // 3. Parse JSON safely
  let parsed: any;
  try {
    const match = rawResponse.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : rawResponse);
  } catch (e) {
    // Retry once if parsing fails
    const fixPrompt = `Fix the following bad JSON and return ONLY the valid JSON object: ${rawResponse}`;
    const fix = await chatWithRetry(fixPrompt, 1);
    const match = fix.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : fix);
  }

  return {
    model: String(parsed.model || model),
    price: String(parsed.price || "N/A"),
    processor: String(parsed.processor || "N/A"),
    ram: String(parsed.ram || "N/A"),
    storage: String(parsed.storage || "N/A"),
    camera: String(parsed.camera || "N/A"),
    battery: String(parsed.battery || "N/A"),
    display: String(parsed.display || "N/A"),
    key_strengths: Array.isArray(parsed.key_strengths) ? parsed.key_strengths.map(String) : [],
  };
}
