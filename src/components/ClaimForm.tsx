import { useState, useEffect, useRef, type FormEvent } from "react";

const RECAPTCHA_SITE_KEY = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY || "";

declare global {
  interface Window {
    grecaptcha: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void }) => number;
      reset: (widgetId: number) => void;
    };
  }
}

interface FaucetInfo {
  balance: string;
  address: string;
  network: string;
  chainId: number;
  dailyUsed: number;
  dailyCap: number;
}

function ReCaptchaWidget({ onVerify }: { onVerify: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !containerRef.current) return;

    const existingScript = document.querySelector(
      `script[src="https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}"]`
    );

    function renderWidget() {
      if (!containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token: string) => onVerify(token),
        "expired-callback": () => onVerify(null),
      });
    }

    if (existingScript && window.grecaptcha) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(check);
          renderWidget();
        }
      }, 100);
    };
    document.head.appendChild(script);
  }, []);

  return <div ref={containerRef} className="mt-2" />;
}

function ClaimFormInner() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
    txHash?: string;
  } | null>(null);
  const [info, setInfo] = useState<FaucetInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

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

    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setStatus({
        type: "error",
        message: "Please complete the reCAPTCHA",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/faucet/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, recaptchaToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({
          type: "success",
          message: "Successfully sent!",
          txHash: data.hash,
        });
        setAddress("");
        const fresh = await fetch("/api/faucet/info").then((r) => r.json());
        setInfo(fresh);
      } else {
        setStatus({
          type: "error",
          message: data.error || "Request failed",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Network error. Please try again.",
      });
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
      <div className="navbar bg-base-100 border-b border-base-300 px-6">
        <div className="flex-1 items-center gap-3">
          <div className="btn btn-ghost text-xl font-bold gap-2 px-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-content font-bold text-sm">
              S
            </div>
            Yet Another Sepolia Faucet
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-8">
              <h2 className="card-title text-2xl mb-1">
                Sepolia ETH Faucet
              </h2>
              <p className="text-base-content/60 mb-6">
                Get free Sepolia ETH to test your dApps and smart contracts on
                the Sepolia test network.
              </p>

              <div className="stats stats-vertical sm:stats-horizontal shadow-sm border border-base-300 mb-6 w-full">
                <div className="stat">
                  <div className="stat-title">Network</div>
                  <div className="stat-value text-lg">Ethereum Sepolia</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Chain ID</div>
                  <div className="stat-value text-lg">11155111</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Symbol</div>
                  <div className="stat-value text-lg">SepoliaETH</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Faucet Balance</div>
                  <div className="stat-value text-lg">
                    {info
                      ? `${Number(info.balance).toFixed(4)} ETH`
                      : "..."}
                  </div>
                </div>
              </div>

              <form onSubmit={handleClaim} className="space-y-4">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend text-sm">
                    Your Wallet Address
                  </legend>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x..."
                    className="input input-bordered w-full"
                    required
                  />
                </fieldset>
                {RECAPTCHA_SITE_KEY && (
                  <ReCaptchaWidget onVerify={(token) => setRecaptchaToken(token)} />
                )}
                <button
                  type="submit"
                  disabled={loading || !address}
                  className="btn btn-primary w-full"
                >
                  {loading && <span className="loading loading-spinner" />}
                  {loading ? "Sending..." : "Request Sepolia ETH"}
                </button>
              </form>

              {status && (
                <div
                  role="alert"
                  className={`mt-4 alert ${
                    status.type === "success" ? "alert-success" : "alert-error"
                  }`}
                >
                  <span>{status.message}</span>
                  {status.txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${status.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      View on Etherscan &rarr;
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-6">
                <h3 className="card-title text-lg mb-2">
                  Donate to Faucet
                </h3>
                <p className="text-base-content/60 text-sm mb-4">
                  Help keep this faucet running by donating Sepolia ETH.
                  Every contribution helps developers build on Ethereum.
                </p>
                {info ? (
                  <div className="space-y-3">
                    <div className="bg-base-200 rounded-box p-3">
                      <p className="text-xs text-base-content/60 mb-1">
                        Faucet Address
                      </p>
                      <p className="text-sm font-mono break-all">
                        {info.address}
                      </p>
                    </div>
                    <button
                      onClick={copyDonationAddress}
                      className="btn btn-outline btn-block"
                    >
                      {copied ? "Copied!" : "Copy Address"}
                    </button>
                    <a
                      href={blockscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary text-sm text-center block"
                    >
                      View on Etherscan &rarr;
                    </a>
                  </div>
                ) : (
                  <span className="loading loading-dots loading-md" />
                )}
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-6">
                <h3 className="card-title text-lg mb-3">Faucet Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Balance</span>
                    <span className="font-medium">
                      {info
                        ? `${Number(info.balance).toFixed(4)} ETH`
                        : "..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Network</span>
                    <span className="font-medium">Sepolia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer footer-center bg-base-100 border-t border-base-300 px-6 py-4 text-sm text-base-content/60">
        <div className="flex items-center gap-2">
          <span>Yet Another Sepolia Faucet</span>
          <span>&middot;</span>
          <span>Use responsibly</span>
          <span>&middot;</span>
          <a
            href="https://github.com/mingneedbeer/sepolia-faucet/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            Feedback
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function ClaimForm() {
  return <ClaimFormInner />;
}
