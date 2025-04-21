import { useState, useCallback } from 'react';
import { fetchCoinDetails, executeTrade, fetchOnchainCoinDetails } from '~/lib/zora';
import { useAccount, usePublicClient } from 'wagmi';
import { type WalletClient, type PublicClient } from 'viem';
import { type OnchainCoinDetails } from '@zoralabs/coins-sdk';

// Raw API response type
interface ZoraApiResponse {
  name?: string;
  symbol?: string;
  description?: string;
  marketCap?: string | number;
  totalVolume?: string | number;
  volume24h?: string | number;
  uniqueHolders?: string | number;
  creatorEarnings?: Array<{
    amount?: {
      amountRaw?: string;
    };
    amountUsd?: string;
  }>;
  mediaContent?: {
    previewImage?: {
      small: string;
      medium: string;
      large?: string;
      blurhash?: string;
    };
    animation?: {
      url?: string;
      mimeType?: string;
    };
  };
  address?: string;
}

// Our required interface
interface CoinDetails {
  name: string;
  symbol: string;
  description?: string;
  marketCap: number;
  totalVolume: number;
  volume24h: number;
  uniqueHolders: number;
  creatorEarnings: Array<{
    amountUsd: number;
    amountRaw: string;
  }>;
  mediaContent?: {
    previewImage?: {
      small: string;
      medium: string;
      large?: string;
      blurhash?: string;
    };
    animation?: {
      url?: string;
      mimeType?: string;
    };
  };
  address: string;
}

// Type guard and converter
function convertToCoinDetails(data: ZoraApiResponse | null): CoinDetails | null {
  if (!data || !data.name || !data.symbol || !data.address) return null;

  // Convert string numbers to actual numbers
  const marketCap = typeof data.marketCap === 'string' ? parseFloat(data.marketCap) : data.marketCap;
  const totalVolume = typeof data.totalVolume === 'string' ? parseFloat(data.totalVolume) : data.totalVolume;
  const volume24h = typeof data.volume24h === 'string' ? parseFloat(data.volume24h) : data.volume24h ?? 0;
  const uniqueHolders = typeof data.uniqueHolders === 'string' ? parseInt(data.uniqueHolders) : data.uniqueHolders ?? 0;

  if (
    typeof marketCap !== 'number' ||
    typeof totalVolume !== 'number'
  ) {
    return null;
  }

  // Convert creator earnings
  const creatorEarnings = data.creatorEarnings?.map(earning => ({
    amountUsd: parseFloat(earning.amountUsd || '0'),
    amountRaw: earning.amount?.amountRaw || '0'
  })) || [];

  // Create a new object that matches our CoinDetails interface
  return {
    name: data.name,
    symbol: data.symbol,
    address: data.address,
    description: data.description,
    marketCap,
    totalVolume,
    volume24h,
    uniqueHolders,
    creatorEarnings,
    mediaContent: data.mediaContent
  };
}

interface UseZoraCoinReturn {
  coinDetails: CoinDetails | null;
  onchainDetails: OnchainCoinDetails | null;
  isLoading: boolean;
  error: Error | null;
  getCoinInfo: () => Promise<void>;
  trade: (direction: 'buy' | 'sell', orderSize: bigint, walletClient: WalletClient) => Promise<unknown>;
}

export function useZoraCoin(coinAddress: `0x${string}`): UseZoraCoinReturn {
  const [coinDetails, setCoinDetails] = useState<CoinDetails | null>(null);
  const [onchainDetails, setOnchainDetails] = useState<OnchainCoinDetails | null>(null);
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
      
      const convertedDetails = convertToCoinDetails(details);
      if (convertedDetails) {
        setCoinDetails(convertedDetails);
      } else {
        console.error('Invalid coin details format:', details);
        setError(new Error('Invalid coin details format'));
      }
      setOnchainDetails(onchainData);
    } catch (err) {
      console.error('Error in getCoinInfo:', err);
      // Don't set error state for rate limit errors
      if (err instanceof Error && err.message.includes('rate limit')) {
        console.log('Rate limit error, ignoring:', err);
      } else {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
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
      try {
        await getCoinInfo();
      } catch (refreshError) {
        // Silently handle rate limit errors during refresh
        console.log('Info refresh failed:', refreshError);
      }
      
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