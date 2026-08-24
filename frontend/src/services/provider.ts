import { BrowserProvider, JsonRpcSigner, Contract } from "ethers";
import contractAddressData from "../contracts/contract-address.json";
import contractAbiData from "../contracts/PassportRegistryABI.json";

export const CONTRACT_ADDRESS: string = contractAddressData.address;
export const CONTRACT_ABI = contractAbiData;

/**
 * Common local and development network definitions.
 */
export const SUPPORTED_NETWORKS: Record<
  number,
  { name: string; rpcUrl: string; chainName: string; currencySymbol: string }
> = {
  1337: {
    name: "Ganache Local (1337)",
    rpcUrl: "http://127.0.0.1:8545",
    chainName: "Ganache Local",
    currencySymbol: "ETH",
  },
  5777: {
    name: "Ganache GUI (5777)",
    rpcUrl: "http://127.0.0.1:7545",
    chainName: "Ganache GUI",
    currencySymbol: "ETH",
  },
  31337: {
    name: "Hardhat Local (31337)",
    rpcUrl: "http://127.0.0.1:8545",
    chainName: "Hardhat Local",
    currencySymbol: "GO",
  },
};

/**
 * Checks whether a given numeric chainId is one of the supported local or deployment networks.
 * @param chainId The chain ID number or bigint to inspect.
 */
export function isSupportedNetwork(chainId: number | bigint | null | undefined): boolean {
  if (chainId === null || chainId === undefined) return false;
  const numericChainId = Number(chainId);
  return Boolean(SUPPORTED_NETWORKS[numericChainId]);
}

/**
 * Checks whether window.ethereum (MetaMask or EIP-1193 provider) is available in the browser.
 */
export function isMetaMaskAvailable(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).ethereum);
}

/**
 * Retrieves an ethers v6 BrowserProvider instance connected to window.ethereum.
 */
export function getBrowserProvider(): BrowserProvider {
  if (!isMetaMaskAvailable()) {
    throw new Error(
      "MetaMask or an EIP-1193 compatible wallet is not installed. Please install MetaMask to interact with the Digital Product Passport."
    );
  }
  return new BrowserProvider((window as any).ethereum, "any");
}

/**
 * Retrieves the current JsonRpcSigner from the active BrowserProvider.
 */
export async function getSigner(): Promise<JsonRpcSigner> {
  const provider = getBrowserProvider();
  return provider.getSigner();
}

/**
 * Instantiates the PassportRegistry contract with a signer or provider.
 * @param signerOrProvider Optional signer or provider. Defaults to active signer if available, or browser provider.
 */
export async function getPassportContract(
  signerOrProvider?: JsonRpcSigner | BrowserProvider
): Promise<Contract> {
  if (signerOrProvider) {
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
  }

  try {
    const signer = await getSigner();
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  } catch {
    const provider = getBrowserProvider();
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }
}

/**
 * Requests MetaMask to switch to the specified chain, or adds the network if not yet configured.
 * @param targetChainId Numeric chain ID (defaults to Ganache 1337 or Hardhat 31337).
 */
export async function switchOrAddNetwork(targetChainId: number = 1337): Promise<void> {
  if (!isMetaMaskAvailable()) return;

  const ethereum = (window as any).ethereum;
  const hexChainId = "0x" + targetChainId.toString(16);

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
  } catch (switchError: any) {
    // Error code 4902 means the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      const net = SUPPORTED_NETWORKS[targetChainId] || {
        chainName: `Local Network (${targetChainId})`,
        rpcUrl: "http://127.0.0.1:8545",
        currencySymbol: "ETH",
      };

      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexChainId,
            chainName: net.chainName,
            nativeCurrency: {
              name: net.currencySymbol,
              symbol: net.currencySymbol,
              decimals: 18,
            },
            rpcUrls: [net.rpcUrl],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}
