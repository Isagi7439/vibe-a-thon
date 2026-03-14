import axios, { AxiosInstance } from "axios";
import { ethers } from "ethers";
import { AgentConfig } from "../types/index";

// ─── x402 Integration ─────────────────────────────────────────────────────────
// The x402 protocol uses HTTP 402 "Payment Required" responses to trigger
// automatic micropayments. This module wraps axios with an interceptor that
// detects 402 responses and processes the payment challenge automatically.

let x402Client: AxiosInstance | null = null;
let agentConfig: AgentConfig | null = null;
let signer: ethers.Wallet | null = null;

export function initX402(cfg: AgentConfig): void {
  agentConfig = cfg;

  if (!cfg.x402Enabled) {
    x402Client = axios.create();
    return;
  }

  // Create base axios instance
  const instance = axios.create({
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "smartphone-ai-agent/1.0.0",
    },
  });

  // Initialize wallet signer if private key is available
  if (cfg.privateKey) {
    try {
      const provider = new ethers.JsonRpcProvider(cfg.avalancheRpc);
      signer = new ethers.Wallet(cfg.privateKey, provider);
    } catch {
      // No signer — x402 payments will be skipped
    }
  }

  // ── x402 Response Interceptor ──────────────────────────────────────────────
  // Intercepts HTTP 402 responses and attempts to process payment
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Only handle 402 Payment Required responses (x402 protocol)
      if (
        error.response?.status === 402 &&
        !originalRequest._x402Retried
      ) {
        originalRequest._x402Retried = true;

        const paymentRequired = error.response.headers["payment-required"] ||
          error.response.headers["x-payment-required"];

        if (paymentRequired && signer) {
          try {
            const paymentInfo = JSON.parse(paymentRequired);
            console.log(
              `  💳 x402 Payment Required — processing payment to ${paymentInfo.payTo}...`
            );

            // Build EIP-3009 authorization for USDC transfer (standard x402 flow)
            const paymentPayload = await buildX402Payment(paymentInfo, signer);

            // Retry original request with payment header
            originalRequest.headers["X-PAYMENT"] = JSON.stringify(paymentPayload);
            originalRequest.headers["X-PAYMENT-SIGNATURE"] =
              paymentPayload.signature;

            return instance(originalRequest);
          } catch (paymentError) {
            console.warn("  ⚠  x402 payment processing failed:", paymentError);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  x402Client = instance;
}

// ─── EIP-3009 Payment Builder ──────────────────────────────────────────────────
async function buildX402Payment(
  paymentInfo: {
    payTo: string;
    amount: string;
    token?: string;
    chainId?: number;
    nonce?: string;
    deadline?: number;
  },
  wallet: ethers.Wallet
): Promise<{
  from: string;
  to: string;
  amount: string;
  token: string;
  nonce: string;
  deadline: number;
  signature: string;
}> {
  const deadline =
    paymentInfo.deadline ?? Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const nonce =
    paymentInfo.nonce ?? ethers.hexlify(ethers.randomBytes(32));
  const token =
    paymentInfo.token ?? "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6"; // USDC on Avalanche

  // EIP-712 domain for USDC (Avalanche C-Chain)
  const domain = {
    name: "USD Coin",
    version: "2",
    chainId: paymentInfo.chainId ?? 43114,
    verifyingContract: token,
  };

  // EIP-3009 TransferWithAuthorization types
  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const value = {
    from: wallet.address,
    to: paymentInfo.payTo,
    value: BigInt(paymentInfo.amount),
    validAfter: 0n,
    validBefore: BigInt(deadline),
    nonce,
  };

  const signature = await wallet.signTypedData(domain, types, value);

  return {
    from: wallet.address,
    to: paymentInfo.payTo,
    amount: paymentInfo.amount,
    token,
    nonce,
    deadline,
    signature,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────
export function getX402Client(): AxiosInstance {
  if (!x402Client) {
    // Return plain axios if not initialized
    return axios.create();
  }
  return x402Client;
}

export function isX402Enabled(): boolean {
  return agentConfig?.x402Enabled ?? false;
}

export function getX402SignerAddress(): string | null {
  return signer?.address ?? null;
}
