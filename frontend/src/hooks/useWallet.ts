import { useContext } from "react";
import { WalletContext, WalletContextValue } from "../context/WalletContext";

/**
 * Custom React hook providing access to the Web3 WalletContext.
 */
export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a <WalletProvider> tree.");
  }
  return context;
}
