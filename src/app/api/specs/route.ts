import { NextResponse } from 'next/server';
import { AgentConfig } from '@/types/index';
import { fetchPhoneSpecs } from '@/research/specsEngine';
import { initLLM } from '@/services/llmService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { search_query } = body;

    if (!search_query) {
      return NextResponse.json({ error: 'search_query is required' }, { status: 400 });
    }

    const config: AgentConfig = {
      groqApiKey: process.env.GROQ_API_KEY || '',
      groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      serperApiKey: process.env.SERPER_API_KEY || undefined,
      avalancheRpc: process.env.AVALANCHE_RPC ?? "https://api.avax.network/ext/bc/C/rpc",
      x402Enabled: process.env.X402_ENABLED !== "false",
      maxCandidates: parseInt(process.env.MAX_CANDIDATES ?? "30", 10),
      debug: process.env.DEBUG === "true",
    };

    if (!config.groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is missing in server environment.' },
        { status: 500 }
      );
    }

    // Initialize required services
    initLLM(config);

    const specs = await fetchPhoneSpecs(search_query, config);

    return NextResponse.json({ specs });
  } catch (error: any) {
    console.error('API Route Error /specs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
