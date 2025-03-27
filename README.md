# 🖼️ Farcaster Frames v2 Project

A Farcaster Frames v2 implementation showcasing interactive frame capabilities with Zora integration.

## What are Farcaster Frames?

Farcaster Frames are interactive elements that can be embedded in Farcaster posts (casts). They allow users to interact with decentralized applications (dApps) directly within the Farcaster client. Frames v2 introduces enhanced capabilities including:

- Direct wallet interactions
- Rich user context
- Interactive UI elements
- Frame notifications
- External URL handling

## 🛠️ Core Components

### Frame SDK Integration
The project uses `@farcaster/frame-sdk` and related packages which provide:
- Frame context management
- Action handlers
- Wallet interactions
- Notification system

### Key Dependencies
```json
{
  "@farcaster/auth-kit": "^0.6.0",
  "@farcaster/frame-core": "^0.0.29",
  "@farcaster/frame-node": "^0.0.18",
  "@farcaster/frame-sdk": "^0.0.31",
  "@farcaster/frame-wagmi-connector": "^0.0.19",
  "@radix-ui/react-label": "^2.1.1",
  "@tanstack/react-query": "^5.61.0",
  "@upstash/redis": "^1.34.3",
  "@zoralabs/coins-sdk": "0.0.2-sdkalpha.7",
  "next": "15.0.3",
  "wagmi": "^2.14.12",
  "viem": "^2.23.6"
}
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── frames/            # Frame-specific routes
│   │   └── token/        # Token-specific frame routes
│   └── .well-known/      # Farcaster configuration
├── components/            # React components
│   ├── hooks/            # Custom React hooks
│   ├── providers/        # React context providers
│   └── ui/              # UI components
└── lib/                  # Utility functions
```

## 🔑 Current Features

### 1. Frame Configuration
- Frame metadata and routing in `src/app/frames/token/[chainId]/[address]/`
- OpenGraph image generation
- Token display and interaction

### 2. Zora Integration
Currently implemented features:
- Basic token information fetching
- Buy/Sell functionality
- Price impact protection
- Error handling

### 3. Wallet Integration
Implemented via Wagmi:
- Wallet connection/disconnection
- Transaction handling
- Chain switching
- Balance checking

### 4. UI Components
- Modern, responsive design
- Interactive trade modal
- Token information display
- Transaction status indicators

## 📝 Implementation Examples

### Zora Hook Implementation
```typescript
// src/components/hooks/useZoraCoin.ts
export function useZoraCoin(coinAddress: `0x${string}`) {
  const [coinDetails, setCoinDetails] = useState<any>(null);
  const [onchainDetails, setOnchainDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCoinInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [details, onchainData] = await Promise.all([
        fetchCoinDetails(coinAddress),
        address ? fetchOnchainCoinDetails(coinAddress, address, publicClient) : null
      ]);
      setCoinDetails(details);
      setOnchainDetails(onchainData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [coinAddress, address, publicClient]);

  // ... trade implementation
}
```

### Core Zora Functions
```typescript
// src/lib/zora.ts
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
    const minAmountOut = calculateMinAmountOut(direction, orderSize, slippageTolerance);
    return await tradeCoin(
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
  } catch (error) {
    console.error("Error executing trade:", error);
    throw error;
  }
}
```

## 🚀 Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Required variables:
- `NEXT_PUBLIC_URL`: Your app's public URL
- `KV_REST_API_TOKEN`: For notifications (optional)
- `KV_REST_API_URL`: For notifications (optional)

3. Run development server:
```bash
yarn dev
```

4. For testing with Warpcast:
- Use ngrok or similar for public access
- Visit the [Frame Playground](https://warpcast.com/~/developers/frame-playground)

## 🎯 Planned Features

### 1. Advanced State Management
- Implementation of a proper state machine
- More sophisticated state transitions
- Better transaction tracking

### 2. Enhanced Error Handling
- More specific error types
- Retry logic for failed requests
- Better error recovery strategies

### 3. Performance Optimizations
- Request batching
- Proper rate limiting
- Data prefetching
- Caching implementation

### 4. Testing Suite
- Unit tests for core functionality
- Integration tests for frame interactions
- End-to-end testing

### 5. Advanced Trading Features
- Limit orders
- Price feeds
- Advanced market analysis
- Token metadata management

## 📚 Resources

- [Frame Playground](https://warpcast.com/~/developers/frame-playground)
- [Frame SDK Documentation](https://github.com/farcasterxyz/frames/)
- [Developer Preview Docs](https://github.com/farcasterxyz/frames/wiki/frames-v2-developer-playground-preview)
- [Zora SDK Documentation](https://docs.zora.co/docs/smart-contracts/zora-coins-sdk)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
