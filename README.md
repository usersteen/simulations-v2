# 🖼️ Farcaster Frames v2 Project

A Farcaster Frames v2 implementation showcasing interactive frame capabilities.

## What are Farcaster Frames?

Farcaster Frames are interactive elements that can be embedded in Farcaster posts (casts). They allow users to interact with decentralized applications (dApps) directly within the Farcaster client. Frames v2 introduces enhanced capabilities including:

- Direct wallet interactions
- Rich user context
- Interactive UI elements
- Frame notifications
- External URL handling

## 🛠️ Core Components

### Frame SDK Integration
The project uses `@farcaster/frame-sdk` which provides:
- Frame context management
- Action handlers
- Wallet interactions
- Notification system

### Key Dependencies
```json
{
  "@farcaster/frame-sdk": "^0.0.31",
  "@farcaster/frame-wagmi-connector": "^0.0.19",
  "next": "15.0.3",
  "wagmi": "^2.14.12"
}
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── frames/            # Frame-specific routes
│   └── .well-known/       # Farcaster configuration
├── components/            # React components
└── lib/                   # Utility functions
```

## 🔑 Key Features

### 1. Frame Configuration
The frame configuration is defined in `.well-known/farcaster.json`:
- Version specification
- Frame metadata
- Button configurations
- Webhook endpoints

### 2. Context Handling
Frames receive context about:
- Current user (FID)
- Connected wallet
- Frame state
- User preferences

### 3. Action Handlers
The project implements various frame actions:
- `openUrl`: External link navigation
- `close`: Frame closure
- `addFrame`: Frame addition
- Wallet interactions (transactions, signatures)

### 4. Wallet Integration
Integrated wallet functionality via Wagmi:
- Wallet connection/disconnection
- Transaction handling
- Message signing
- Chain switching

## 📝 Implementation Examples

### Core Dependencies
```json
{
  "@farcaster/frame-sdk": "^0.0.31",
  "@farcaster/frame-wagmi-connector": "^0.0.19",
  "next": "15.0.3",
  "wagmi": "^2.14.12",
  "viem": "^2.0.0",
  "@heroicons/react": "^2.0.0",
  "tailwindcss": "^3.0.0"
}
```

### Basic Frame Setup
```typescript
import { useEffect, useState } from 'react';
import sdk, { type FrameContext } from '@farcaster/frame-sdk';

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();

  useEffect(() => {
    const load = async () => {
      setContext(await sdk.context);
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  // Your frame content here
}
```

### Wallet Integration
```typescript
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { config } from '~/components/providers/WagmiProvider';

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  return (
    <div>
      {address && (
        <div>Connected: {address}</div>
      )}
      <button
        onClick={() =>
          isConnected
            ? disconnect()
            : connect({ connector: config.connectors[0] })
        }
      >
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}
```

### Transaction Handling
```typescript
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';

export function TransactionComponent() {
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const { sendTransaction, isPending: isSendTxPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const sendTx = useCallback(() => {
    sendTransaction(
      {
        to: 'CONTRACT_ADDRESS',
        data: 'ENCODED_DATA',
      },
      {
        onSuccess: (hash) => setTxHash(hash),
      }
    );
  }, [sendTransaction]);

  return (
    <button 
      onClick={sendTx}
      disabled={isSendTxPending}
    >
      {isSendTxPending ? 'Sending...' : 'Send Transaction'}
    </button>
  );
}
```

### Message Signing
```typescript
import { useSignMessage, useSignTypedData } from 'wagmi';

export function SigningComponent() {
  const { signMessage } = useSignMessage();
  const { signTypedData } = useSignTypedData();

  const sign = () => {
    signMessage({ message: 'Hello from Frames v2!' });
  };

  const signTyped = () => {
    signTypedData({
      domain: {
        name: 'Frames v2 Demo',
        version: '1',
        chainId: 8453,
      },
      types: {
        Message: [{ name: 'content', type: 'string' }],
      },
      message: {
        content: 'Hello from Frames v2!',
      },
      primaryType: 'Message',
    });
  };

  return (
    <div>
      <button onClick={sign}>Sign Message</button>
      <button onClick={signTyped}>Sign Typed Data</button>
    </div>
  );
}
```

### ⚠️ Important Notes for Implementation

1. **Smart Contract Verification**
   - New smart contracts should be warmed up with transactions
   - Verify contracts with Blockaid to prevent Warpcast warnings

2. **Error Handling**
   - Implement proper error handling for all wallet interactions
   - Display user-friendly error messages
   - Handle transaction confirmation states

3. **Loading States**
   - Show loading indicators during transactions
   - Disable buttons during pending operations
   - Provide clear feedback on transaction status

4. **Best Practices**
   - Use typed data signing for structured data
   - Implement proper transaction receipt tracking
   - Handle wallet connection state changes

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

## 🔍 Frame Development Guidelines

1. **Frame Initialization**
```typescript
sdk.actions.ready();  // Signal frame readiness
```

2. **Context Access**
```typescript
const context = await sdk.context;  // Access frame context
```

3. **Action Implementation**
```typescript
// URL navigation
sdk.actions.openUrl(url);

// Frame closure
sdk.actions.close();

// Frame addition
const result = await sdk.actions.addFrame();
```

4. **Wallet Interactions**
```typescript
// Connect wallet
connect({ connector: config.connectors[0] });

// Send transaction
sendTransaction({ ... });
```

## 🪙 Zora Integration

### Overview
This project integrates Zora's Coins SDK with Farcaster Frames v2 to enable interactive token experiences directly within Farcaster clients. Users can create, trade, and interact with Zora tokens through frame interactions.

### Key Integration Points

1. **Token Creation**
```typescript
import { createCoin } from "@zoralabs/coins-sdk";

// Frame handler for coin creation
async function handleCreateCoin(frameContext) {
  const createCoinParams = {
    name: "FrameCoin",
    symbol: "FRAME",
    uri: "ipfs://metadata-uri",
    payoutRecipient: frameContext.walletAddress,
  };
  
  return createCoin(createCoinParams, walletClient, publicClient);
}
```

2. **Token Trading**
```typescript
import { tradeCoin } from "@zoralabs/coins-sdk";

// Frame handler for trading
async function handleTrade(frameContext) {
  const tradeParams = {
    direction: "buy",
    target: "0xTargetCoinAddress",
    args: {
      recipient: frameContext.walletAddress,
      orderSize: 1000n,
    },
  };
  
  return tradeCoin(tradeParams, walletClient, publicClient);
}
```

3. **Token Information Display**
```typescript
import { getCoin } from "@zoralabs/coins-sdk";

// Frame handler for displaying token info
async function handleTokenInfo(frameContext) {
  const tokenDetails = await getCoin({
    address: "0xTokenAddress",
    chain: 8453 // Base chain
  });
  
  return {
    image: tokenDetails.zora20Token?.media?.previewImage,
    title: tokenDetails.zora20Token?.name,
    description: tokenDetails.zora20Token?.description
  };
}
```

### Frame-Specific Features

1. **Interactive Token Creation**
   - Users can create new tokens directly through frame interactions
   - Metadata and parameters can be set via frame button actions
   - Automatic wallet connection handling

2. **Trading Interface**
   - Buy/sell functionality through frame buttons
   - Real-time price updates
   - Transaction status feedback

3. **Token Information Display**
   - Dynamic token metadata rendering
   - Price and market cap information
   - Trading volume statistics

### Best Practices

1. **Error Handling**
```typescript
try {
  const result = await handleTrade(frameContext);
  // Handle success
} catch (error) {
  if (error.code === 'user_rejected') {
    return {
      image: '/error.png',
      title: 'Transaction Cancelled',
      description: 'User rejected the transaction'
    };
  }
  // Handle other errors
}
```

2. **State Management**
   - Use frame state to track transaction progress
   - Implement proper loading states
   - Handle wallet connection status

3. **Security Considerations**
   - Validate all frame context data
   - Implement proper error boundaries
   - Handle wallet interactions securely

### Example Implementation

```typescript
import { createCoin, tradeCoin, getCoin } from "@zoralabs/coins-sdk";
import { useFrame } from "@farcaster/frame-sdk";

export function ZoraFrame() {
  const frame = useFrame();
  
  const handleFrameAction = async (action) => {
    switch (action.type) {
      case 'create_token':
        return handleCreateCoin(frame.context);
      case 'trade':
        return handleTrade(frame.context);
      case 'view_info':
        return handleTokenInfo(frame.context);
      default:
        return null;
    }
  };
  
  return (
    <Frame>
      {/* Frame UI components */}
    </Frame>
  );
}
```

## 📘 Zora SDK Documentation

### Overview
The `@zoralabs/coins-sdk` package is currently a prerelease SDK based on viem v2. It exposes functions for both direct blockchain interactions and API queries.

### Onchain Actions

These functions interact directly with the blockchain and require transaction signing:

#### 1. `createCoin`
Creates a new coin with the given parameters.

**Key Parameters:**
- `name`: The name of the new coin
- `symbol`: The symbol for the new coin
- `uri`: The URI for the coin metadata
- `owners`: An array of owner addresses (Optional)
- `payoutRecipient`: The address that will receive the payout
- `platformReferrer`: The referrer address for platform fees (Optional)
- `initialPurchaseWei`: The initial purchase amount in Wei (Optional)

#### 2. `tradeCoin`
Buys or sells an existing coin.

**Key Parameters:**
- `direction`: 'buy' or 'sell'
- `target`: Target coin contract address
- `args`:
  - `recipient`: Trade output recipient
  - `orderSize`: Order size
  - `minAmountOut`: Minimum output amount (Optional)
  - `sqrtPriceLimitX96`: Price limit (Optional)
  - `tradeReferrer`: Trade referrer address (Optional)

#### 3. `updateCoinURI`
Updates the URI for an existing coin.

**Key Parameters:**
- `coin`: Coin contract address
- `newURI`: New URI (must start with "ipfs://")

### API Queries

#### API Key Setup
```typescript
setApiKey("your-api-key");  // Higher rate limits with API key
```

#### Pagination Support
Many queries support cursor-based pagination:
```typescript
// First page
const firstPage = await getCoinsTopGainers({ count: 10 });
const nextCursor = firstPage.exploreList?.pageInfo?.endCursor;

// Next page
if (nextCursor) {
  const nextPage = await getCoinsTopGainers({
    count: 10,
    after: nextCursor
  });
}
```

#### Available Queries

1. **getCoin**: Get specific coin details
2. **getCoins**: Get multiple coins' details
3. **getCoinComments**: Get coin comments
4. **getProfile**: Get profile information
5. **getProfileOwned**: Get profile-owned coins
6. **getCoinsTopGainers**: Get top gaining coins
7. **getCoinsTopVolume24h**: Get highest 24h volume
8. **getCoinsMostValuable**: Get most valuable coins
9. **getCoinsNew**: Get newly created coins
10. **getCoinsLastTraded**: Get recently traded coins
11. **getCoinsLastTradedUnique**: Get unique recently traded coins

For detailed query parameters and return types, please refer to the [Zora SDK Documentation](https://docs.zora.co/docs/smart-contracts/zora-coins-sdk).

## 📚 Resources

- [Frame Playground](https://warpcast.com/~/developers/frame-playground)
- [Frame SDK Documentation](https://github.com/farcasterxyz/frames/)
- [Developer Preview Docs](https://github.com/farcasterxyz/frames/wiki/frames-v2-developer-playground-preview)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
