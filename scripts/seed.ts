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
  const nextId = await passportRegistry.nextPassportId();
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
  } else {
    console.log(`\n3. Passports already exist on contract (Next ID: ${nextId.toString()}).`);
  }

  console.log("\n====================================================");
  console.log(" Seeding Finished! Explore on http://localhost:3000/verify/1");
  console.log("====================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
