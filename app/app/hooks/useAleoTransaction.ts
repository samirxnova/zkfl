"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { PROGRAMS, DEFAULT_FEE } from "../lib/aleo";
import type { TxConfirmResult } from "../lib/aleo";

interface TxResult {
  transactionId?: string;
}

export function useAleoTransaction() {
  const { wallet, executeTransaction, transactionStatus, connected } = useWallet();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Poll wallet adapter for tx status (1s interval, up to 120 attempts = 2 min)
  const pollStatus = useCallback(
    async (tempTxId: string) => {
      const adapter = wallet?.adapter;

      for (let i = 0; i < 120; i++) {
        try {
          let statusStr: string | undefined;
          let onChainId: string | undefined;

          if (adapter && "transactionStatus" in adapter) {
            const statusRes: unknown = await // eslint-disable-next-line @typescript-eslint/no-explicit-any
(adapter as any).transactionStatus(tempTxId);
            if (typeof statusRes === "string") {
              statusStr = statusRes.toLowerCase();
            } else if (statusRes && typeof statusRes === "object") {
              statusStr = // eslint-disable-next-line @typescript-eslint/no-explicit-any
(statusRes as any).status?.toLowerCase();
              onChainId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
(statusRes as any).transactionId;
            }
          } else {
            const status = await transactionStatus(tempTxId);
            statusStr = // eslint-disable-next-line @typescript-eslint/no-explicit-any
(status as any).status?.toLowerCase();
            onChainId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
(status as any).transactionId;
          }

          if (onChainId && onChainId !== tempTxId) {
            setLastTxId(onChainId);
          }

          if (statusStr === "accepted" || statusStr === "finalized" || statusStr === "completed") {
            setTxStatus("accepted");
            return;
          }
          if (statusStr === "failed" || statusStr === "rejected") {
            setTxStatus(statusStr);
            setError(`Transaction ${statusStr}`);
            return;
          }
          setTxStatus(statusStr || "pending");
        } catch {
          // Wallet may not have started processing yet
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setTxStatus("timeout");
      setError("Transaction status polling timed out after 2 minutes");
    },
    [wallet, transactionStatus],
  );

  // Execute a transaction and start background polling
  const execute = useCallback(
    async (
      program: string,
      fn: string,
      inputs: string[],
      fee: number = DEFAULT_FEE,
    ): Promise<TxResult | null> => {
      if (!connected) {
        setError("Wallet not connected");
        return null;
      }

      setPending(true);
      setError(null);
      setLastTxId(null);
      setTxStatus(null);

      try {
        console.log("[ZKFL TX]", { program, function: fn, inputs, fee });

        const result = await executeTransaction({
          program,
          function: fn,
          inputs,
          fee,
          privateFee: false,
        });

        console.log("[ZKFL TX] Result:", result);

        if (result?.transactionId) {
          setLastTxId(result.transactionId);
          setTxStatus("submitted");
          // Poll in background — don't await
          pollStatus(result.transactionId);
          return result;
        }

        setError("Transaction was rejected or cancelled by wallet");
        return null;
      } catch (err) {
        console.error("[ZKFL TX] Error:", err);
        setError(err instanceof Error ? err.message : String(err));
        return null;
      } finally {
        setPending(false);
      }
    },
    [connected, executeTransaction, pollStatus],
  );

  // Wait for a specific tx to confirm (blocking, for sequential flows)
  // Returns both status and the real on-chain tx ID (which may differ from temp wallet ID)
  const waitForConfirmation = useCallback(
    async (txId: string, maxAttempts: number = 120): Promise<TxConfirmResult> => {
      const adapter = wallet?.adapter;
      let realTxId: string | undefined;

      for (let i = 0; i < maxAttempts; i++) {
        try {
          let statusStr: string | undefined;
          let onChainId: string | undefined;

          if (adapter && "transactionStatus" in adapter) {
            const statusRes: unknown = await // eslint-disable-next-line @typescript-eslint/no-explicit-any
(adapter as any).transactionStatus(txId);
            if (typeof statusRes === "string") {
              statusStr = statusRes.toLowerCase();
            } else if (statusRes && typeof statusRes === "object") {
              statusStr = // eslint-disable-next-line @typescript-eslint/no-explicit-any
(statusRes as any).status?.toLowerCase();
              onChainId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
(statusRes as any).transactionId;
            }
          } else {
            const status = await transactionStatus(txId);
            statusStr = // eslint-disable-next-line @typescript-eslint/no-explicit-any
(status as any).status?.toLowerCase();
            onChainId = // eslint-disable-next-line @typescript-eslint/no-explicit-any
(status as any).transactionId;
          }

          if (onChainId && onChainId !== txId) {
            realTxId = onChainId;
            setLastTxId(onChainId);
          }

          if (statusStr === "accepted" || statusStr === "finalized" || statusStr === "completed") {
            return { status: "accepted", onChainId: realTxId ?? txId };
          }
          if (statusStr === "failed" || statusStr === "rejected") {
            return { status: statusStr as TxConfirmResult["status"], onChainId: realTxId ?? txId };
          }
        } catch {
          // Status not available yet
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      return { status: "timeout" };
    },
    [wallet, transactionStatus],
  );

  return {
    execute,
    waitForConfirmation,
    pending,
    error,
    lastTxId,
    txStatus,
    connected,
    PROGRAMS,
  };
}
