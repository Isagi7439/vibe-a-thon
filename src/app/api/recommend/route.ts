import { NextResponse } from 'next/server';
import { SmartphoneAgent } from '@/agent/agent';
import { UserRequirements, AgentConfig } from '@/types/index';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requirements: UserRequirements = body;

    const config: AgentConfig = {
      groqApiKey: process.env.GROQ_API_KEY || '',
      groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      serperApiKey: process.env.SERPER_API_KEY || undefined,
      avalancheRpc: process.env.AVALANCHE_RPC ?? "https://api.avax.network/ext/bc/C/rpc",
      privateKey: process.env.PRIVATE_KEY || undefined,
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

    const agent = new SmartphoneAgent(config);
    await agent.initialize();
    
    const results = await agent.run(requirements);
    const reportHash = agent.generateReportHash(requirements, results);

    return NextResponse.json({ results, reportHash });
  } catch (error: any) {
    console.error('API Route Error:', error);
    
    if (error.message.includes('NO_MATCH:')) {
      const suggestion = error.message.split('NO_MATCH:')[1];
      return NextResponse.json({ 
        results: [],
        suggestion: suggestion,
        reportHash: "N/A"
      });
    }

    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
