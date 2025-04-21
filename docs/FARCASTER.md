# Farcaster Frame Integration

This document details how our application integrates with Farcaster Frames v2 and implements the authentication flow.

## Frame Implementation

Our app implements Farcaster Frames v2 which allows users to interact with the token trading interface directly within Farcaster clients. Key features include:

- Interactive UI elements for token trading
- Direct wallet interactions for transactions
- Frame notifications for trade updates
- Rich user context and authentication

## Authentication Flow (SIWF)

### Overview
Sign in with Farcaster (SIWF) is used to authenticate users and connect their wallets:

```typescript
import { sdk } from '@farcaster/frame-sdk'

// Request SIWF credentials
const signInResult = await sdk.actions.signIn({ 
  nonce: 'secure-random-nonce' // Generated on server
})

// Server verifies the signature and message
const { signature, message } = signInResult
```

### Implementation Details

1. **Initial Frame Load**:
   - Frame metadata is served with proper `fc:frame` meta tags
   - Initial state shows token information and trading options

2. **User Authentication**:
   - When user interacts (e.g., clicks trade button), SIWF flow initiates
   - Server generates secure nonce tied to session
   - Client requests SIWF credentials using Frame SDK
   - Server verifies signature and establishes session

3. **Wallet Connection**:
   - After SIWF verification, user's Ethereum wallet is connected
   - Wallet connection enables Zora SDK interactions
   - Transaction signing uses the connected wallet

## Frame Metadata

Our frames implement the required OpenGraph-inspired metadata:

```html
<meta name="fc:frame" content="{
  version: 'vNext',
  image: 'token-preview.png',
  buttons: [{
    label: 'Trade Token',
    action: 'post'
  }]
}" />
```

## Notifications

The app implements Frame notifications to keep users updated:

1. **Notification Setup**:
   - When user adds the frame, notifications are automatically enabled
   - Server receives webhook with notification token
   - Token is stored securely for future notifications

2. **Notification Triggers**:
   - Trade execution confirmations
   - Price alerts
   - Transaction status updates

## Reference

For full Farcaster Frame v2 specifications and features, see the [official documentation](https://docs.farcaster.xyz/reference/frames/spec).
