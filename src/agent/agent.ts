import ora from "ora";
import chalk from "chalk";
import crypto from "crypto";
import { AgentConfig, RankedPhone, UserRequirements } from "../types/index";
import { initLLM } from "../services/llmService";
import { initResearch, searchPhones } from "../research/researchService";
import { rankPhones } from "../ranking/rankingEngine";
import {
  initAvalanche,
  logRecommendationOnChain,
  isAvalancheReady,
  getWalletInfo,
  getNetworkInfo,
} from "../web3/avalancheService";
import { initX402, isX402Enabled, getX402SignerAddress } from "../web3/x402Integration";

// ─── Main Agent ────────────────────────────────────────────────────────────────

export class SmartphoneAgent {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Initialize all services
    initLLM(this.config);
    initResearch(this.config);
    initX402(this.config);
    const avalancheOk = initAvalanche(this.config);

    this.printBanner();
    await this.printSystemStatus(avalancheOk);
  }

  private printBanner(): void {
    console.log("");
    console.log(
      chalk.cyan.bold("╔═══════════════════════════════════════════════════════╗")
    );
    console.log(
      chalk.cyan.bold("║") +
        chalk.white.bold("       📱  SMARTPHONE AI AGENT  v1.0.0                ") +
        chalk.cyan.bold("║")
    );
    console.log(
      chalk.cyan.bold("║") +
        chalk.gray("       Powered by Groq AI · Avalanche · x402           ") +
        chalk.cyan.bold("║")
    );
    console.log(
      chalk.cyan.bold("╚═══════════════════════════════════════════════════════╝")
    );
    console.log("");
  }

  private async printSystemStatus(avalancheOk: boolean): Promise<void> {
    console.log(chalk.bold("  System Status:"));

    // LLM
    console.log(
      `  ${chalk.green("✓")} LLM         : ${chalk.cyan(this.config.groqModel)}`
    );

    // Research
    const researchStatus = this.config.serperApiKey
      ? chalk.green("Serper API (live search)")
      : chalk.yellow("Curated dataset (no SERPER_API_KEY)");
    console.log(`  ${chalk.green("✓")} Research     : ${researchStatus}`);

    // x402
    const x402Status = isX402Enabled()
      ? chalk.green("Enabled") + (getX402SignerAddress() ? ` (signer: ${getX402SignerAddress()?.slice(0, 10)}...)` : "")
      : chalk.gray("Disabled");
    console.log(`  ${chalk.green("✓")} x402         : ${x402Status}`);

    // Avalanche
    if (avalancheOk) {
      const walletInfo = await getWalletInfo();
      const networkInfo = await getNetworkInfo();
      if (walletInfo) {
        console.log(
          `  ${chalk.green("✓")} Avalanche    : ${chalk.green(networkInfo)}`
        );
        console.log(
          `    ${chalk.gray("Wallet:")} ${chalk.white(walletInfo.address.slice(0, 10) + "..." + walletInfo.address.slice(-8))}`
        );
        console.log(
          `    ${chalk.gray("Balance:")} ${chalk.white(parseFloat(walletInfo.balanceAvax).toFixed(4))} AVAX`
        );
      }
    } else {
      console.log(
        `  ${chalk.yellow("○")} Avalanche    : ${chalk.gray("No PRIVATE_KEY — on-chain logging skipped")}`
      );
    }

    console.log("");
  }

  async run(requirements: UserRequirements): Promise<RankedPhone[]> {
    console.log("");
    console.log(chalk.bold.cyan("  ─── Starting Analysis Pipeline ─────────────────────"));
    console.log("");

    // Step 1: Research
    const searchSpinner = ora({
      text: chalk.cyan("Searching internet for phone candidates..."),
      color: "cyan",
    }).start();

    let candidates;
    try {
      candidates = await searchPhones(requirements, this.config.maxCandidates);
      searchSpinner.succeed(
        chalk.green(`Found ${candidates.length} phone candidates`)
      );
    } catch (err) {
      searchSpinner.fail("Research step failed");
      throw err;
    }

    // Step 2: AI Ranking
    console.log("");
    const rankSpinner = ora({
      text: chalk.cyan("AI analyzing and ranking phones for your requirements..."),
      color: "cyan",
    }).start();

    let ranked: RankedPhone[];
    try {
      ranked = await rankPhones(candidates, requirements);
      rankSpinner.succeed(chalk.green(`AI ranked ${ranked.length} phones`));
    } catch (err) {
      rankSpinner.fail("Ranking step failed");
      throw err;
    }

    // Step 3: On-chain logging (optional)
    if (isAvalancheReady()) {
      console.log("");
      const chainSpinner = ora({
        text: chalk.cyan("Logging recommendation hash on Avalanche..."),
        color: "cyan",
      }).start();
      try {
        const logEntry = await logRecommendationOnChain(requirements, ranked);
        if (logEntry?.txHash) {
          chainSpinner.succeed(
            chalk.green(`On-chain log: ${logEntry.txHash.slice(0, 20)}...`)
          );
        } else {
          chainSpinner.warn(chalk.yellow("On-chain logging skipped (check AVAX balance)"));
        }
      } catch {
        chainSpinner.fail("On-chain logging failed (non-critical)");
      }
    }

    return ranked;
  }

  generateReportHash(requirements: UserRequirements, phones: RankedPhone[]): string {
    const content = JSON.stringify({ requirements, phones });
    return crypto.createHash("sha256").update(content).digest("hex");
  }
}
