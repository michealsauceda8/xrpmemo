# XRP Nexus Terminal - PRD

## Original Problem Statement
Build a complete, production-ready XRP-themed web application that functions as a non-custodial multi-chain wallet, swap terminal, and XRP on-ramp.

## User Choices
- XRP-first priority with full functionality
- Real API integration (with fallbacks)
- Sandbox keys for on-ramp providers
- Mainnet production-ready

## User Personas
1. **XRP Enthusiasts** - Want to manage XRP holdings with best-in-class experience
2. **Multi-Chain Traders** - Need to swap various tokens to XRP
3. **New Users** - Looking to buy XRP easily via on-ramp providers

## Core Requirements
- Non-custodial wallet with BIP39 seed phrase
- Multi-chain address derivation (XRP, ETH, SOL, BTC, etc.)
- Portfolio dashboard with price charts
- Swap functionality (any token → XRP)
- Buy XRP via MoonPay, Mercuryo, Transak

---

## What's Been Implemented (Feb 12, 2026)

### Phase 1: MVP Complete ✅

#### Landing Page
- Beautiful hero section with XRP branding
- Feature highlights (Non-Custodial, Lightning Fast, Multi-Chain, Swap to XRP)
- Stats section (8+ chains, 3-5s speed, $0.0001 fees)
- Call-to-action buttons for wallet creation/import

#### Wallet Management
- Create wallet with seed phrase generation
- Import wallet via seed phrase
- Password encryption for wallet security
- Multi-step creation flow with backup verification

#### Dashboard
- Total portfolio value display
- XRP price chart (7-day history)
- Asset cards for all supported chains
- Real-time price and balance updates

#### Wallet Page
- XRP-focused address display
- All chain addresses with expand/collapse
- Copy address functionality
- Receive modal with QR code
- Send modal (demo mode)

#### Swap Page
- Token selector for input tokens
- XRP-only destination (as requested)
- Quote fetching and display
- Swap execution (simulated)

#### Buy XRP Page
- Amount input with quick buttons
- Three providers: MoonPay, Mercuryo, Transak
- Fee comparison display
- Popup window integration

### Backend APIs
- /api/prices - Live crypto prices (with fallback)
- /api/prices/history/:coin - Price history for charts
- /api/balances/all - Multi-chain balance fetching
- /api/swap/quote - Swap quotes
- /api/swap/execute - Swap execution
- /api/onramp/config - On-ramp provider config

---

## Mocked/Simulated Features
1. **Balances** - Simulated, not fetching from real blockchain RPCs
2. **Swap Execution** - Price-based calculation, not real DEX integration
3. **Price Data** - Using fallback values when CoinGecko rate-limited

---

## P0/P1/P2 Features Remaining

### P0 - Critical (Not blocking MVP)
- None currently blocking

### P1 - Important
- [ ] Real blockchain RPC integration for balances
- [ ] Actual transaction signing and broadcasting
- [ ] Real DEX aggregator integration (1inch, Jupiter)
- [ ] Production API keys for on-ramp providers

### P2 - Nice to Have
- [ ] Dark/Light mode toggle
- [ ] Currency selector (USD, EUR, GBP)
- [ ] CSV Export of addresses/balances
- [ ] Testnet mode toggle
- [ ] Address book for saved recipients
- [ ] Transaction history from blockchain

---

## Technical Architecture

### Frontend
- React with Zustand state management
- Tailwind CSS + Framer Motion
- React Query for API calls
- QRCode generation for addresses

### Backend
- FastAPI with MongoDB
- CoinGecko API integration (with fallback)
- Simulated balance/swap endpoints

### Security
- Password-encrypted seed phrases
- Non-custodial (keys never sent to server)
- LocalStorage persistence with encryption

---

## Next Action Items
1. Implement real blockchain RPC calls for live balances
2. Add transaction signing for actual sends
3. Integrate real DEX APIs for swaps
4. Get production API keys for on-ramp providers
5. Add transaction history tracking
