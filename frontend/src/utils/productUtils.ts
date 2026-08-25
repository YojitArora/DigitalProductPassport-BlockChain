/**
 * @file productUtils.ts
 * @notice Centralized utility functions for Product Passport lifecycle and inventory logic.
 */

/**
 * Checks whether a product is currently held in Manufacturer Inventory (unsold).
 * A product is in inventory when its current owner matches the registering manufacturer.
 */
export function isProductInInventory(
  product?: { currentOwner?: string; manufacturer?: string } | null
): boolean {
  if (!product || !product.currentOwner || !product.manufacturer) {
    return false;
  }
  return product.currentOwner.toLowerCase() === product.manufacturer.toLowerCase();
}

/**
 * Returns a human-friendly display string for the current owner.
 * If in manufacturer inventory, returns "Manufacturer Inventory".
 */
export function getOwnerDisplayName(
  product?: { currentOwner?: string; manufacturer?: string } | null,
  truncateAddr?: (addr: string) => string
): string {
  if (!product || !product.currentOwner) return "None";
  if (isProductInInventory(product)) {
    return "Manufacturer Inventory";
  }
  return truncateAddr ? truncateAddr(product.currentOwner) : product.currentOwner;
}
