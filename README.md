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

## ⚠️ Important Notes

1. **Security Considerations**
- Frame context data in v2 preview is unauthenticated
- Implement proper validation for production use
- Handle wallet interactions securely

2. **Best Practices**
- Always call `ready()` when frame is initialized
- Handle errors gracefully
- Implement proper loading states
- Follow Farcaster's frame guidelines

## 📚 Resources

- [Frame Playground](https://warpcast.com/~/developers/frame-playground)
- [Frame SDK Documentation](https://github.com/farcasterxyz/frames/)
- [Developer Preview Docs](https://github.com/farcasterxyz/frames/wiki/frames-v2-developer-playground-preview)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
