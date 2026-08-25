import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("====================================================");
  console.log(" Starting Deployment: Digital Product Passport");
  console.log("====================================================");

  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Deployer Address : ${deployer.address}`);
  console.log(`Account Balance  : ${ethers.formatEther(balance)} ETH`);

  console.log("\nDeploying PassportRegistry contract...");
  const passportRegistry = await ethers.deployContract("PassportRegistry");
  await passportRegistry.waitForDeployment();

  const contractAddress = await passportRegistry.getAddress();
  console.log(`PassportRegistry successfully deployed to: ${contractAddress}`);

  // Synchronize ABI and address to frontend contracts directory
  const frontendContractsDir = path.join(__dirname, "../frontend/src/contracts");

  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  // Write contract address
  const addressFilePath = path.join(frontendContractsDir, "contract-address.json");
  fs.writeFileSync(
    addressFilePath,
    JSON.stringify({ address: contractAddress }, null, 2)
  );
  console.log(`\n✓ Synchronized contract address -> ${addressFilePath}`);

  // Write contract ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/PassportRegistry.sol/PassportRegistry.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const abiFilePath = path.join(frontendContractsDir, "PassportRegistryABI.json");
    fs.writeFileSync(abiFilePath, JSON.stringify(artifact.abi, null, 2));
    console.log(`✓ Synchronized contract ABI     -> ${abiFilePath}`);
  }

  // ===================================================================
  // AUTOMATED DEMO ENVIRONMENT BOOTSTRAP & SEEDING
  // ===================================================================
  console.log("\n----------------------------------------------------");
  console.log(" Bootstrapping Demo Environment & On-Chain Roles");
  console.log("----------------------------------------------------");

  const signers = await ethers.getSigners();
  const admin = signers[0];
  const manufacturer = signers[1] || signers[0];
  const serviceCenter = signers[2] || signers[0];
  const owner = signers[3] || signers[0];

  console.log(`1. Wallet 1 (Platform Admin)    : ${admin.address}`);
  console.log(`2. Wallet 2 (Manufacturer)      : ${manufacturer.address}`);
  console.log(`3. Wallet 3 (Service Center)     : ${serviceCenter.address}`);
  console.log(`4. Wallet 4 (Product Owner)      : ${owner.address}`);

  // 1. Authorize Manufacturer (Wallet 2 only)
  console.log("\n-> Registering Manufacturer ('Aura Chronometrics')...");
  const mfgTx = await passportRegistry.connect(admin).registerManufacturer(
    manufacturer.address,
    "Aura Chronometrics"
  );
  await mfgTx.wait();
  console.log("   ✓ Manufacturer registered and approved.");

  // 2. Authorize Service Center (Wallet 3 only)
  console.log("\n-> Registering Service Center ('Geneva Certified Repairs')...");
  const scTx = await passportRegistry.connect(admin).registerServiceCenter(
    serviceCenter.address,
    "Geneva Certified Repairs"
  );
  await scTx.wait();
  console.log("   ✓ Service Center registered and approved.");

  // 3. Mint Demo Product #1 for Owner Wallet (Wallet 4 only)
  console.log("\n-> Minting Demo Passport #1 ('Aura ChronoMaster Pro') to Customer Owner...");
  const mfgDate = Math.floor(Date.now() / 1000) - (86400 * 30); // 30 days ago
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
  console.log("   ✓ Demo Passport #1 minted successfully.");

  // 4. Activate Warranty for Product #1 (2 Years / 730 Days)
  console.log("\n-> Activating 2-Year Warranty for Passport #1...");
  const warTx = await passportRegistry.connect(manufacturer).activateWarranty(1n, 730n);
  await warTx.wait();
  console.log("   ✓ 2-Year Warranty activated on-chain.");

  // 5. Simulate Initial Certified Service Cycle
  console.log("\n-> Logging Initial Maintenance Session for Passport #1...");
  const srvStartTx = await passportRegistry.connect(serviceCenter).startService(1n);
  await srvStartTx.wait();
  const srvDoneTx = await passportRegistry.connect(serviceCenter).completeService(
    1n,
    "Initial 1,000-hour regulation, lubrication, and waterproof gasket test passed."
  );
  await srvDoneTx.wait();
  console.log("   ✓ Initial service session recorded on-chain.");

  // 6. Mint Demo Inventory Product #2 (Manufacturer Inventory)
  console.log("\n-> Minting Demo Passport #2 ('Aura Tourbillon Factory Edition') into Manufacturer Inventory...");
  const invMintTx = await passportRegistry.connect(manufacturer).registerInventoryProduct(
    "Aura Tourbillon Factory Edition",
    "Aura Chronometrics",
    "Luxury Timepieces",
    "ACM-9000-INV",
    "SN-2026-INV-001",
    mfgDate
  );
  await invMintTx.wait();
  console.log("   ✓ Demo Passport #2 minted into Manufacturer Inventory.");

  // ===================================================================
  // AUTOMATED POST-DEPLOYMENT ON-CHAIN VERIFICATION (STRICT ROLE SEPARATION)
  // ===================================================================
  console.log("\n----------------------------------------------------");
  console.log(" Running Post-Deployment Role & State Verification");
  console.log("----------------------------------------------------");

  const vAdmin = await passportRegistry.isAdmin(admin.address);
  const vAdminMfg = await passportRegistry.isApprovedManufacturer(admin.address);
  const vMfg = await passportRegistry.isApprovedManufacturer(manufacturer.address);
  const vSc = await passportRegistry.isApprovedServiceCenter(serviceCenter.address);
  const nextId = await passportRegistry.getNextPassportId();

  let ownedCount = 0;
  let mfgCount = 0;
  for (let i = 1n; i < nextId; i++) {
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

  console.log(`- Wallet 1 (Admin)          -> isAdmin: ${vAdmin}, isManufacturer: ${vAdminMfg} (Strict Separation: PASS)`);
  console.log(`- Wallet 2 (Manufacturer)   -> isApprovedManufacturer: ${vMfg} (PASS)`);
  console.log(`- Wallet 3 (Service Center)  -> isApprovedServiceCenter: ${vSc} (PASS)`);
  console.log(`- Wallet 4 (Product Owner)   -> Owned Products: ${ownedCount} (PASS)`);
  console.log(`- Passport #1 Owner          : ${p1.currentOwner.toLowerCase() === owner.address.toLowerCase() ? "PASS (Owner Wallet)" : "FAIL"}`);
  console.log(`- Passport #2 Owner          : ${p2.currentOwner.toLowerCase() === manufacturer.address.toLowerCase() ? "PASS (Manufacturer Inventory)" : "FAIL"}`);

  if (!vAdmin || vAdminMfg || !vMfg || !vSc || ownedCount === 0) {
    throw new Error("Post-deployment automated verification assertions failed!");
  }

  console.log("\n====================================================");
  console.log(" Deployment & Demo Bootstrap Completed Successfully!");
  console.log("====================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
