import { getCoin, tradeCoin, setApiKey } from '@zoralabs/coins-sdk';
import { type WalletClient, type PublicClient } from 'viem';

// TODO: Set your API key if you have one
// setApiKey("your-api-key");

// Your platform referrer address - this is where platform fees will go
const PLATFORM_REFERRER = "0x575c8A992EC082f3650432dE77c1CbBCCf568200" as `0x${string}`;

// Default slippage tolerance (1%)
const DEFAULT_SLIPPAGE = 0.01;

export async function fetchCoinDetails(address: `0x${string}`, chainId = 8453) {
  try {
    const response = await getCoin({ address, chain: chainId });
    return response?.data?.zora20Token || null;
  } catch (error) {
    console.error("Error fetching coin details:", error);
    throw error;
  }
}

export async function executeTrade(
  direction: 'buy' | 'sell',
  targetCoinAddress: `0x${string}`,
  orderSize: bigint,
  recipient: `0x${string}`,
  walletClient: WalletClient, 
  publicClient: PublicClient,
  slippageTolerance = DEFAULT_SLIPPAGE
) {
  try {
    // Calculate minAmountOut based on slippage tolerance
    // For buys, we estimate we'll get 1 token per ETH at current price
    // For sells, we estimate we'll get 1 ETH per token at current price
    // These are rough estimates - in production you'd want to get the actual price from the pool
    const estimatedAmountOut = direction === 'buy' 
      ? orderSize // For buys, estimate tokens out
      : orderSize; // For sells, estimate ETH out
    
    const minAmountOut = estimatedAmountOut * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / 1000n;

    const result = await tradeCoin(
      {
        direction,
        target: targetCoinAddress,
        args: {
          recipient,
          orderSize,
          minAmountOut,
          tradeReferrer: PLATFORM_REFERRER,
        }
      }, 
      walletClient, 
      publicClient
    );
    
    return result;
  } catch (error) {
    console.error("Error executing trade:", error);
    throw error;
  }
} 