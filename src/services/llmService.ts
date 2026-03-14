import Groq from "groq-sdk";
import { AgentConfig } from "../types/index";

let client: Groq | null = null;
let config: AgentConfig | null = null;

export function initLLM(cfg: AgentConfig): void {
  config = cfg;
  client = new Groq({ apiKey: cfg.groqApiKey });
}

export async function chat(prompt: string): Promise<string> {
  if (!client || !config) {
    throw new Error("LLM service not initialized. Call initLLM() first.");
  }

  const response = await client.chat.completions.create({
    model: config.groqModel,
    messages: [
      {
        role: "system",
        content:
          "You are an expert smartphone analyst with deep knowledge of mobile technology, benchmarks, and consumer needs. Always respond with accurate, up-to-date information.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
    max_tokens: 4096,
  });

  const text = response.choices[0]?.message?.content ?? "";
  return text;
}

export async function chatWithRetry(
  prompt: string,
  retries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await chat(prompt);
    } catch (err: unknown) {
      if (attempt === retries) throw err;
      const waitMs = attempt * 2000;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw new Error("LLM chat failed after all retries");
}
