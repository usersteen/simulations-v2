"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { Input } from "../components/ui/input";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk, {
  AddFrame,
  FrameNotificationDetails,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
  useWalletClient,
  useBalance,
} from "wagmi";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, degen, mainnet, optimism, unichain } from "wagmi/chains";
import { BaseError, UserRejectedRequestError, parseEther, formatEther } from "viem";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { useZoraCoin } from "~/components/hooks/useZoraCoin";
import { formatCurrency, formatNumber, parseZoraError } from "~/lib/utils";

// Add animation styles
const slideUpAnimation = `
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.animate-fade-out {
  animation: fadeOut 0.3s ease-out forwards;
}

.overlay-transition {
  transition: opacity 0.3s ease-in-out;
  opacity: 0;
}

.overlay-transition-active {
  opacity: 1;
}

.overlay-content-transition {
  transition: all 0.3s ease-in-out;
  transform: scale(0.95);
  opacity: 0;
}

.overlay-content-transition-active {
  transform: scale(1);
  opacity: 1;
}
`;

export default function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  // Add style tag to head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
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
          background: rgba(0, 0, 0, 0);
        }
        to {
          background: rgba(0, 0, 0, 0.8);
        }
      }

      @keyframes fadeOut {
        from {
          background: rgba(0, 0, 0, 0.8);
        }
        to {
          background: rgba(0, 0, 0, 0);
        }
      }

      @keyframes contentIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes contentOut {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.95);
        }
      }

      .slide-up {
        animation: slideUp 300ms ease-out forwards;
      }

      .slide-down {
        animation: slideDown 300ms ease-out forwards;
      }

      .overlay-backdrop {
        animation: fadeOut 300ms ease-out forwards;
      }

      .overlay-backdrop.active {
        animation: fadeIn 300ms ease-out forwards;
      }

      .overlay-content {
        animation: contentOut 300ms ease-out forwards;
      }

      .overlay-content.active {
        animation: contentIn 300ms ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<FrameNotificationDetails | null>(null);
  const [lastEvent, setLastEvent] = useState("");
  const [addFrameResult, setAddFrameResult] = useState("");
  const [sendNotificationResult, setSendNotificationResult] = useState("");
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

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const {
    signTypedData,
    error: signTypedError,
    isError: isSignTypedError,
    isPending: isSignTypedPending,
  } = useSignTypedData();

  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  const nextChain = useMemo(() => {
    if (chainId === base.id) {
      return optimism;
    } else if (chainId === optimism.id) {
      return degen;
    } else if (chainId === degen.id) {
      return mainnet;
    } else if (chainId === mainnet.id) {
      return unichain;
    } else {
      return base;
    }
  }, [chainId]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: nextChain.id });
  }, [switchChain, nextChain.id]);

  // Zora integration
  const targetCoinAddress = "0xdcb492364375a425547fedd3bbe66904994c6182" as `0x${string}`;
  const { data: walletClient } = useWalletClient();
  const {
    coinDetails,
    isLoading: isZoraLoading,
    error: zoraError,
    getCoinInfo,
    trade,
    onchainDetails
  } = useZoraCoin(targetCoinAddress);

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
      console.log('Media:', coinDetails.media);
    }
  }, [coinDetails]);

  const handleError = useCallback((error: any) => {
    console.error("Detailed error:", error);
    setError("Error!"); // Simple message for toast
    setIsErrorVisible(true);
    // Clear error after animation
    setTimeout(() => {
      setIsErrorVisible(false);
      setError(null);
    }, 3500); // Slightly longer than animation duration
  }, []);

  // Handle Zora errors
  useEffect(() => {
    if (zoraError) {
      handleError(zoraError);
    }
  }, [zoraError, handleError]);

  const handleSuccess = useCallback(() => {
    setSuccess("Success!");
    setIsSuccessVisible(true);
    // Clear success after animation
    setTimeout(() => {
      setIsSuccessVisible(false);
      setSuccess(null);
    }, 3500); // Slightly longer than animation duration
  }, []);

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
      handleError(error);
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
      handleError(error);
    }
  }, [walletClient, trade, getCoinInfo, sellAmount, handleError, handleSuccess]);

  const addToAmount = useCallback((amount: string) => {
    if (isBuyTab) {
      const currentAmount = parseFloat(buyAmount) || 0;
      const addAmount = amount === 'Max' ? (ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0) : parseFloat(amount);
      setBuyAmount((currentAmount + addAmount).toString());
    } else {
      const currentAmount = parseFloat(sellAmount) || 0;
      // For sell, onchainDetails.balance is already in wei, so we need to format it first
      const maxTokens = onchainDetails?.balance ? Number(formatEther(onchainDetails.balance)) : 0;
      const addAmount = amount === 'Max' 
        ? maxTokens 
        : (maxTokens * parseFloat(amount) / 100); // Convert percentage to actual token amount
      setSellAmount((currentAmount + addAmount).toString());
    }
  }, [buyAmount, sellAmount, isBuyTab, ethBalance, onchainDetails?.balance]);

  useEffect(() => {
    const load = async () => {
      try {
        const context = await sdk.context;
        setContext(context);
        
        if (context?.client) {
          setAdded(context.client.added);
          setNotificationDetails(context.client.notificationDetails ?? null);
        }

        sdk.on("frameAdded", ({ notificationDetails }) => {
          setLastEvent(
            `frameAdded${!!notificationDetails ? ", notifications enabled" : ""}`
          );

          setAdded(true);
          if (notificationDetails) {
            setNotificationDetails(notificationDetails);
          }
        });

        sdk.on("frameAddRejected", ({ reason }) => {
          setLastEvent(`frameAddRejected, reason ${reason}`);
        });

        sdk.on("frameRemoved", () => {
          setLastEvent("frameRemoved");
          setAdded(false);
          setNotificationDetails(null);
        });

        sdk.on("notificationsEnabled", ({ notificationDetails }) => {
          setLastEvent("notificationsEnabled");
          setNotificationDetails(notificationDetails);
        });
        
        sdk.on("notificationsDisabled", () => {
          setLastEvent("notificationsDisabled");
          setNotificationDetails(null);
        });

        sdk.on("primaryButtonClicked", () => {
          console.log("primaryButtonClicked");
        });

        console.log("Calling ready");
        sdk.actions.ready({});

        const store = createStore();
        store.subscribe((providerDetails) => {
          console.log("PROVIDER DETAILS", providerDetails);
        });
      } catch (error) {
        console.error("Error loading SDK:", error);
      }
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const openUrl = useCallback(() => {
    sdk.actions.openUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  }, []);

  const openWarpcastUrl = useCallback(() => {
    sdk.actions.openUrl("https://warpcast.com/~/compose");
  }, []);

  const close = useCallback(() => {
    sdk.actions.close();
  }, []);

  const addFrame = useCallback(async () => {
    try {
      setNotificationDetails(null);

      const result = await sdk.actions.addFrame();

      if (result.notificationDetails) {
        setNotificationDetails(result.notificationDetails);
      }
      setAddFrameResult(
        result.notificationDetails
          ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
          : "Added, got no notification details"
      );
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  const sendNotification = useCallback(async () => {
    setSendNotificationResult("");
    if (!notificationDetails || !context) {
      return;
    }

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        mode: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: context.user.fid,
          notificationDetails,
        }),
      });

      if (response.status === 200) {
        setSendNotificationResult("Success");
        return;
      } else if (response.status === 429) {
        setSendNotificationResult("Rate limited");
        return;
      }

      const data = await response.text();
      setSendNotificationResult(`Error: ${data}`);
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`);
    }
  }, [context, notificationDetails]);

  const sendTx = useCallback(() => {
    sendTransaction(
      {
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        data: "0x9846cd9efc000023c0",
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
      }
    );
  }, [sendTransaction]);

  const signTyped = useCallback(() => {
    signTypedData({
      domain: {
        name: "Frames v2 Demo",
        version: "1",
        chainId,
      },
      types: {
        Message: [{ name: "content", type: "string" }],
      },
      message: {
        content: "Hello from Frames v2!",
      },
      primaryType: "Message",
    });
  }, [chainId, signTypedData]);

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  const toggleOverlay = useCallback(() => {
    setIsOverlayVisible(prev => !prev);
  }, []);

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

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* Main Image */}
      {coinDetails?.mediaContent?.previewImage?.medium && (
        <div className="w-full h-full flex items-center justify-center" onClick={() => setIsOverlayVisible(true)}>
          <img 
            src={coinDetails.mediaContent.previewImage.medium} 
            alt={coinDetails.name}
            className="max-w-[600px] rotate-90 object-contain"
          />
        </div>
      )}

      {/* Overlay */}
      {isOverlayMounted && (
        <div 
          className={`fixed inset-0 flex items-center justify-center overlay-backdrop ${isOverlayActive ? 'active' : ''}`}
        >
          <div 
            className={`w-[424px] h-[695px] bg-black border-2 border-white overflow-hidden flex flex-col overlay-content ${isOverlayActive ? 'active' : ''}`}
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
              <div className="w-full p-4">
                {/* Token Icon */}
                {coinDetails?.mediaContent?.previewImage?.small && (
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 overflow-hidden">
                      <img 
                        src={coinDetails.mediaContent.previewImage.small} 
                        alt={coinDetails.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Token Info */}
                <div className="text-white space-y-2 mb-8 font-mono text-center">
                  <p className="text-xl">{coinDetails?.name} (${coinDetails?.symbol})</p>
                  <p className="mt-6 text-[13px]">mcap: {formatCurrency(coinDetails?.marketCap)} | vol: {formatCurrency(coinDetails?.totalVolume)}</p>
                  <p className="text-[13px]">holders: {formatNumber(coinDetails?.uniqueHolders)} | earnings: {formatCurrency(coinDetails?.creatorEarnings?.[0]?.amountUsd)}</p>
                </div>

                {/* Description */}
                <div className="text-white space-y-4 mb-8 font-mono text-[13px] text-center">
                  <p>
                    cover art for 'simulations,' a fungible art project about my relationship with screens.
                  </p>
                  <p>4k cc0.</p>
                  <p>
                    .15% of volume through this frame will buy/burn $sims via Splits Swapper.
                  </p>
                  <p>
                    full gallery soon.
                  </p>
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
            className={`w-full max-w-[424px] bg-black border-t-2 border-x-2 border-white overflow-hidden flex flex-col ${isTradeModalActive ? 'slide-up' : 'slide-down'}`}
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
                {isBuyTab 
                  ? `Your Balance: ${ethBalance ? `${formatEther(ethBalance.value)} ETH` : 'Loading...'}`
                  : `Your Balance: ${onchainDetails?.balance ? formatNumber(Number(formatEther(onchainDetails.balance)), 2) : '0'} ${coinDetails?.symbol || 'tokens'}`
                }
              </div>

              {isConnected ? (
                <div className="space-y-4">
                  <Input
                    type="text"
                    value={isBuyTab ? buyAmount : sellAmount}
                    onChange={(e) => isBuyTab ? setBuyAmount(e.target.value) : setSellAmount(e.target.value)}
                    placeholder={`${isBuyTab ? 'Buy' : 'Sell'} amount ${isBuyTab ? '(ETH)' : '(Tokens)'}`}
                    className="w-full bg-transparent text-white border-white/50 font-mono text-[13px] px-3 py-2 rounded-none"
                  />
                  
                  <div className="grid grid-cols-4 gap-2">
                    {isBuyTab ? (
                      <>
                        <button onClick={() => addToAmount('0.001')} className="text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors">0.001</button>
                        <button onClick={() => addToAmount('0.01')} className="text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors">0.01</button>
                        <button onClick={() => addToAmount('0.1')} className="text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors">0.1</button>
                        <button onClick={() => addToAmount('Max')} className="text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors">Max</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => addToAmount('25')} className="text-white border border-white/50 font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors">25%</button>
                        <button onClick={() => addToAmount('50')} className="text-white border border-white/50 font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors">50%</button>
                        <button onClick={() => addToAmount('75')} className="text-white border border-white/50 font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors">75%</button>
                        <button onClick={() => addToAmount('100')} className="text-white border border-white/50 font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors">100%</button>
                      </>
                    )}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      isBuyTab ? handleBuy() : handleSell();
                    }}
                    disabled={isZoraLoading || (isBuyTab ? !buyAmount : !sellAmount)}
                    className="w-full bg-transparent text-white border border-white font-mono text-[13px] py-2 hover:bg-white hover:text-black transition-colors disabled:opacity-50 mt-4"
                  >
                    {isBuyTab ? 'Buy' : 'Sell'}
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
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 bg-red-500 text-white rounded-lg font-mono text-base min-w-[200px] text-center shadow-lg ${isErrorVisible ? 'animate-slide-up' : 'animate-fade-out'} cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            setIsErrorVisible(false);
          }}
        >
          {error}
        </div>
      )}

      {/* Toast Success */}
      {isSuccessVisible && success && (
        <div 
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 bg-green-500 text-white rounded-lg font-mono text-base min-w-[200px] text-center shadow-lg ${isSuccessVisible ? 'animate-slide-up' : 'animate-fade-out'} cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            setIsSuccessVisible(false);
          }}
        >
          {success}
        </div>
      )}
    </div>
  );
}