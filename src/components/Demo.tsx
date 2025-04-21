"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import Image from "next/image";
import { Input } from "../components/ui/input";
import sdk from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useConnect,
  useWalletClient,
  useBalance,
} from "wagmi";
import { AddFrameButton } from "../components/ui/AddFrameButton";

import { config } from "~/components/providers/WagmiProvider";
import { parseEther, formatEther } from "viem";
import { useZoraCoin } from "~/components/hooks/useZoraCoin";
import { formatCurrency, formatNumber } from "~/lib/utils";

// Add animation styles
const styles = `
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    background: rgba(0, 0, 0, 0);
  }
  to {
    opacity: 1;
    background: rgba(0, 0, 0, 0.8);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    background: rgba(0, 0, 0, 0.8);
  }
  to {
    opacity: 0;
    background: rgba(0, 0, 0, 0);
  }
}

.animate-slide-up {
  animation: slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-slide-down {
  animation: slideDown 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-fade-in {
  animation: fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-fade-out {
  animation: fadeOut 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
`;

export default function Demo() {
  // Add style tag to head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [sellAmount, setSellAmount] = useState<string>('');
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isTradeVisible, setIsTradeVisible] = useState(false);
  const [isBuyTab, setIsBuyTab] = useState(true);
  const [isOverlayMounted, setIsOverlayMounted] = useState(false);
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [isTradeModalMounted, setIsTradeModalMounted] = useState(false);
  const [isTradeModalActive, setIsTradeModalActive] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { data: walletClient } = useWalletClient();

  // Zora integration
  const targetCoinAddress = "0xdcb492364375a425547fedd3bbe66904994c6182" as `0x${string}`;
  const {
    coinDetails,
    onchainDetails,
    isLoading: isZoraLoading,
    error: zoraError,
    trade,
    getCoinInfo
  } = useZoraCoin(targetCoinAddress);

  // Error and success handling
  const handleError = useCallback((message: string) => {
    setError(message);
    setIsErrorVisible(true);
    setTimeout(() => setIsErrorVisible(false), 5000);
  }, []);

  const handleSuccess = useCallback(() => {
    setSuccess("Transaction successful!");
    setIsSuccessVisible(true);
    setTimeout(() => setIsSuccessVisible(false), 5000);
  }, []);

  // Buy and sell handlers
  const handleBuy = useCallback(async () => {
    if (!walletClient || !buyAmount) return;
    try {
      const amountInWei = parseEther(buyAmount);
      await trade('buy', amountInWei, walletClient);
      setBuyAmount('');
      getCoinInfo();
      handleSuccess();
    } catch (error) {
      console.error("Error buying coin:", error);
      handleError("Error buying coin");
    }
  }, [walletClient, trade, getCoinInfo, buyAmount, handleError, handleSuccess]);

  const handleSell = useCallback(async () => {
    if (!walletClient || !sellAmount) return;
    try {
      const amount = parseEther(sellAmount);
      await trade('sell', amount, walletClient);
      setSellAmount('');
      getCoinInfo();
      handleSuccess();
    } catch (error) {
      console.error("Error selling coin:", error);
      handleError("Error selling coin");
    }
  }, [walletClient, trade, getCoinInfo, sellAmount, handleError, handleSuccess]);

  // Add new handlers for preset amounts
  const handlePresetBuy = useCallback((amount: string) => {
    const currentAmount = buyAmount ? parseFloat(buyAmount) : 0;
    const newAmount = currentAmount + parseFloat(amount);
    setBuyAmount(newAmount.toString());
  }, [buyAmount]);

  const handlePresetSell = useCallback((percentage: number) => {
    if (!onchainDetails?.balance) return;
    const balance = Number(formatEther(onchainDetails.balance));
    const amount = (balance * percentage) / 100;
    setSellAmount(amount.toString());
  }, [onchainDetails?.balance]);

  // Transaction handling
  const handleTransaction = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBuyTab) {
      handleBuy();
    } else {
      handleSell();
    }
  }, [isBuyTab, handleBuy, handleSell]);

  const { data: hash } = useSendTransaction({
    mutation: {
      onError: (error) => {
        handleError(error.message || 'Transaction failed');
      },
      onSuccess: () => {
        handleSuccess();
      }
    }
  });

  useWaitForTransactionReceipt({
    hash,
    onReplaced: () => handleSuccess()
  });

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address as `0x${string}`,
  });

  // Load coin info when component mounts
  useEffect(() => {
    getCoinInfo();
  }, [getCoinInfo]);

  // Debug coin details
  useEffect(() => {
    if (coinDetails) {
      console.log('Coin Details:', coinDetails);
    }
  }, [coinDetails]);

  // Effect to handle Zora errors
  useEffect(() => {
    if (zoraError) {
      handleError(zoraError.message || "Error with Zora integration");
    }
  }, [zoraError, handleError]);

  // Format balance display
  const formattedBalance = useMemo(() => {
    if (!onchainDetails?.balance) return "0";
    return formatNumber(Number(formatEther(onchainDetails.balance)));
  }, [onchainDetails]);

  // Format price display
  const formattedPrice = useMemo(() => {
    if (!coinDetails?.totalVolume) return "0";
    return formatCurrency(coinDetails.totalVolume);
  }, [coinDetails]);

  // Format market cap display
  const formattedMarketCap = useMemo(() => {
    if (!coinDetails?.marketCap) return "0";
    return formatCurrency(coinDetails.marketCap);
  }, [coinDetails]);

  // Display balance
  const displayBalance = useMemo(() => {
    if (isBuyTab) {
      return ethBalance ? `Balance: ${Number(formatEther(ethBalance.value)).toFixed(6)} ETH` : 'Loading...';
    } else {
      return `Balance: ${onchainDetails?.balance ? formattedBalance : '0'} SIMS`;
    }
  }, [isBuyTab, ethBalance, onchainDetails?.balance, formattedBalance]);

  const toggleTrade = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTradeVisible(prev => !prev);
  }, []);

  // Handle overlay transitions
  useEffect(() => {
    if (isOverlayVisible) {
      setIsOverlayMounted(true);
      requestAnimationFrame(() => {
        setIsOverlayActive(true);
      });
    } else {
      setIsOverlayActive(false);
      const timer = setTimeout(() => {
        setIsOverlayMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOverlayVisible]);

  // Handle trade modal transitions
  useEffect(() => {
    if (isTradeVisible) {
      setIsTradeModalMounted(true);
      requestAnimationFrame(() => {
        setIsTradeModalActive(true);
      });
    } else {
      setIsTradeModalActive(false);
      const timer = setTimeout(() => {
        setIsTradeModalMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTradeVisible]);

  // Pulse animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Effect to initialize SDK
  useEffect(() => {
    const load = async () => {
      try {
        sdk.actions.ready({});
      } catch (error) {
        handleError(error instanceof Error ? error.message : "Failed to load SDK");
      }
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded, handleError]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* Main Image */}
      {coinDetails?.mediaContent?.previewImage?.medium && (
        <div 
          className="w-full h-full flex items-center justify-center" 
          onClick={() => setIsOverlayVisible(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsOverlayVisible(true);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div 
            className="transition-transform duration-1000 border-2 border-white"
            style={{ transform: `scale(${isPulsing ? 1.02 : 1}) rotate(90deg)` }}
          >
            <Image 
              src={coinDetails.mediaContent.previewImage.medium} 
              alt={coinDetails.name || 'Token Image'}
              width={600}
              height={600}
              className="max-w-[600px] object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOverlayMounted && (
        <div 
          className={`fixed inset-0 bg-black/80 flex items-center justify-center ${
            isOverlayActive ? 'animate-fade-in' : 'animate-fade-out'
          }`}
          onClick={() => setIsOverlayVisible(false)}
        >
          <div 
            className={`w-[424px] h-[695px] bg-black border-2 border-white overflow-hidden flex flex-col ${
              isOverlayActive ? 'animate-slide-up' : 'animate-slide-down'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* URL and Close Button */}
            <div className="flex justify-between items-stretch border-b-2 border-white h-16">
              <div className="text-white font-mono text-[13px] p-4 flex items-center">
                usersteen.eth/simulations/sims
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOverlayVisible(false);
                }}
                className="text-white text-lg leading-none w-16 border-l-2 border-white hover:bg-white hover:text-black transition-colors flex items-center justify-center"
              >
                —
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto flex items-center">
              <div className="w-full py-16 px-4">
                {/* Token Icon */}
                {coinDetails?.mediaContent?.previewImage?.medium && (
                  <div className="flex justify-center mb-8">
                    <div className="relative w-[500px] h-[500px]">
                      <Image
                        src={coinDetails.mediaContent.previewImage.medium}
                        alt={coinDetails.name || 'Token Image'}
                        fill
                        sizes="(max-width: 500px) 100vw, 500px"
                        className="rounded-lg object-cover"
                        priority
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {/* Token Info */}
                <div className="text-white space-y-2 mb-10 font-mono text-center">
                  <p className="text-xl mb-6">{coinDetails?.name} (${coinDetails?.symbol})</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-gray-800 p-3 flex items-center justify-between">
                      <div className="text-gray-500 text-[11px]">mcap</div>
                      <div className="text-[13px]">{formattedMarketCap}</div>
                    </div>
                    <div className="border border-gray-800 p-3 flex items-center justify-between">
                      <div className="text-gray-500 text-[11px]">holders</div>
                      <div className="text-[13px]">{coinDetails?.uniqueHolders}</div>
                    </div>
                    <div className="border border-gray-800 p-3 flex items-center justify-between">
                      <div className="text-gray-500 text-[11px]">vol</div>
                      <div className="text-[13px]">{formattedPrice}</div>
                    </div>
                    <div className="border border-gray-800 p-3 flex items-center justify-between">
                      <div className="text-gray-500 text-[11px]">24hr vol</div>
                      <div className="text-[13px]">{formatCurrency(coinDetails?.volume24h)}</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="text-white space-y-4 mb-10 font-mono text-[13px] text-center">
                  <p>
                    cover art for &apos;simulations,&apos; a fungible art project about my relationship with screens. 4k cc0.</p>
                  <p>
                    .15% of volume through this frame will buy/burn $sims via Splits Swapper.
                  </p>
                  <p>
                    full gallery soon. add frame for notis.
                  </p>
                </div>

                {/* Add Frame Button */}
                <div className="mb-0">
                  <AddFrameButton 
                    onSuccess={(notificationDetails) => {
                      if (notificationDetails) {
                        console.log('Frame added with notifications:', notificationDetails);
                      }
                      handleSuccess();
                    }}
                    onError={handleError}
                  />
                </div>
              </div>
            </div>

            {/* Sticky Trade Button */}
            <div className="border-t-2 border-white">
              <button 
                onClick={toggleTrade}
                className="w-full bg-transparent text-white font-mono text-[13px] h-16 hover:bg-white hover:text-black transition-colors"
              >
                trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trading Interface */}
      {isTradeModalMounted && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setIsTradeVisible(false);
          }}
        >
          <div 
            className={`w-full max-w-[424px] bg-black border-t-2 border-x-2 border-white overflow-hidden flex flex-col ${
              isTradeModalActive ? 'animate-slide-up' : 'animate-slide-down'
            }`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="flex justify-between items-stretch border-b-2 border-white h-16">
              <div className="flex items-stretch flex-1">
                <button 
                  onClick={() => setIsBuyTab(true)}
                  className={`font-mono text-[13px] flex-1 flex items-center justify-center border-r-2 border-white ${isBuyTab ? 'text-black bg-white' : 'text-white hover: bg-black hover:text-black hover:bg-white'} transition-colors`}
                >
                  Buy
                </button>
                <button 
                  onClick={() => setIsBuyTab(false)}
                  className={`font-mono text-[13px] flex-1 flex items-center justify-center ${!isBuyTab ? 'text-black bg-white' : 'text-white hover:text-black hover:bg-white'} transition-colors`}
                >
                  Sell
                </button>
              </div>
              <button 
                onClick={() => setIsTradeVisible(false)}
                className="text-white text-2xl leading-none w-16 border-l-2 border-white hover:bg-white hover:text-black transition-colors flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="text-white font-mono text-[13px] mb-4">
                {displayBalance}
              </div>

              {isConnected ? (
                <div className="space-y-4">
                  <Input
                    type="number"
                    placeholder={isBuyTab ? "Enter ETH amount" : "Enter sims amount"}
                    value={isBuyTab ? buyAmount : sellAmount}
                    onChange={(e) => isBuyTab ? setBuyAmount(e.target.value) : setSellAmount(e.target.value)}
                    className="bg-transparent text-white border-white font-mono text-[13px] rounded-none"
                  />
                  
                  {/* Preset Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {isBuyTab ? (
                      <>
                        <button
                          onClick={() => handlePresetBuy("0.001")}
                          className="bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                        >
                          +0.001 ETH
                        </button>
                        <button
                          onClick={() => handlePresetBuy("0.01")}
                          className="bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                        >
                          +0.01 ETH
                        </button>
                        <button
                          onClick={() => handlePresetBuy("0.1")}
                          className="bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                        >
                          +0.1 ETH
                        </button>
                        <button
                          onClick={() => handlePresetBuy("0.5")}
                          className="bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                        >
                          +0.5 ETH
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handlePresetSell(25)}
                          className="bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                        >
                          25%
                        </button>
                        <button
                          onClick={() => handlePresetSell(50)}
                          className="bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                        >
                          50%
                        </button>
                        <button
                          onClick={() => handlePresetSell(75)}
                          className="bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                        >
                          75%
                        </button>
                        <button
                          onClick={() => handlePresetSell(100)}
                          className="bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                        >
                          100%
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleTransaction}
                    className="w-full bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                  >
                    {isBuyTab ? "Buy SIMS" : "Sell SIMS"}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    connect({ connector: config.connectors[0] });
                  }}
                  className="w-full bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isZoraLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white font-mono text-[13px]">Loading...</div>
        </div>
      )}

      {/* Toast Error */}
      {isErrorVisible && error && (
        <div 
          className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none`}
        >
          <div 
            className={`p-4 bg-red-500 text-white rounded-lg font-mono text-base min-w-[200px] text-center shadow-lg ${
              isErrorVisible ? 'animate-slide-up' : 'animate-fade-out'
            } pointer-events-auto cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              setIsErrorVisible(false);
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* Toast Success */}
      {isSuccessVisible && success && (
        <div 
          className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none`}
        >
          <div 
            className={`p-4 bg-green-500 text-white rounded-lg font-mono text-base min-w-[200px] text-center shadow-lg ${
              isSuccessVisible ? 'animate-slide-up' : 'animate-fade-out'
            } pointer-events-auto cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              setIsSuccessVisible(false);
            }}
          >
            {success}
          </div>
        </div>
      )}
    </div>
  );
}