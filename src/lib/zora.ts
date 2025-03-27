import { getCoin, tradeCoin, setApiKey, getOnchainCoinDetails as getZoraOnchainCoinDetails, type OnchainCoinDetails } from '@zoralabs/coins-sdk';
import { type WalletClient, type PublicClient } from 'viem';

// Re-export the type from the SDK
export type { OnchainCoinDetails } from '@zoralabs/coins-sdk';

// TODO: Set your API key if you have one
// setApiKey("your-api-key");

// Your platform referrer address - this is where platform fees will go
const PLATFORM_REFERRER = "0x904AC5620dcEa44bC620a55B787b784C489b4cd1" as `0x${string}`;

// Default slippage tolerance (2.5%)
const DEFAULT_SLIPPAGE = 0.025;

export async function fetchCoinDetails(address: `0x${string}`, chainId = 8453) {
  try {
    const response = await getCoin({ address, chain: chainId });
    return response?.data?.zora20Token || null;
  } catch (error) {
    console.error("Error fetching coin details:", error);
    throw error;
  }
}

export async function fetchOnchainCoinDetails(
  address: `0x${string}`,
  userAddress: `0x${string}` | undefined,
  publicClient: PublicClient,
  chainId = 8453
): Promise<OnchainCoinDetails> {
  try {
    console.log('Fetching onchain details for:', {
      coin: address,
      user: userAddress,
      chainId
    });
    
    const response = await getZoraOnchainCoinDetails({
      coin: address,
      user: userAddress,
      publicClient
    });
    
    console.log('Onchain details response:', response);
    return response;
  } catch (error) {
    console.error("Error fetching onchain coin details:", error);
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
    // For buys: Calculate minAmountOut based on input ETH with slippage
    // For sells: Use very small minimum ETH amount to accommodate any sell size
    // 0.000001 ETH = 1000000000000 wei (should work for even tiny sells)
    const minAmountOut = direction === 'sell'
      ? BigInt('1000000000000') // 0.000001 ETH minimum for sells
      : orderSize * BigInt(Math.floor((1 - slippageTolerance) * 1000)) / 1000n;

    console.log('Trade parameters:', {
      direction,
      orderSize: orderSize.toString(),
      minAmountOut: minAmountOut.toString(),
      slippageTolerance,
      recipient,
      tradeReferrer: PLATFORM_REFERRER
    });

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