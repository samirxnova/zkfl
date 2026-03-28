"use client";

import Link from "next/link";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { useAuth } from "./AuthProvider";

export function Navbar() {
  const { connected, address, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { user, loading } = useAuth();

  const displayName = user?.username ?? (address ? `${address.slice(0, 8)}...${address.slice(-4)}` : "");

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-secondary)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-[var(--accent)]">
            ZKFL
          </Link>
          <div className="hidden gap-6 sm:flex">
            <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
              Matches
            </Link>
            {connected && (
              <Link href="/my" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                My Contests
              </Link>
            )}
          </div>
        </div>

        <div>
          {connected ? (
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
              ) : (
                <Link
                  href="/my"
                  className="flex items-center gap-2 rounded-lg bg-[var(--bg-card)] px-3 py-1.5 hover:bg-[var(--bg-card)]/80 transition"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xs font-bold text-[var(--accent)]">
                    {(user?.username ?? address ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {displayName}
                  </span>
                </Link>
              )}
              <button
                onClick={disconnect}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--danger)] hover:border-[var(--danger)] transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setVisible(true)}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--accent-dim)] transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
