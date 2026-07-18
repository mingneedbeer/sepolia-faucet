# Sepolia Faucet

A self-hosted [Sepolia](https://sepolia.etherscan.io/) ETH faucet with donation support, built with Astro, Bun, and [viem](https://viem.sh/).

## Features

- **Claim Sepolia ETH** — Enter your wallet address to receive free testnet ETH
- **24h per-address cooldown** — Each address can claim once per day (persisted via Turso)
- **Global daily cap** — Prevents the faucet from being drained (default 0.02 ETH/day)
- **Donation support** — Users can donate Sepolia ETH to keep the faucet funded
- **reCAPTCHA** — Google reCAPTCHA v2 integration (invisible)
- **Etherscan integration** — Click through to view transactions on Sepolia Etherscan

## Tech Stack

- [Astro](https://astro.build/) — Framework
- [React](https://react.dev/) — Client-side UI islands
- [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/) — Styling
- [viem](https://viem.sh/) — Ethereum interaction
- [Turso](https://turso.tech/) — Rate limiting persistence
- [Bun](https://bun.sh/) — Runtime & package manager
- [Vercel](https://vercel.com/) — Deployment

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.0+
- A Sepolia wallet with some ETH
- A Turso database (free tier works)

### Setup

```bash
git clone <your-repo-url>
cd sepolia-faucet
cp .env.example .env.local
```

Edit `.env.local`:

```
FAUCET_PRIVATE_KEY=0x...
FAUCET_AMOUNT=0.01
RPC_URL=https://ethereum-sepolia.publicnode.com
DAILY_CAP=0.02
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

```bash
bun install
bun run dev
```

Open [http://localhost:4321](http://localhost:4321).

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `FAUCET_PRIVATE_KEY` | — | Private key of the faucet wallet (with Sepolia ETH) |
| `FAUCET_AMOUNT` | `0.01` | ETH amount sent per claim |
| `RPC_URL` | `https://ethereum-sepolia.publicnode.com` | Sepolia RPC endpoint |
| `DAILY_CAP` | `0.02` | Global daily dispense limit (ETH) |
| `PUBLIC_RECAPTCHA_SITE_KEY` | — | reCAPTCHA v2 site key |
| `RECAPTCHA_SECRET_KEY` | — | reCAPTCHA v2 secret key |
| `TURSO_DATABASE_URL` | — | Turso database URL |
| `TURSO_AUTH_TOKEN` | — | Turso auth token |

### Turso Schema

```sql
CREATE TABLE claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  tx_hash TEXT,
  amount TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_claims_address ON claims(address);
CREATE INDEX idx_claims_created_at ON claims(created_at);
```

## Testing

```bash
bun run test        # Vitest unit tests
bun run test:e2e    # Playwright E2E tests
```

## Deploy to Vercel

```bash
bun run build
vercel --prod
```

## License

MIT
