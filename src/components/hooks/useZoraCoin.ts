import { useState, useCallback } from 'react';
import { fetchCoinDetails, executeTrade } from '~/lib/zora';
import { useAccount, usePublicClient } from 'wagmi';
import { type WalletClient } from 'viem';

export function useZoraCoin(coinAddress: `0x${string}`) {
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const getCoinInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const details = await fetchCoinDetails(coinAddress);
      setCoinDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [coinAddress]);

  const trade = useCallback(async (
    direction: 'buy' | 'sell',
    orderSize: bigint,
    walletClient: WalletClient
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await executeTrade(
        direction,
        coinAddress,
        orderSize,
        address,
        walletClient,
        publicClient
      );
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [coinAddress, address, publicClient]);

  return {
    coinDetails,
    isLoading,
    error,
    getCoinInfo,
    trade
  };
} 