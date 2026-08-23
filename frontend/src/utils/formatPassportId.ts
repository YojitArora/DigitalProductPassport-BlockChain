/**
 * Formats a numeric passport ID into the display format DPP-XXXXXX
 * @param id numeric or bigint passport ID
 * @returns formatted string DPP-000001
 */
export function formatPassportId(id: number | bigint | string): string {
  const numericId = typeof id === 'bigint' ? id.toString() : String(id);
  const cleanId = numericId.replace(/^DPP-/i, '');
  const paddedNumber = cleanId.padStart(6, '0');
  return `DPP-${paddedNumber}`;
}

/**
 * Parses a display passport string (e.g. DPP-000001) into a numeric bigint
 * @param formattedId DPP-XXXXXX string
 * @returns bigint ID
 */
export function parsePassportId(formattedId: string): bigint {
  const cleanId = formattedId.replace(/^DPP-/i, '').trim();
  const parsed = BigInt(cleanId);
  return parsed;
}
