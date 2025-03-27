import { useState, useCallback } from 'react';
import { fetchCoinDetails, executeTrade, fetchOnchainCoinDetails } from '~/lib/zora';
import { useAccount, usePublicClient } from 'wagmi';
import { type WalletClient, type PublicClient } from 'viem';

export function useZoraCoin(coinAddress: `0x${string}`) {
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [onchainDetails, setOnchainDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { address } = useAccount();
  const publicClient = usePublicClient() as PublicClient;

  const getCoinInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Getting coin info with address:', address);
      
      const [details, onchainData] = await Promise.all([
        fetchCoinDetails(coinAddress),
        address ? fetchOnchainCoinDetails(coinAddress, address, publicClient) : null
      ]);
      
      console.log('Coin details:', details);
      console.log('Onchain data:', onchainData);
      
      setCoinDetails(details);
      setOnchainDetails(onchainData);
    } catch (err) {
      console.error('Error in getCoinInfo:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [coinAddress, address, publicClient]);

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
      
      // Refresh coin info after trade
      await getCoinInfo();
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [coinAddress, address, publicClient, getCoinInfo]);

  return {
    coinDetails,
    onchainDetails,
    isLoading,
    error,
    getCoinInfo,
    trade
  };
} 