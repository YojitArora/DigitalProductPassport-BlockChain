import { Interface } from "ethers";
import contractAbiData from "../contracts/PassportRegistryABI.json";

const contractInterface = new Interface(contractAbiData);

/**
 * Human-readable mapping of smart contract custom errors.
 */
const CUSTOM_ERROR_MESSAGES: Record<string, string> = {
  Unauthorized: "Operation unauthorized. Your connected wallet does not hold the required role.",
  ZeroAddress: "Invalid address provided (zero address is not allowed).",
  AdminAlreadyExists: "This address already holds platform administrator privileges.",
  ManufacturerAlreadyExists: "This manufacturer address is already registered and active.",
  ManufacturerNotFound: "No registered manufacturer was found for this address.",
  ManufacturerAlreadyRevoked: "This manufacturer's authorization is already revoked.",
  ServiceCenterAlreadyExists: "This service center address is already registered and active.",
  ServiceCenterNotFound: "No registered service center was found for this address.",
  ServiceCenterAlreadyRevoked: "This service center's authorization is already revoked.",
  PassportNotFound: "Digital Product Passport not found. Please verify the Passport ID.",
  DuplicateSerialNumber: "A product with this serial number has already been registered by your manufacturer account.",
  InvalidManufactureDate: "Invalid manufacture date. Date cannot be 0 or set in the future.",
  EmptyString: "Required text field cannot be empty.",
  StringTooLong: "Text input exceeds the maximum allowed character limit.",
  TransferToSelf: "Cannot transfer ownership to your own address.",
  TransferAlreadyPending: "An ownership transfer is already pending for this product passport.",
  NoPendingTransfer: "No active pending transfer exists for this product.",
  NotPendingRecipient: "You are not the designated recipient for this pending transfer.",
  AlreadyUnderService: "This product is already currently undergoing active service / maintenance.",
  NotUnderService: "This product is not currently in UnderService status.",
  NotCurrentServiceCenter: "Only the authorized service center that initiated this service session can complete it.",
  WarrantyAlreadyActivated: "Warranty has already been activated for this product passport.",
  InvalidWarrantyDuration: "Warranty duration must be greater than 0 days.",
  NotProductManufacturer: "Only the authorized manufacturer that originally registered this product can activate its warranty.",
  AlreadyReportedStolen: "This product is currently reported stolen. Operations are restricted.",
  ProductNotReportedStolen: "This product is not currently flagged as reported stolen.",
};

/**
 * Extracts and decodes Solidity custom error data from ethers error objects.
 */
function extractCustomError(error: any): { name: string; args?: any } | null {
  if (!error) return null;

  // Direct errorName from ethers v6
  if (error.errorName && CUSTOM_ERROR_MESSAGES[error.errorName]) {
    return { name: error.errorName, args: error.errorArgs };
  }

  // Check nested error data payloads
  const data =
    error.data ||
    error.error?.data ||
    error.info?.error?.data ||
    error.receipt?.revert?.data ||
    error.info?.payload?.error?.data;

  if (typeof data === "string" && data.startsWith("0x")) {
    try {
      const parsed = contractInterface.parseError(data);
      if (parsed) {
        return { name: parsed.name, args: parsed.args };
      }
    } catch {
      // Data may not match known custom errors
    }
  }

  // Check error message string for custom error names
  const message = error.message || "";
  for (const errorName of Object.keys(CUSTOM_ERROR_MESSAGES)) {
    if (message.includes(errorName)) {
      return { name: errorName };
    }
  }

  return null;
}

/**
 * Parses and formats any web3/contract/wallet error into a clean, user-friendly message.
 * @param error The raw error caught in a try/catch block.
 * @returns A descriptive, friendly error string suitable for UI presentation.
 */
export function formatContractError(error: any): string {
  if (!error) {
    return "An unknown error occurred.";
  }

  // 1. User rejected the transaction in MetaMask
  if (
    error.code === "ACTION_REJECTED" ||
    error.code === 4001 ||
    error?.info?.error?.code === 4001 ||
    error.message?.includes("user rejected action") ||
    error.message?.includes("User denied transaction signature")
  ) {
    return "Transaction was cancelled / rejected in your wallet.";
  }

  // 2. Custom contract errors
  const customError = extractCustomError(error);
  if (customError && CUSTOM_ERROR_MESSAGES[customError.name]) {
    return CUSTOM_ERROR_MESSAGES[customError.name];
  }

  // 3. Insufficient funds
  if (
    error.code === "INSUFFICIENT_FUNDS" ||
    error.message?.includes("insufficient funds")
  ) {
    return "Insufficient funds in your connected wallet to cover the transaction and gas fees.";
  }

  // 4. Network / RPC connection errors
  if (
    error.code === "NETWORK_ERROR" ||
    error.message?.includes("could not detect network") ||
    error.message?.includes("connection refused")
  ) {
    return "Unable to connect to the blockchain network. Ensure your local node (Ganache / Hardhat) is running and MetaMask is connected to the right network.";
  }

  // 5. Nonce / Replacement transaction issues
  if (error.code === "NONCE_EXPIRED" || error.message?.includes("nonce")) {
    return "Transaction nonce conflict. Please reset your MetaMask account activity or wait for previous transactions to settle.";
  }

  // 6. Generic reason / shortMessage fallback
  if (error.shortMessage) {
    return error.shortMessage;
  }

  if (typeof error.reason === "string") {
    return error.reason;
  }

  if (typeof error.message === "string") {
    // Clean up internal ethers RPC trace prefixes
    const cleaned = error.message.replace(/^(execution reverted:?|VM Exception while processing transaction:?)\s*/i, "").trim();
    if (cleaned.length > 0 && cleaned.length < 150) {
      return cleaned;
    }
  }

  return "Transaction failed. Please check the contract requirements and try again.";
}
