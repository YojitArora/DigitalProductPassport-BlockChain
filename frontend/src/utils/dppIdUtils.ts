/**
 * @file dppIdUtils.ts
 * @notice Enterprise Professional Digital Product Passport ID utility functions.
 * @dev Generates, formats, and parses permanent, business-facing human-readable
 *      DPP Identifiers (e.g. DPP-AURA-000001) while preserving internal blockchain IDs.
 */

import type { Product } from "../types";

/**
 * Derives a clean, uppercase company identifier code from a manufacturer or brand name.
 * Examples:
 * - "Aura Chronometrics" -> "AURA"
 * - "Geneva Precision Watches" -> "GENEVA"
 * - "Rolex SA" -> "ROLEX"
 * - "Sony Electronics" -> "SONY"
 */
export function getCompanyCode(manufacturerName?: string, brand?: string): string {
  const source = (manufacturerName && manufacturerName.trim()) || (brand && brand.trim()) || "DPP";
  
  // Extract first word or clean string
  const clean = source
    .trim()
    .split(/\s+/)[0]
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();

  if (!clean || clean.length < 2) {
    return "DPP";
  }

  // Limit to maximum 8 characters for clean ID formatting
  return clean.substring(0, 8);
}

/**
 * Formats a Professional Digital Product Passport ID with 6-digit padded sequence.
 * Example: formatDppId("AURA", 1) -> "DPP-AURA-000001"
 */
export function formatDppId(companyCode: string, sequenceNumber: number | bigint): string {
  const code = (companyCode || "DPP").toUpperCase();
  const seq = Number(sequenceNumber);
  const paddedSeq = String(seq > 0 ? seq : 1).padStart(6, "0");
  return `DPP-${code}-${paddedSeq}`;
}

/**
 * Computes or retrieves the Professional DPP ID for a given product.
 */
export function getProductDppId(
  product: Product,
  manufacturerName?: string,
  sequenceNumber?: number | bigint
): string {
  if (product.dppId) {
    return product.dppId;
  }
  const companyCode = getCompanyCode(manufacturerName, product.brand);
  const seq = sequenceNumber !== undefined ? sequenceNumber : product.passportId;
  return formatDppId(companyCode, seq);
}

/**
 * Parses user input from search forms or URL routes.
 * Supports:
 * - Full DPP IDs: "DPP-AURA-000001", "dpp-aura-000001"
 * - Numeric IDs: "1", "25", "#1", "#25"
 * - Prefixed shorthand: "DPP-1", "dpp-25"
 */
export function parseDppSearchQuery(raw: string): {
  isNumeric: boolean;
  numericId?: bigint;
  dppIdString?: string;
  normalizedQuery: string;
} {
  if (!raw) {
    return { isNumeric: false, normalizedQuery: "" };
  }

  const cleaned = raw.trim();
  const upper = cleaned.toUpperCase();

  // 1. Direct Integer: "1", "25"
  if (/^\d+$/.test(cleaned)) {
    try {
      const num = BigInt(cleaned);
      if (num > 0n) {
        return { isNumeric: true, numericId: num, normalizedQuery: cleaned };
      }
    } catch {}
  }

  // 2. Hash Prefix: "#1", "#25"
  if (cleaned.startsWith("#") && /^\d+$/.test(cleaned.substring(1).trim())) {
    try {
      const num = BigInt(cleaned.substring(1).trim());
      if (num > 0n) {
        return { isNumeric: true, numericId: num, normalizedQuery: num.toString() };
      }
    } catch {}
  }

  // 3. Short DPP format: "DPP-1", "DPP-25"
  if (upper.startsWith("DPP-") && /^\d+$/.test(upper.substring(4).trim())) {
    try {
      const num = BigInt(upper.substring(4).trim());
      if (num > 0n) {
        return { isNumeric: true, numericId: num, normalizedQuery: num.toString() };
      }
    } catch {}
  }

  // 4. Standard Professional DPP ID: "DPP-AURA-000001"
  if (upper.startsWith("DPP-")) {
    return {
      isNumeric: false,
      dppIdString: upper,
      normalizedQuery: upper,
    };
  }

  return {
    isNumeric: false,
    normalizedQuery: cleaned,
  };
}
