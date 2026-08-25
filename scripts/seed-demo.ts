import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDemo(options?: { quiet?: boolean }): Promise<void> {
  const isQuiet = options?.quiet ?? false;

  const addressFilePath = path.join(__dirname, "../frontend/src/contracts/contract-address.json");
  if (!fs.existsSync(addressFilePath)) {
    console.error("\nNo deployed PassportRegistry found.");
    console.error("Please run:");
    console.error("  npm run deploy:ganache");
    console.error("before running:");
    console.error("  npm run demo:setup\n");
    throw new Error("Missing contract deployment address file.");
  }

  const { address } = JSON.parse(fs.readFileSync(addressFilePath, "utf-8"));
  const { ethers } = await network.create();

  // Verify that bytecode exists at the target address
  const code = await ethers.provider.getCode(address);
  if (!code || code === "0x") {
    console.error("\nNo deployed PassportRegistry found at address: " + address);
    console.error("Please run:");
    console.error("  npm run deploy:ganache");
    console.error("before running:");
    console.error("  npm run demo:setup\n");
    throw new Error("No smart contract deployed at specified address.");
  }

  const signers = await ethers.getSigners();
  const admin = signers[0];
  const manufacturer = signers[1] || signers[0];
  const serviceCenter = signers[2] || signers[0];
  const owner = signers[3] || signers[0];

  if (!isQuiet) {
    console.log("====================================================");
    console.log(" Seeding Demo Environment & Enterprise Roles");
    console.log("====================================================");
    console.log(`Contract Address        : ${address}`);
    console.log(`1. Wallet 1 (Admin)     : ${admin.address}`);
    console.log(`2. Wallet 2 (Mfg)       : ${manufacturer.address}`);
    console.log(`3. Wallet 3 (Service)   : ${serviceCenter.address}`);
    console.log(`4. Wallet 4 (Owner)     : ${owner.address}`);
  }

  const passportRegistry = await ethers.getContractAt("PassportRegistry", address);

  // 1. Authorize Manufacturer (Wallet 2)
  const isMfg = await passportRegistry.isApprovedManufacturer(manufacturer.address);
  if (!isMfg) {
    if (!isQuiet) console.log("\n-> Registering Manufacturer ('Aura Chronometrics')...");
    const mfgTx = await passportRegistry.connect(admin).registerManufacturer(
      manufacturer.address,
      "Aura Chronometrics"
    );
    await mfgTx.wait();
    if (!isQuiet) console.log("   ✓ Manufacturer registered and approved.");
  } else if (!isQuiet) {
    console.log("\n-> Manufacturer already registered.");
  }

  // 2. Authorize Service Center (Wallet 3)
  const isSc = await passportRegistry.isApprovedServiceCenter(serviceCenter.address);
  if (!isSc) {
    if (!isQuiet) console.log("\n-> Registering Service Center ('Geneva Certified Repairs')...");
    const scTx = await passportRegistry.connect(admin).registerServiceCenter(
      serviceCenter.address,
      "Geneva Certified Repairs"
    );
    await scTx.wait();
    if (!isQuiet) console.log("   ✓ Service Center registered and approved.");
  } else if (!isQuiet) {
    console.log("\n-> Service Center already registered.");
  }

  // 3. Mint Demo Product #1 for Owner Wallet (Wallet 4)
  const nextId = await passportRegistry.getNextPassportId();
  const mfgDate = Math.floor(Date.now() / 1000) - (86400 * 30); // 30 days ago

  if (nextId === 1n) {
    if (!isQuiet) console.log("\n-> Minting Demo Passport #1 ('Aura ChronoMaster Pro') to Customer Owner...");
    const mintTx = await passportRegistry.connect(manufacturer).registerProduct(
      owner.address,
      "Aura ChronoMaster Pro",
      "Aura Chronometrics",
      "Luxury Timepieces",
      "ACM-9000-TI",
      "SN-2026-AURA-001",
      mfgDate
    );
    await mintTx.wait();
    if (!isQuiet) console.log("   ✓ Demo Passport #1 minted successfully.");

    // 4. Activate Warranty for Product #1 (2 Years / 730 Days)
    if (!isQuiet) console.log("\n-> Activating 2-Year Warranty for Passport #1...");
    const warTx = await passportRegistry.connect(manufacturer).activateWarranty(1n, 730n);
    await warTx.wait();
    if (!isQuiet) console.log("   ✓ 2-Year Warranty activated on-chain.");

    // 5. Simulate Initial Certified Service Cycle
    if (!isQuiet) console.log("\n-> Logging Initial Maintenance Session for Passport #1...");
    const srvStartTx = await passportRegistry.connect(serviceCenter).startService(1n);
    await srvStartTx.wait();
    const srvDoneTx = await passportRegistry.connect(serviceCenter).completeService(
      1n,
      "Initial 1,000-hour regulation, lubrication, and waterproof gasket test passed."
    );
    await srvDoneTx.wait();
    if (!isQuiet) console.log("   ✓ Initial service session recorded on-chain.");

    // 6. Mint Demo Inventory Product #2 (Manufacturer Inventory)
    if (!isQuiet) console.log("\n-> Minting Demo Passport #2 ('Aura Tourbillon Factory Edition') into Manufacturer Inventory...");
    const invMintTx = await passportRegistry.connect(manufacturer).registerInventoryProduct(
      "Aura Tourbillon Factory Edition",
      "Aura Chronometrics",
      "Luxury Timepieces",
      "ACM-9000-INV",
      "SN-2026-INV-001",
      mfgDate
    );
    await invMintTx.wait();
    if (!isQuiet) console.log("   ✓ Demo Passport #2 minted into Manufacturer Inventory.");
  } else if (!isQuiet) {
    console.log(`\n-> Passports already exist on contract (Next ID: ${nextId.toString()}).`);
  }

  // ===================================================================
  // ON-CHAIN VERIFICATION (STRICT ROLE SEPARATION)
  // ===================================================================
  if (!isQuiet) {
    console.log("\n----------------------------------------------------");
    console.log(" Running Post-Seed Role & State Verification");
    console.log("----------------------------------------------------");
  }

  const vAdmin = await passportRegistry.isAdmin(admin.address);
  const vAdminMfg = await passportRegistry.isApprovedManufacturer(admin.address);
  const vMfg = await passportRegistry.isApprovedManufacturer(manufacturer.address);
  const vSc = await passportRegistry.isApprovedServiceCenter(serviceCenter.address);
  const currentNextId = await passportRegistry.getNextPassportId();

  let ownedCount = 0;
  let mfgCount = 0;
  for (let i = 1n; i < currentNextId; i++) {
    const prod = await passportRegistry.getProduct(i);
    if (prod.currentOwner.toLowerCase() === owner.address.toLowerCase()) {
      ownedCount++;
    }
    if (prod.manufacturer.toLowerCase() === manufacturer.address.toLowerCase()) {
      mfgCount++;
    }
  }

  const p1 = await passportRegistry.getProduct(1n);
  const p2 = await passportRegistry.getProduct(2n);

  if (!isQuiet) {
    console.log(`- Wallet 1 (Admin)          -> isAdmin: ${vAdmin}, isManufacturer: ${vAdminMfg} (Strict Separation: PASS)`);
    console.log(`- Wallet 2 (Manufacturer)   -> isApprovedManufacturer: ${vMfg} (PASS)`);
    console.log(`- Wallet 3 (Service Center)  -> isApprovedServiceCenter: ${vSc} (PASS)`);
    console.log(`- Wallet 4 (Product Owner)   -> Owned Products: ${ownedCount} (PASS)`);
    console.log(`- Passport #1 Owner          : ${p1.currentOwner.toLowerCase() === owner.address.toLowerCase() ? "PASS (Owner Wallet)" : "FAIL"}`);
    console.log(`- Passport #2 Owner          : ${p2.currentOwner.toLowerCase() === manufacturer.address.toLowerCase() ? "PASS (Manufacturer Inventory)" : "FAIL"}`);
  }

  if (!vAdmin || vAdminMfg || !vMfg || !vSc || ownedCount === 0) {
    throw new Error("Post-seed automated verification assertions failed!");
  }

  if (!isQuiet) {
    console.log("\n====================================================");
    console.log(" Demo Seeding Completed Successfully!");
    console.log("====================================================\n");
  }
}

async function main() {
  await seedDemo();
}

if (process.argv.some((arg) => arg.includes("seed-demo.ts") || arg.includes("seed-demo.js"))) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Demo seeding failed:", error);
      process.exit(1);
    });
}
