"use client";

import { useState, useEffect, FormEvent } from "react";

interface FaucetInfo {
  balance: string;
  address: string;
  network: string;
  chainId: number;
}

export default function Home() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [info, setInfo] = useState<FaucetInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/faucet/info")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  async function handleClaim(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/faucet/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ type: "success", message: data.message });
        setAddress("");
        const fresh = await fetch("/api/faucet/info").then((r) => r.json());
        setInfo(fresh);
      } else {
        setStatus({ type: "error", message: data.error || "Request failed" });
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  function copyDonationAddress() {
    if (info?.address) {
      navigator.clipboard.writeText(info.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const blockscanUrl = info?.address
    ? `https://sepolia.etherscan.io/address/${info.address}`
    : "#";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <h1 className="text-lg font-semibold">Sepolia Faucet</h1>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-4xl mx-auto grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
              <h2 className="text-2xl font-bold mb-2">Sepolia ETH Faucet</h2>
              <p className="text-[var(--muted)] mb-6">
                Get free Sepolia ETH to test your dApps and smart contracts on
                the Sepolia test network.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="rounded-lg bg-[var(--bg)] p-3">
                  <span className="text-[var(--muted)]">Network</span>
                  <p className="font-medium">Ethereum Sepolia</p>
                </div>
                <div className="rounded-lg bg-[var(--bg)] p-3">
                  <span className="text-[var(--muted)]">Chain ID</span>
                  <p className="font-medium">11155111</p>
                </div>
                <div className="rounded-lg bg-[var(--bg)] p-3">
                  <span className="text-[var(--muted)]">Symbol</span>
                  <p className="font-medium">SepoliaETH</p>
                </div>
                <div className="rounded-lg bg-[var(--bg)] p-3">
                  <span className="text-[var(--muted)]">Faucet Balance</span>
                  <p className="font-medium">
                    {info ? `${Number(info.balance).toFixed(4)} ETH` : "..."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleClaim} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1.5">
                    Your Wallet Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !address}
                  className="w-full rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-medium text-sm transition-colors"
                >
                  {loading ? "Sending..." : "Request Sepolia ETH"}
                </button>
              </form>

              {status && (
                <div
                  className={`mt-4 rounded-lg p-3 text-sm ${
                    status.type === "success"
                      ? "bg-green-900/40 text-green-300 border border-green-800"
                      : "bg-red-900/40 text-red-300 border border-red-800"
                  }`}
                >
                  {status.message}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h3 className="font-semibold mb-4">Donate to Faucet</h3>
              <p className="text-sm text-[var(--muted)] mb-4">
                Help keep this faucet running by donating Sepolia ETH. Every
                contribution helps developers build on Ethereum.
              </p>
              {info ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-[var(--bg)] p-3">
                    <p className="text-xs text-[var(--muted)] mb-1">
                      Faucet Address
                    </p>
                    <p className="text-sm font-mono break-all">{info.address}</p>
                  </div>
                  <button
                    onClick={copyDonationAddress}
                    className="w-full rounded-lg border border-[var(--border)] hover:border-[var(--accent)] px-4 py-2.5 text-sm transition-colors"
                  >
                    {copied ? "Copied!" : "Copy Address"}
                  </button>
                  <a
                    href={blockscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm text-[var(--accent)] hover:underline"
                  >
                    View on Etherscan &rarr;
                  </a>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">Loading...</p>
              )}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h3 className="font-semibold mb-3">Faucet Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Balance</span>
                  <span className="font-medium">
                    {info ? `${Number(info.balance).toFixed(4)} ETH` : "..."}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Network</span>
                  <span className="font-medium">Sepolia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-4 text-center text-sm text-[var(--muted)]">
        Sepolia Faucet &middot; Use responsibly
      </footer>
    </div>
  );
}
