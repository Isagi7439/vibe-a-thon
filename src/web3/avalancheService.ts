import { ethers } from "ethers";
import crypto from "crypto";
import { AgentConfig, AvalancheLogEntry, RankedPhone } from "../types/index";

// ─── Avalanche C-Chain Service ─────────────────────────────────────────────────

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let config: AgentConfig | null = null;

export function initAvalanche(cfg: AgentConfig): boolean {
  config = cfg;

  if (!cfg.privateKey) {
    return false; // Gracefully skip
  }

  try {
    provider = new ethers.JsonRpcProvider(cfg.avalancheRpc);
    wallet = new ethers.Wallet(cfg.privateKey, provider);
    return true;
  } catch (err) {
    console.warn("  ⚠  Failed to initialize Avalanche wallet:", err);
    return false;
  }
}

export async function getWalletInfo(): Promise<{
  address: string;
  balanceAvax: string;
  chainId: bigint;
} | null> {
  if (!wallet || !provider) return null;

  try {
    const [balance, network] = await Promise.all([
      provider.getBalance(wallet.address),
      provider.getNetwork(),
    ]);

    return {
      address: wallet.address,
      balanceAvax: ethers.formatEther(balance),
      chainId: network.chainId,
    };
  } catch {
    return null;
  }
}

export function hashRecommendations(phones: RankedPhone[]): string {
  const content = phones
    .map((p) => `${p.rank}|${p.model}|${p.price}|${p.processor}`)
    .join("\n");
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function logRecommendationOnChain(
  requirements: import("../types/index").UserRequirements,
  phones: RankedPhone[]
): Promise<AvalancheLogEntry | null> {
  if (!wallet || !provider) return null;

  const requirementsHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(requirements))
    .digest("hex");

  const recommendationsHash = hashRecommendations(phones);
  const topModel = phones[0]?.model ?? "N/A";
  const timestamp = Date.now();

  // Encode the log data into the transaction's data field
  const logData = {
    version: "1.0",
    agent: "smartphone-ai-agent",
    timestamp,
    requirementsHash,
    recommendationsHash,
    topModel,
  };

  const dataHex = ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify(logData)));

  try {
    // Check balance first
    const balance = await provider.getBalance(wallet.address);
    const gasPrice = (await provider.getFeeData()).gasPrice ?? ethers.parseUnits("25", "gwei");
    const estimatedGas = BigInt(21000); // base ETH transfer
    const estimatedCost = estimatedGas * gasPrice;

    if (balance < estimatedCost) {
      console.warn(
        `  ⚠  Insufficient AVAX balance for on-chain logging.`,
        `\n     Balance: ${ethers.formatEther(balance)} AVAX`,
        `\n     Needed:  ~${ethers.formatEther(estimatedCost)} AVAX`
      );
      return null;
    }

    // Self-transfer with data (zero value)
    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0n,
      data: dataHex,
      gasLimit: 50000n,
    });

    console.log(`  ✅ On-chain log submitted: ${tx.hash}`);
    console.log(
      `     Explorer: https://snowtrace.io/tx/${tx.hash}`
    );

    // Wait for confirmation
    const receipt = await tx.wait(1);

    return {
      timestamp,
      requirementsHash,
      recommendationsHash,
      topModel,
      txHash: receipt?.hash,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠  On-chain logging failed: ${msg}`);
    return null;
  }
}

export function isAvalancheReady(): boolean {
  return wallet !== null && provider !== null;
}

export async function getNetworkInfo(): Promise<string> {
  if (!provider || !config) return "Not connected";
  try {
    const network = await provider.getNetwork();
    const chainName =
      network.chainId === 43114n
        ? "Avalanche Mainnet (C-Chain)"
        : network.chainId === 43113n
        ? "Avalanche Fuji Testnet"
        : `Chain ID ${network.chainId}`;
    return chainName;
  } catch {
    return "Connection failed";
  }
}
