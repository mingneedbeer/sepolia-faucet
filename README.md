# Sepolia Faucet

A self-hosted [Sepolia](https://sepolia.etherscan.io/) ETH faucet with donation support, built with Next.js and [viem](https://viem.sh/).

## Features

- **Claim Sepolia ETH** — Enter your wallet address to receive free testnet ETH
- **24h per-address cooldown** — Each address can claim once per day
- **Global daily cap** — Prevents the faucet from being drained (default 0.5 ETH/day)
- **Donation support** — Users can donate Sepolia ETH to keep the faucet funded
- **Etherscan integration** — Click through to view transactions on Sepolia Etherscan

## How it works

```
User → Web UI → POST /api/faucet/claim → viem walletClient.sendTransaction → Sepolia
```

1. User enters a wallet address on the page
2. Request hits the `POST /api/faucet/claim` API route
3. Server validates the address, checks both rate limits (per-address + global daily cap)
4. If allowed, the server sends 0.01 Sepolia ETH using the faucet wallet's private key
5. The transaction hash is returned and displayed with an Etherscan link

The `GET /api/faucet/info` endpoint returns the faucet address and current balance.

## Getting Started

### Prerequisites

- Node.js 18+
- A Sepolia wallet with some ETH (use a bridge or another faucet to fund it)

### Setup

```bash
git clone <your-repo-url>
cd sepolia-faucet
cp .env.example .env.local
```

Edit `.env.local` and set your faucet wallet's private key:

```
FAUCET_PRIVATE_KEY=0x...
FAUCET_AMOUNT=0.01
RPC_URL=https://ethereum-sepolia.publicnode.com
DAILY_CAP=0.02
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `FAUCET_PRIVATE_KEY` | — | Private key of the faucet wallet (with Sepolia ETH) |
| `FAUCET_AMOUNT` | `0.01` | ETH amount sent per claim |
| `RPC_URL` | `https://ethereum-sepolia.publicnode.com` | Sepolia RPC endpoint |
| `DAILY_CAP` | `0.5` | Global daily dispense limit (ETH) |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add the environment variables above (especially `FAUCET_PRIVATE_KEY`)

Or via the CLI:

```bash
vc --yes
vc --prod --yes
```

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [viem](https://viem.sh/) — Ethereum interaction
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Vercel](https://vercel.com/) — Deployment

## License

MIT
