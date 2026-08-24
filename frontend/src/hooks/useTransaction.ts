import { useState, useCallback } from "react";
import { TransactionState, TransactionStatus } from "../types";
import { formatContractError } from "../services/errorHandler";

const INITIAL_STATE: TransactionState = {
  status: "idle",
  stepMessage: "",
};

export interface UseTransactionReturn {
  state: TransactionState;
  status: TransactionStatus;
  isBusy: boolean;
  isConfirmed: boolean;
  isFailed: boolean;
  stepMessage: string;
  txHash: string | undefined;
  error: string | undefined;
  execute: <T>(
    action: (onStateChange: (state: TransactionState) => void) => Promise<T>
  ) => Promise<T | null>;
  reset: () => void;
}

/**
 * React hook to track and manage the 6-stage lifecycle of blockchain write transactions.
 */
export function useTransaction(): UseTransactionReturn {
  const [state, setState] = useState<TransactionState>(INITIAL_STATE);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const execute = useCallback(
    async <T>(
      action: (onStateChange: (state: TransactionState) => void) => Promise<T>
    ): Promise<T | null> => {
      setState({
        status: "preparing",
        stepMessage: "Preparing transaction...",
      });

      try {
        const result = await action((updatedState) => {
          setState(updatedState);
        });
        return result;
      } catch (err: any) {
        const errorMsg = formatContractError(err);
        setState({
          status: "failed",
          stepMessage: errorMsg,
          error: errorMsg,
        });
        return null;
      }
    },
    []
  );

  const isBusy =
    state.status === "preparing" ||
    state.status === "awaiting_wallet_confirmation" ||
    state.status === "pending_transaction";

  return {
    state,
    status: state.status,
    isBusy,
    isConfirmed: state.status === "confirmed",
    isFailed: state.status === "failed",
    stepMessage: state.stepMessage,
    txHash: state.txHash,
    error: state.error,
    execute,
    reset,
  };
}
