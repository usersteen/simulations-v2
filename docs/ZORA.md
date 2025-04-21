# Zora SDK Integration

This document details how our application integrates with Zora's SDK for token trading functionality.

## Overview

The app uses Zora's SDK to enable token trading directly within Farcaster frames. The integration provides:
- Token information and pricing
- Buy/Sell functionality
- Price impact protection
- Transaction management

## Latest SDK Implementation

### Installation

```bash
npm install @zoralabs/coins-sdk viem
```

### SDK Setup

```typescript
import { getCoin, getCoins, executeTrade } from '@zoralabs/coins-sdk'
import { base } from 'viem/chains'

// Configuration is now per-function instead of SDK instance
const chainId = base.id // Base chain is default
```

### Token Operations

1. **Fetching Single Token**:
```typescript
const response = await getCoin({
  address: tokenAddress,
  chain: base.id // Optional: Base chain by default
})

const coin = response.data?.zora20Token
if (coin) {
  console.log('Token Info:', {
    name: coin.name,
    symbol: coin.symbol,
    marketCap: coin.marketCap,
    volume24h: coin.volume24h,
    uniqueHolders: coin.uniqueHolders,
    // Enhanced media content with optimized images
    mediaContent: {
      previewImage: {
        small: coin.mediaContent?.previewImage?.small,
        medium: coin.mediaContent?.previewImage?.medium,
        large: coin.mediaContent?.previewImage?.large,
        blurhash: coin.mediaContent?.previewImage?.blurhash // For loading optimization
      },
      animation: coin.mediaContent?.animation
    }
  })
}
```

2. **Fetching Multiple Tokens**:
```typescript
const response = await getCoins({
  coins: [
    { chainId: base.id, collectionAddress: tokenAddress1 },
    { chainId: base.id, collectionAddress: tokenAddress2 }
  ]
})
```

3. **Trade Execution**:
```typescript
const tx = await tradeCoin(
  {
    direction: 'buy' | 'sell',
    target: tokenAddress,
    args: {
      recipient: userAddress,
      orderSize: BigInt(amount),
      minAmountOut: calculateMinAmountOut(direction, amount, slippageTolerance),
      tradeReferrer: PLATFORM_REFERRER
    }
  },
  walletClient,
  publicClient
)
```

## Integration with Farcaster Auth

The Zora SDK is initialized with the wallet connection established through the Farcaster authentication flow:

1. User authenticates with SIWF
2. Connected wallet is used for Zora SDK initialization
3. All transactions are signed by the authenticated wallet

## Error Handling

The integration implements comprehensive error handling:

- Price impact protection
- Transaction failure recovery
- Network error handling
- Balance validation

## Transaction Flow

1. **Pre-trade Checks**:
   - Validate user balance
   - Check price impact
   - Verify slippage tolerance

2. **Trade Execution**:
   - Submit transaction
   - Monitor status
   - Handle confirmation/failure

3. **Post-trade Actions**:
   - Update UI
   - Send frame notification
   - Update trade history

## Reference

For complete Zora SDK documentation, see the [official documentation](https://docs.zora.co/docs/smart-contracts/coins/overview).
