import "dotenv/config";
import inquirer from "inquirer";
import chalk from "chalk";
import { AgentConfig, UserRequirements } from "../types/index";
import { SmartphoneAgent } from "../agent/agent";
import {
  printResults,
  printSummaryTable,
  printRequirementsSummary,
  printReportHash,
} from "./formatter";

// ─── CLI Entry Point ───────────────────────────────────────────────────────────

function loadConfig(): AgentConfig {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.error(
      chalk.red(
        "\n  ✗ GROQ_API_KEY is required. Please set it in your .env file.\n" +
          "    Get a free key at: https://console.groq.com\n"
      )
    );
    process.exit(1);
  }

  return {
    groqApiKey,
    groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    serperApiKey: process.env.SERPER_API_KEY || undefined,
    avalancheRpc:
      process.env.AVALANCHE_RPC ?? "https://api.avax.network/ext/bc/C/rpc",
    privateKey: process.env.PRIVATE_KEY || undefined,
    x402Enabled: process.env.X402_ENABLED !== "false",
    maxCandidates: parseInt(process.env.MAX_CANDIDATES ?? "30", 10),
    debug: process.env.DEBUG === "true",
  };
}

async function collectRequirements(): Promise<UserRequirements> {
  console.log(chalk.bold.white("\n  ─── Tell us about your ideal smartphone ────────────────\n"));

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "budget",
      message: chalk.cyan("  💰 What is your budget range?"),
      default: "$300-$600",
      validate: (input: string) => {
        if (!input.trim()) return "Please enter a budget range";
        return true;
      },
    },
    {
      type: "list",
      name: "processor",
      message: chalk.cyan("  ⚡ Preferred processor brand?"),
      choices: [
        { name: "Snapdragon (Qualcomm)  — Best gaming/performance", value: "Snapdragon" },
        { name: "MediaTek (Dimensity)   — Good value", value: "MediaTek" },
        { name: "Apple (A-series)       — iOS only, top efficiency", value: "Apple" },
        { name: "Exynos (Samsung)       — Samsung-specific", value: "Exynos" },
        { name: "Google Tensor          — Best AI/camera processing", value: "Google Tensor" },
        { name: "No preference          — Best available", value: "Any" },
      ],
    },
    {
      type: "list",
      name: "minRam",
      message: chalk.cyan("  🧠 Minimum RAM required?"),
      choices: [
        { name: "4 GB  — Basic tasks", value: 4 },
        { name: "6 GB  — Smooth multitasking", value: 6 },
        { name: "8 GB  — Recommended", value: 8 },
        { name: "12 GB — Power user", value: 12 },
        { name: "16 GB — Enthusiast", value: 16 },
      ],
      default: 8,
    },
    {
      type: "list",
      name: "minStorage",
      message: chalk.cyan("  💾 Minimum internal storage?"),
      choices: [
        { name: "64 GB  — Light use", value: 64 },
        { name: "128 GB — Standard", value: 128 },
        { name: "256 GB — Recommended", value: 256 },
        { name: "512 GB — Heavy media", value: 512 },
        { name: "1 TB   — Maximum", value: 1000 },
      ],
      default: 128,
    },
    {
      type: "list",
      name: "cameraPriority",
      message: chalk.cyan("  📸 How important is the camera?"),
      choices: [
        { name: "Low       — Basic camera is fine", value: "low" },
        { name: "Medium    — Good camera for everyday shots", value: "medium" },
        { name: "High      — Great camera, a top priority", value: "high" },
        { name: "Flagship  — Absolute best camera possible", value: "flagship" },
      ],
    },
    {
      type: "list",
      name: "usageType",
      message: chalk.cyan("  🎯 Primary usage type?"),
      choices: [
        { name: "🎮 Gaming       — High performance, smooth display", value: "gaming" },
        { name: "📷 Photography  — Best cameras, color science", value: "photography" },
        { name: "😎 Casual Use   — Good battery, everyday tasks", value: "casual" },
        { name: "⭐ All-Rounder  — Balanced across all areas", value: "all-rounder" },
      ],
    },
    {
      type: "input",
      name: "preferredBrand",
      message: chalk.cyan(
        "  🏷  Preferred brand? (Samsung, Apple, Google, OnePlus, Xiaomi, etc. or leave blank)"
      ),
      default: "",
    },
    {
      type: "input",
      name: "displayPreference",
      message: chalk.cyan(
        "  🖥  Display preference? (e.g. AMOLED, 120Hz, large screen, compact — or leave blank)"
      ),
      default: "",
    },
    {
      type: "input",
      name: "batteryPreference",
      message: chalk.cyan(
        "  🔋 Battery preference? (e.g. 5000mAh+, fast charging, all-day battery — or leave blank)"
      ),
      default: "",
    },
  ]);

  return {
    budget: answers.budget,
    processor: answers.processor,
    minRam: answers.minRam,
    minStorage: answers.minStorage,
    cameraPriority: answers.cameraPriority,
    usageType: answers.usageType,
    preferredBrand: answers.preferredBrand || undefined,
    displayPreference: answers.displayPreference || undefined,
    batteryPreference: answers.batteryPreference || undefined,
  };
}

async function main(): Promise<void> {
  const config = loadConfig();
  const agent = new SmartphoneAgent(config);

  await agent.initialize();

  // Collect user requirements
  const requirements = await collectRequirements();
  printRequirementsSummary(requirements);

  // Ask confirmation before running
  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message: chalk.cyan("  🚀 Ready to find your perfect smartphone?"),
      default: true,
    },
  ]);

  if (!confirmed) {
    console.log(chalk.gray("\n  Exiting. Run again to start over.\n"));
    process.exit(0);
  }

  try {
    // Run the agent
    const results = await agent.run(requirements);

    // Print detailed results
    printResults(results, requirements);

    // Print comparison table
    printSummaryTable(results);

    // Print report hash for verification
    const reportHash = agent.generateReportHash(requirements, results);
    printReportHash(reportHash);

    console.log(
      chalk.bold.green(
        "  ✅  Done! Your top 10 smartphones have been ranked by AI.\n"
      )
    );
    console.log(
      chalk.gray(
        "  Tip: Add SERPER_API_KEY for live internet search results.\n" +
          "       Add PRIVATE_KEY to log your recommendations on Avalanche.\n"
      )
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n  ✗ Agent error: ${msg}\n`));
    if (config.debug) {
      console.error(err);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red("\n  Fatal error:"), err);
  process.exit(1);
});
