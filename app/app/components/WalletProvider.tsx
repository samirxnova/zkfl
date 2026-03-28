"use client";

import { useMemo, ReactNode } from "react";
import { AleoWalletProvider } from "@provablehq/aleo-wallet-adaptor-react";
import { WalletModalProvider } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { LeoWalletAdapter } from "@provablehq/aleo-wallet-adaptor-leo";
import { PuzzleWalletAdapter } from "@provablehq/aleo-wallet-adaptor-puzzle";
import { ShieldWalletAdapter } from "@provablehq/aleo-wallet-adaptor-shield";
import { FoxWalletAdapter } from "@provablehq/aleo-wallet-adaptor-fox";
import { SoterWalletAdapter } from "@provablehq/aleo-wallet-adaptor-soter";
import { Network } from "@provablehq/aleo-types";
import { DecryptPermission } from "@provablehq/aleo-wallet-adaptor-core";

import "@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css";

const PROGRAMS = [
  "zkfl_match.aleo",
  "zkfl_team_v2.aleo",
  "zkfl_scoring_v2.aleo",
  "zkfl_prize_v2.aleo",
];

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter(),
      new ShieldWalletAdapter(),
      new PuzzleWalletAdapter(),
      new FoxWalletAdapter(),
      new SoterWalletAdapter(),
    ],
    []
  );

  return (
    <AleoWalletProvider
      wallets={wallets}
      network={Network.TESTNET}
      decryptPermission={DecryptPermission.AutoDecrypt}
      autoConnect={true}
      localStorageKey="zkfl_wallet"
      programs={PROGRAMS}
      onError={(error) => console.error("[Wallet]", error)}
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </AleoWalletProvider>
  );
}
