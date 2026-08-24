/**
 * @file WalletContext.tsx
 * @notice Centralized Web3 Wallet Context and Provider for MetaMask and EIP-1193 compatible wallets.
 *
 * ## Wallet Initialization & Lifecycle Flow:
 *
 * 1. **Automatic Silent Reconnection (`eth_accounts`)**:
 *    - On initial component mount, the provider queries `ethereum.request({ method: "eth_accounts" })`.
 *    - Unlike `eth_requestAccounts`, `eth_accounts` checks whether the user has previously authorized the application
 *      without popping up a MetaMask connection prompt.
 *    - If an authorized account is present, `updateWalletState` immediately initializes the `BrowserProvider`,
 *      active `JsonRpcSigner`, current `chainId`, and connected `account`.
 *
 * 2. **Account Change Handling (`accountsChanged` event)**:
 *    - Subscribes to the EIP-1193 `accountsChanged` event emitted whenever the user switches or locks accounts in MetaMask.
 *    - If the user locks their wallet or disconnects all accounts (`accounts.length === 0`), `disconnect()` is invoked,
 *      clearing all local state and signers.
 *    - If a new account is selected (`accounts[0]`), `updateWalletState` is triggered to bind the new account and signer.
 *
 * 3. **Chain & Network Change Handling (`chainChanged` event)**:
 *    - Subscribes to the EIP-1193 `chainChanged` event emitted when the user switches networks (e.g. from Ganache to Mainnet).
 *    - As recommended by MetaMask, re-initializes provider state for the active account to avoid stale chain state.
 *    - Evaluates `isSupportedNetwork(chainId)` against configured local (Ganache 1337/5777, Hardhat 31337) and deployment networks.
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
   */
  const disconnect = useCallback(() => {
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
   * Step 1: Automatic Reconnection Flow.
   * Silently detects already connected accounts using `eth_accounts` without triggering a modal.
   */
  useEffect(() => {
    if (!isMetaMaskAvailable()) return;

    const ethereum = (window as any).ethereum;

    ethereum
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          updateWalletState(accounts[0]);
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
        updateWalletState(accounts[0]);
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
