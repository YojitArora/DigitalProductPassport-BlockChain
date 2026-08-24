/**
 * @file WalletContext.tsx
 * @notice Centralized Web3 Wallet Context and Provider for MetaMask and EIP-1193 compatible wallets.
 *
 * ## Wallet Initialization & Disconnect Lifecycle Flow:
 *
 * 1. **User-Controlled Disconnection State (`dpp_wallet_disconnected`)**:
 *    - When the user explicitly clicks `disconnect()`, a persistence flag `dpp_wallet_disconnected` is stored in `localStorage`.
 *    - All React wallet states (`account`, `signer`, `provider`, `chainId`) are cleared immediately.
 *    - The application remains disconnected across page reloads and re-renders until the user explicitly clicks `connect()`.
 *
 * 2. **Explicit Connection (`connect()`)**:
 *    - Clears the `dpp_wallet_disconnected` persistence flag.
 *    - Invokes `eth_requestAccounts` to prompt MetaMask connection modal for user approval.
 *    - Sets up the active `BrowserProvider`, `JsonRpcSigner`, and `account`.
 *
 * 3. **Automatic Silent Reconnection (`eth_accounts`)**:
 *    - On initial component mount, queries `ethereum.request({ method: "eth_accounts" })`.
 *    - If the user previously disconnected (`dpp_wallet_disconnected === "true"`), silent reconnection is skipped,
 *      ensuring the app stays disconnected as requested.
 *    - If no explicit disconnect flag is present and the wallet is already authorized, initializes wallet state.
 *
 * 4. **Account Change Handling (`accountsChanged` event)**:
 *    - If the user disconnects all accounts or locks MetaMask (`accounts.length === 0`), `disconnect()` is invoked.
 *    - If the user is currently connected and switches to a different account, updates wallet state to the newly active account.
 *    - If the user is in an explicitly disconnected state, ignores external background events until `connect()` is clicked.
 *
 * 5. **Chain & Network Change Handling (`chainChanged` event)**:
 *    - Re-initializes provider state for the active account when network changes to avoid stale chain state.
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import {
  getBrowserProvider,
  isMetaMaskAvailable,
  isSupportedNetwork,
  switchOrAddNetwork,
} from "../services/provider";
import { formatContractError } from "../services/errorHandler";

const DISCONNECTED_STORAGE_KEY = "dpp_wallet_disconnected";

export interface WalletContextValue {
  account: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  isNetworkSupported: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (targetChainId?: number) => Promise<void>;
  clearError: () => void;
}

export const WalletContext = createContext<WalletContextValue | undefined>(
  undefined
);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMetaMaskInstalled = isMetaMaskAvailable();
  const isNetworkSupported = isSupportedNetwork(chainId);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Updates provider, network, and signer instances for the active account.
   */
  const updateWalletState = useCallback(
    async (currentAccount: string | null) => {
      if (!currentAccount || !isMetaMaskAvailable()) {
        setAccount(null);
        setSigner(null);
        setProvider(null);
        setChainId(null);
        return;
      }

      try {
        const bp = getBrowserProvider();
        const network = await bp.getNetwork();
        const activeSigner = await bp.getSigner();
        const currentChainId = Number(network.chainId);

        setProvider(bp);
        setSigner(activeSigner);
        setAccount(currentAccount);
        setChainId(currentChainId);
        setError(null);
      } catch (err: any) {
        console.error("Failed to update wallet state:", err);
        setError(formatContractError(err));
      }
    },
    []
  );

  /**
   * Prompts MetaMask connection modal for explicit user approval.
   * Clears the user-disconnected flag to allow subsequent session reconnection.
   */
  const connect = useCallback(async () => {
    if (!isMetaMaskAvailable()) {
      setError(
        "MetaMask is not installed. Please install the MetaMask browser extension to continue."
      );
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Clear explicit disconnect preference upon user action
      try {
        localStorage.removeItem(DISCONNECTED_STORAGE_KEY);
      } catch (e) {
        // Handle localStorage restrictions if any
      }

      const ethereum = (window as any).ethereum;
      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        await updateWalletState(accounts[0]);
      } else {
        setError("No accounts found. Please unlock your MetaMask wallet.");
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(formatContractError(err));
    } finally {
      setIsConnecting(false);
    }
  }, [updateWalletState]);

  /**
   * Resets and clears connected wallet state locally.
   * Sets the user-disconnected flag to prevent immediate silent reconnection.
   */
  const disconnect = useCallback(() => {
    try {
      localStorage.setItem(DISCONNECTED_STORAGE_KEY, "true");
    } catch (e) {
      // Handle localStorage restrictions if any
    }

    setAccount(null);
    setSigner(null);
    setProvider(null);
    setChainId(null);
    setError(null);
  }, []);

  /**
   * Requests network switch in MetaMask (e.g. to local Ganache 1337 / 5777 or Hardhat 31337).
   */
  const switchNetwork = useCallback(
    async (targetChainId: number = 1337) => {
      setError(null);
      try {
        await switchOrAddNetwork(targetChainId);
        if (account) {
          await updateWalletState(account);
        }
      } catch (err: any) {
        setError(formatContractError(err));
      }
    },
    [account, updateWalletState]
  );

  /**
   * Step 1: Automatic Silent Reconnection Flow.
   * Checks if user previously explicitly disconnected. If not, queries `eth_accounts`.
   */
  useEffect(() => {
    if (!isMetaMaskAvailable()) return;

    // Do not auto-reconnect if user explicitly chose to disconnect
    try {
      if (localStorage.getItem(DISCONNECTED_STORAGE_KEY) === "true") {
        return;
      }
    } catch (e) {
      // Proceed if localStorage is not accessible
    }

    const ethereum = (window as any).ethereum;

    ethereum
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          // Double check disconnect flag before updating
          let isDisconnected = false;
          try {
            isDisconnected = localStorage.getItem(DISCONNECTED_STORAGE_KEY) === "true";
          } catch (e) {}

          if (!isDisconnected) {
            updateWalletState(accounts[0]);
          }
        }
      })
      .catch((err: any) => {
        console.warn("Silent reconnection query (eth_accounts) failed:", err);
      });
  }, [updateWalletState]);

  /**
   * Step 2 & 3: Account Change & Chain Change Event Listeners.
   */
  useEffect(() => {
    if (!isMetaMaskAvailable()) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        // If user is currently disconnected by preference, don't auto-connect on account change
        let isDisconnected = false;
        try {
          isDisconnected = localStorage.getItem(DISCONNECTED_STORAGE_KEY) === "true";
        } catch (e) {}

        if (!isDisconnected || account !== null) {
          updateWalletState(accounts[0]);
        }
      }
    };

    const handleChainChanged = (_chainIdHex: string) => {
      if (account) {
        updateWalletState(account);
      }
    };

    const handleDisconnect = () => {
      disconnect();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("disconnect", handleDisconnect);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
        ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, [account, disconnect, updateWalletState]);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        provider,
        signer,
        isConnected: Boolean(account),
        isConnecting,
        isMetaMaskInstalled,
        isNetworkSupported,
        error,
        connect,
        disconnect,
        switchNetwork,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
