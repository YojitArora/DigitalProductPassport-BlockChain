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
 * Recursively inspects an error object for hex error data.
 */
function findHexData(obj: any): string | null {
  if (!obj) return null;
  if (typeof obj === "string") {
    if (obj.startsWith("0x") && obj.length >= 10) return obj;
    return null;
  }
  if (typeof obj === "object") {
    if (typeof obj.data === "string" && obj.data.startsWith("0x")) return obj.data;
    if (typeof obj.return === "string" && obj.return.startsWith("0x")) return obj.return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "object" || typeof obj[key] === "string") {
        const found = findHexData(obj[key]);
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * Extracts and decodes Solidity custom error data from ethers / Ganache error objects.
 */
function extractCustomError(error: any): { name: string; args?: any } | null {
  if (!error) return null;

  // 1. Direct errorName from ethers v6
  if (error.errorName && CUSTOM_ERROR_MESSAGES[error.errorName]) {
    return { name: error.errorName, args: error.errorArgs };
  }

  // 2. Check nested error data payloads
  const hexData = findHexData(error);
  if (hexData) {
    try {
      const parsed = contractInterface.parseError(hexData);
      if (parsed && CUSTOM_ERROR_MESSAGES[parsed.name]) {
        return { name: parsed.name, args: parsed.args };
      }
    } catch {
      // Data may not match known custom errors
    }
  }

  // 3. Check error string and nested message strings for custom error names
  const allMessages: string[] = [
    error.message,
    error.shortMessage,
    error.reason,
    error.info?.error?.message,
    error.error?.message,
    error.cause?.message,
  ].filter(Boolean);

  for (const msg of allMessages) {
    for (const errorName of Object.keys(CUSTOM_ERROR_MESSAGES)) {
      if (msg.includes(errorName)) {
        return { name: errorName };
      }
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

  // 2. Custom contract errors (e.g. DuplicateSerialNumber, ZeroAddress, Unauthorized)
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

  // 6. Check for meaningful string in reason or nested error messages (ignoring "missing revert data")
  const nestedMessage =
    error.info?.error?.message ||
    error.error?.message ||
    error.cause?.message ||
    error.reason;

  if (nestedMessage && typeof nestedMessage === "string") {
    const cleaned = nestedMessage
      .replace(/^(execution reverted:?|VM Exception while processing transaction:?)\s*/i, "")
      .trim();
    if (cleaned.length > 0 && !cleaned.toLowerCase().includes("missing revert data")) {
      return cleaned;
    }
  }

  // 7. Generic reason / shortMessage fallback (filter out "missing revert data")
  if (error.shortMessage && !error.shortMessage.toLowerCase().includes("missing revert data")) {
    return error.shortMessage;
  }

  if (typeof error.message === "string") {
    const cleaned = error.message
      .replace(/^(execution reverted:?|VM Exception while processing transaction:?)\s*/i, "")
      .trim();
    if (
      cleaned.length > 0 &&
      cleaned.length < 150 &&
      !cleaned.toLowerCase().includes("missing revert data")
    ) {
      return cleaned;
    }
  }

  return "Transaction failed during blockchain execution. Please verify input fields and role permissions.";
}
