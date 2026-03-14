import chalk from "chalk";
import { RankedPhone, UserRequirements } from "../types/index";

// ─── Result Formatter ──────────────────────────────────────────────────────────

const BEST_FOR_ICONS: Record<string, string> = {
  gaming: "🎮",
  photography: "📷",
  casual: "😎",
  "all-rounder": "⭐",
};

const RANK_COLORS = [
  chalk.yellow.bold,   // 1st - gold
  chalk.white.bold,    // 2nd - silver
  chalk.hex("#CD7F32").bold, // 3rd - bronze
];

function getRankColor(rank: number): (text: string) => string {
  if (rank <= 3) return RANK_COLORS[rank - 1];
  return chalk.cyan;
}

function getRankMedal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank} `;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function printResults(phones: RankedPhone[], requirements: UserRequirements): void {
  console.log("");
  console.log(chalk.bold.cyan("═".repeat(65)));
  console.log(
    chalk.bold.cyan("  📱  TOP 10 SMARTPHONE RECOMMENDATIONS")
  );
  console.log(
    chalk.gray(`  Budget: ${requirements.budget} | Usage: ${requirements.usageType} | Camera: ${requirements.cameraPriority}`)
  );
  console.log(chalk.bold.cyan("═".repeat(65)));
  console.log("");

  for (const phone of phones) {
    const rankColor = getRankColor(phone.rank);
    const medal = getRankMedal(phone.rank);
    const bestForIcon = BEST_FOR_ICONS[phone.best_for.toLowerCase()] ?? "📱";

    // ── Phone header ──
    console.log(
      rankColor(`  ${medal} ${phone.model}`) +
        chalk.gray(`  ${bestForIcon} ${phone.best_for}`)
    );
    console.log(chalk.dim("  " + "─".repeat(60)));

    // ── Specs grid ──
    const specs = [
      ["💰 Price", phone.price],
      ["⚡ Processor", truncate(phone.processor, 40)],
      ["🧠 RAM", phone.ram],
      ["💾 Storage", phone.storage],
      ["📸 Camera", truncate(phone.camera, 40)],
      ["🔋 Battery", phone.battery],
      ["🖥  Display", truncate(phone.display, 40)],
    ];

    for (const [label, value] of specs) {
      console.log(
        `  ${chalk.gray(label.padEnd(14))} ${chalk.white(value)}`
      );
    }

    // ── Key Strengths ──
    if (phone.key_strengths && phone.key_strengths.length > 0) {
      console.log(
        `  ${chalk.gray("✨ Strengths".padEnd(14))} ${chalk.green(
          phone.key_strengths.join(" · ")
        )}`
      );
    }

    // ── Summary ──
    console.log("");
    const summaryLines = wrapText(phone.summary, 56);
    for (const line of summaryLines) {
      console.log(`  ${chalk.italic.gray(line)}`);
    }

    // ── Purchase link ──
    if (phone.purchase_link) {
      console.log(
        `\n  ${chalk.blue.underline("🔗 " + phone.purchase_link)}`
      );
    }

    console.log("");
    console.log(chalk.dim("  " + "─".repeat(60)));
    console.log("");
  }

  console.log(chalk.bold.cyan("═".repeat(65)));
}

export function printSummaryTable(phones: RankedPhone[]): void {
  console.log("");
  console.log(chalk.bold.white("  QUICK COMPARISON TABLE"));
  console.log("");

  // Header
  const header = [
    "#".padEnd(3),
    "Model".padEnd(32),
    "Price".padEnd(12),
    "Best For".padEnd(14),
  ].join(" │ ");
  console.log("  " + chalk.bold.cyan(header));
  console.log("  " + chalk.dim("─".repeat(header.length)));

  // Rows
  for (const phone of phones) {
    const rankColor = getRankColor(phone.rank);
    const row = [
      String(phone.rank).padEnd(3),
      truncate(phone.model, 32).padEnd(32),
      phone.price.padEnd(12),
      phone.best_for.padEnd(14),
    ].join(" │ ");
    console.log("  " + rankColor(row));
  }

  console.log("");
}

export function printReportHash(hash: string): void {
  console.log(chalk.dim(`  📋 Report hash: ${hash}`));
  console.log("");
}

function wrapText(text: string, width: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length <= width) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function printRequirementsSummary(req: UserRequirements): void {
  console.log("");
  console.log(chalk.bold("  Your Requirements Summary:"));
  console.log(chalk.dim("  " + "─".repeat(40)));
  const fields: [string, string][] = [
    ["Budget", req.budget],
    ["Processor", req.processor],
    ["Min RAM", `${req.minRam} GB`],
    ["Min Storage", `${req.minStorage} GB`],
    ["Camera", req.cameraPriority],
    ["Usage", req.usageType],
    ...(req.preferredBrand ? [["Brand", req.preferredBrand] as [string, string]] : []),
    ...(req.displayPreference ? [["Display", req.displayPreference] as [string, string]] : []),
    ...(req.batteryPreference ? [["Battery", req.batteryPreference] as [string, string]] : []),
  ];

  for (const [label, value] of fields) {
    console.log(
      `  ${chalk.gray(label.padEnd(14))} ${chalk.white(value)}`
    );
  }
  console.log("");
}
