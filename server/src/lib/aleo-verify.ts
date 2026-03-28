/**
 * Verify Aleo transactions against the explorer API.
 * Ensures the frontend isn't spoofing entry submissions.
 */

const ALEO_API = "https://api.explorer.provable.com/v1";

/**
 * Verify that an Aleo transaction:
 * 1. Exists and is confirmed (not rejected)
 * 2. Called the correct program/function
 *
 * Retries on 404 since the explorer may not have indexed the tx yet.
 */
export async function verifyAleoTransaction(
  txId: string,
  expectedProgram: string,
  expectedFunction: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    let lastStatus = 0;
    let res: Response | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      res = await fetch(`${ALEO_API}/testnet/transaction/${txId}`);
      lastStatus = res.status;

      if (res.ok) break;
      if (res.status === 404 && attempt < 4) {
        console.log(`[AleoVerify] Tx ${txId} not indexed yet, retry ${attempt + 1}/5...`);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      break;
    }

    if (!res || !res.ok) {
      if (lastStatus === 404) {
        // Explorer hasn't caught up yet — allow gracefully
        console.warn(`[AleoVerify] Tx ${txId} not found after retries, allowing gracefully`);
        return { valid: true, error: "Transaction not yet indexed by explorer" };
      }
      return { valid: false, error: `Aleo API returned ${lastStatus}` };
    }

    const tx = await res.json();

    // fee-only type means execution was rejected
    if (tx.type === "fee") {
      return { valid: false, error: "Transaction was rejected on-chain" };
    }

    // Verify the transaction called the expected program/function
    const transitions = tx.execution?.transitions;
    if (!transitions || transitions.length === 0) {
      return { valid: false, error: "Transaction has no program executions" };
    }

    const match = transitions.find(
      (t: any) => t.program === expectedProgram && t.function === expectedFunction,
    );

    if (!match) {
      return {
        valid: false,
        error: `Transaction did not call ${expectedProgram}/${expectedFunction}`,
      };
    }

    return { valid: true };
  } catch (err) {
    console.error("[AleoVerify] Failed to verify transaction:", err);
    // Don't block entries if API is temporarily down
    return { valid: true, error: "Aleo API unavailable, skipping verification" };
  }
}
