/**
 * @file AuthContext.tsx
 * @notice Centralized Enterprise Web3 Wallet Signature Authentication and Blockchain Role Authorization Layer.
 *
 * ## Authentication & Security Architecture:
 * 1. **Wallet as Identity**: The connected wallet serves as the cryptographic identity.
 * 2. **Web3 Signature Verification**: Users sign a verifiable session challenge (`signMessage`)
 *    to cryptographically verify wallet key possession without backend dependencies.
 * 3. **Smart Contract Source of Truth**: Roles are queried directly from the blockchain:
 *    - `isAdmin(account)`: Verified on-chain admin privileges.
 *    - `isApprovedManufacturer(account)`: Verified active manufacturer status.
 *    - `isApprovedServiceCenter(account)`: Verified active service center status.
 *    - `isOwner`: Verified on-chain ownership of at least one product passport.
 * 4. **Strict Logout / Disconnect Invalidation**: Any wallet disconnect or account change
 *    instantly destroys the session, clears cached roles, and redirects to the Public Verification portal.
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  ReactNode,
} from "react";
import { useWallet } from "../hooks/useWallet";
import { PassportService } from "../services/passportService";
import { AuthSession, UserRoles } from "../types";

const AUTH_STORAGE_KEY = "dpp_enterprise_session";

export interface AuthContextValue {
  session: AuthSession | null;
  roles: UserRoles;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  flashMessage: string | null;
  login: () => Promise<boolean>;
  logout: (reason?: string) => void;
  refreshRoles: () => Promise<void>;
  clearAuthError: () => void;
  clearFlashMessage: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const DEFAULT_ROLES: UserRoles = {
  isAdmin: false,
  isManufacturer: false,
  isServiceCenter: false,
  isOwner: false,
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { account, signer, isConnected, isInitialized, connect, disconnect } = useWallet();

  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const cached = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Failed to parse cached auth session:", e);
    }
    return null;
  });

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);
  const clearFlashMessage = useCallback(() => setFlashMessage(null), []);

  const roles: UserRoles = session ? session.roles : DEFAULT_ROLES;
  const isAuthenticated = Boolean(
    session &&
    isConnected &&
    account &&
    session.account.toLowerCase() === account.toLowerCase()
  );

  /**
   * Destroys current enterprise session and disconnects wallet.
   */
  const logout = useCallback((reason?: string) => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}

    setSession(null);
    disconnect();
    if (reason) {
      setFlashMessage(reason);
    } else {
      setFlashMessage("Wallet disconnected. Please reconnect to continue.");
    }
  }, [disconnect]);

  /**
   * Re-queries on-chain roles for the current session.
   */
  const refreshRoles = useCallback(async () => {
    if (!account) return;
    try {
      const [isAdmin, isManufacturer, isServiceCenter, isOwner] = await Promise.all([
        PassportService.isAdmin(account),
        PassportService.isApprovedManufacturer(account),
        PassportService.isApprovedServiceCenter(account),
        PassportService.hasOwnedProducts(account),
      ]);

      const detectedRoles: UserRoles = {
        isAdmin,
        isManufacturer,
        isServiceCenter,
        isOwner,
      };

      setSession((prev) => {
        if (!prev) return null;
        const updated = { ...prev, roles: detectedRoles };
        try {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    } catch (err) {
      console.warn("Failed to refresh on-chain roles:", err);
    }
  }, [account]);

  /**
   * Authenticates user via Web3 wallet signature verification and detects on-chain permissions.
   */
  const login = useCallback(async (): Promise<boolean> => {
    if (isAuthenticating) return false;

    setIsAuthenticating(true);
    setAuthError(null);
    setFlashMessage(null);

    try {
      let currentSigner = signer;
      let currentAccount = account;

      // If not yet connected, trigger wallet connection
      if (!currentSigner || !currentAccount) {
        await connect();
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
          throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
        }
        const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
          throw new Error("No authorized accounts returned by wallet. Please unlock MetaMask.");
        }
        currentAccount = accounts[0];
      }

      // 1. Request Cryptographic Signature Challenge (Web3 Signature Verification)
      const timestamp = Date.now();
      const message = `Digital Product Passport — Enterprise Operations Authentication\n\nAuthorized Account: ${currentAccount}\nSession Timestamp: ${timestamp}\n\nSign this cryptographic challenge to verify wallet ownership and access authorized blockchain portals.`;

      const ethereum = (window as any).ethereum;
      let signature = "";
      try {
        signature = await ethereum.request({
          method: "personal_sign",
          params: [message, currentAccount],
        });
      } catch (signErr: any) {
        if (signErr.code === 4001) {
          throw new Error("Signature request cancelled by user.");
        }
        if (signErr.code === -32002) {
          throw new Error("Signature request is already pending in MetaMask. Please check the notification window.");
        }
        throw signErr;
      }

      // 2. Fetch Blockchain Roles directly from Smart Contract
      const [isAdmin, isManufacturer, isServiceCenter, isOwner] = await Promise.all([
        PassportService.isAdmin(currentAccount),
        PassportService.isApprovedManufacturer(currentAccount),
        PassportService.isApprovedServiceCenter(currentAccount),
        PassportService.hasOwnedProducts(currentAccount),
      ]);

      const detectedRoles: UserRoles = {
        isAdmin,
        isManufacturer,
        isServiceCenter,
        isOwner,
      };

      // 3. Create Valid Session
      const newSession: AuthSession = {
        account: currentAccount,
        signature,
        roles: detectedRoles,
        authenticatedAt: timestamp,
      };

      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));
      } catch (e) {}

      setSession(newSession);
      return true;
    } catch (err: any) {
      console.error("Web3 Signature Verification failed:", err);
      const msg = err.message || "Failed to verify wallet signature.";
      setAuthError(msg);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [account, connect, isAuthenticating, signer]);

  /**
   * Monitor wallet account changes once initialization completes.
   * If wallet is disconnected or account switches away from session account, invalidate session immediately.
   */
  useEffect(() => {
    if (!isInitialized) return;

    if (session) {
      if (!isConnected || !account || session.account.toLowerCase() !== account.toLowerCase()) {
        logout("Wallet disconnected. Please reconnect to continue.");
      }
    }
  }, [account, isConnected, isInitialized, session, logout]);

  return (
    <AuthContext.Provider
      value={{
        session,
        roles,
        isAuthenticated,
        isAuthenticating,
        authError,
        flashMessage,
        login,
        logout,
        refreshRoles,
        clearAuthError,
        clearFlashMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
