import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("====================================================");
  console.log(" Seeding Demo Data for Digital Product Passport");
  console.log("====================================================");

  const addressFilePath = path.join(__dirname, "../frontend/src/contracts/contract-address.json");
  if (!fs.existsSync(addressFilePath)) {
    throw new Error("Contract address file not found. Please run deployment first (`npm run deploy:ganache` or `npx hardhat run scripts/deploy.ts`).");
  }

  const { address } = JSON.parse(fs.readFileSync(addressFilePath, "utf-8"));
  const { ethers } = await network.create();
  const signers = await ethers.getSigners();

  if (signers.length < 3) {
    console.log("Warning: Less than 3 signers found. Seeding with available accounts.");
  }

  const admin = signers[0];
  const manufacturer = signers[1] || signers[0];
  const serviceCenter = signers[2] || signers[0];
  const customer = signers[3] || signers[0];

  console.log(`Admin Account          : ${admin.address}`);
  console.log(`Manufacturer Account   : ${manufacturer.address}`);
  console.log(`Service Center Account : ${serviceCenter.address}`);
  console.log(`Customer Account       : ${customer.address}`);

  const passportRegistry = await ethers.getContractAt("PassportRegistry", address);

  // 1. Register Manufacturer if not already registered
  const isMfg = await passportRegistry.isApprovedManufacturer(manufacturer.address);
  if (!isMfg) {
    console.log("\n1. Registering Manufacturer ('Aura Chronometrics')...");
    const tx = await passportRegistry.connect(admin).registerManufacturer(manufacturer.address, "Aura Chronometrics");
    await tx.wait();
    console.log("   ✓ Manufacturer registered successfully.");
  } else {
    console.log("\n1. Manufacturer already registered.");
  }

  // 2. Register Service Center if not already registered
  const isSc = await passportRegistry.isApprovedServiceCenter(serviceCenter.address);
  if (!isSc) {
    console.log("\n2. Registering Service Center ('Geneva Certified Repairs')...");
    const tx = await passportRegistry.connect(admin).registerServiceCenter(serviceCenter.address, "Geneva Certified Repairs");
    await tx.wait();
    console.log("   ✓ Service Center registered successfully.");
  } else {
    console.log("\n2. Service Center already registered.");
  }

  // 3. Mint Demo Passport #1 if nextPassportId is 1
  const nextId = await passportRegistry.getNextPassportId();
  if (nextId === 1n) {
    console.log("\n3. Minting Demo Passport #1 ('Aura ChronoMaster Pro')...");
    const manufactureDate = Math.floor(Date.now() / 1000) - 86400 * 30; // 30 days ago
    const txMint = await passportRegistry.connect(manufacturer).registerProduct(
      customer.address,
      "Aura ChronoMaster Pro",
      "Aura Chronometrics",
      "Luxury Timepieces",
      "ACM-9000-TI",
      "SN-2026-AURA-001",
      manufactureDate
    );
    await txMint.wait();
    console.log("   ✓ Passport #1 minted successfully.");

    // 4. Activate Warranty for 2 years (730 days)
    console.log("\n4. Activating 2-Year Warranty for Passport #1...");
    const txWarranty = await passportRegistry.connect(manufacturer).activateWarranty(1n, 730n);
    await txWarranty.wait();
    console.log("   ✓ 2-Year Warranty activated.");

    // 5. Simulate a Service Cycle
    console.log("\n5. Logging Certified Maintenance Session...");
    const txStart = await passportRegistry.connect(serviceCenter).startService(1n);
    await txStart.wait();
    const txComplete = await passportRegistry.connect(serviceCenter).completeService(
      1n,
      "Initial 1,000-hour regulation, lubrication, and waterproof gasket test passed."
    );
    await txComplete.wait();
    console.log("   ✓ Service cycle completed and logged.");

    // 6. Mint Demo Inventory Product #2 (Manufacturer Inventory)
    console.log("\n6. Minting Demo Passport #2 ('Aura Tourbillon Factory Edition') into Manufacturer Inventory...");
    const invMintTx = await passportRegistry.connect(manufacturer).registerInventoryProduct(
      "Aura Tourbillon Factory Edition",
      "Aura Chronometrics",
      "Luxury Timepieces",
      "ACM-9000-INV",
      "SN-2026-INV-001",
      manufactureDate
    );
    await invMintTx.wait();
    console.log("   ✓ Demo Passport #2 minted into Manufacturer Inventory.");
  } else {
    console.log(`\n3. Passports already exist on contract (Next ID: ${nextId.toString()}).`);
  }

  // Verification
  console.log("\n----------------------------------------------------");
  console.log(" Running Post-Seed Role & State Verification");
  console.log("----------------------------------------------------");

  const vAdmin = await passportRegistry.isAdmin(admin.address);
  const vMfg = await passportRegistry.isApprovedManufacturer(manufacturer.address);
  const vSc = await passportRegistry.isApprovedServiceCenter(serviceCenter.address);
  const nextIdVal = await passportRegistry.getNextPassportId();

  let ownedCount = 0;
  let mfgCount = 0;
  for (let i = 1n; i < nextIdVal; i++) {
    const prod = await passportRegistry.getProduct(i);
    if (prod.currentOwner.toLowerCase() === customer.address.toLowerCase()) {
      ownedCount++;
    }
    if (prod.manufacturer.toLowerCase() === manufacturer.address.toLowerCase()) {
      mfgCount++;
    }
  }

  console.log(`- isAdmin(Wallet 1 [${admin.address.substring(0, 8)}...])                  : ${vAdmin ? "PASS (true)" : "FAIL (false)"}`);
  console.log(`- isApprovedManufacturer(Wallet 2 [${manufacturer.address.substring(0, 8)}...])      : ${vMfg ? "PASS (true)" : "FAIL (false)"}`);
  console.log(`- isApprovedServiceCenter(Wallet 3 [${serviceCenter.address.substring(0, 8)}...])     : ${vSc ? "PASS (true)" : "FAIL (false)"}`);
  console.log(`- getProductsByOwner(Wallet 4 [${customer.address.substring(0, 8)}...])          : PASS (${ownedCount} product(s) owned)`);
  console.log(`- getProductsByManufacturer(Wallet 2)                                 : PASS (${mfgCount} product(s) registered)`);

  console.log("\n====================================================");
  console.log(" Seeding & Verification Finished! Explore on http://localhost:3000/verify/1");
  console.log("====================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
