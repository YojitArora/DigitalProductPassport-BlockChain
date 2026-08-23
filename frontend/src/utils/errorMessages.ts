/**
 * Maps custom smart contract errors to human-friendly user error messages.
 */
export const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  Unauthorized: "You do not have authorization to perform this operation.",
  PassportNotFound: "The requested passport ID could not be found.",
  PassportAlreadyExists: "A passport with this ID already exists.",
  DuplicateSerialNumber: "A product with this serial number has already been registered by this manufacturer.",
  InvalidStatus: "Operation cannot be completed due to invalid product status.",
  TransferNotPending: "There is no pending transfer for this product.",
  NotTransferRecipient: "Only the designated recipient can accept this transfer.",
  WarrantyAlreadyActivated: "Warranty has already been activated for this product.",
  ProductIsDecommissioned: "This product has been decommissioned and cannot be modified.",
  StringTooLong: "One or more input fields exceed the maximum allowed length.",
};

export function getFriendlyErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred.";
  if (typeof error === "string") return error;
  
  if (error.reason && CONTRACT_ERROR_MESSAGES[error.reason]) {
    return CONTRACT_ERROR_MESSAGES[error.reason];
  }

  if (error.data) {
    for (const [key, msg] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
      if (typeof error.data === "string" && error.data.includes(key)) {
        return msg;
      }
    }
  }

  if (error.message) {
    if (error.message.includes("user rejected action") || error.code === 4001 || error.code === "ACTION_REJECTED") {
      return "Transaction was cancelled in MetaMask.";
    }
    return error.message;
  }

  return "Transaction failed. Please check network and wallet status.";
}
