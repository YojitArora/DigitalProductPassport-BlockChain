import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function deployContracts(options?: { quiet?: boolean }): Promise<{ contractAddress: string }> {
  const isQuiet = options?.quiet ?? false;

  if (!isQuiet) {
    console.log("====================================================");
    console.log(" Starting Deployment: Digital Product Passport");
    console.log("====================================================");
  }

  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  if (!isQuiet) {
    console.log(`Deployer Address : ${deployer.address}`);
    console.log(`Account Balance  : ${ethers.formatEther(balance)} ETH`);
    console.log("\nDeploying PassportRegistry contract...");
  }

  const passportRegistry = await ethers.deployContract("PassportRegistry");
  await passportRegistry.waitForDeployment();

  const contractAddress = await passportRegistry.getAddress();

  if (!isQuiet) {
    console.log(`PassportRegistry successfully deployed to: ${contractAddress}`);
  }

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

  if (!isQuiet) {
    console.log(`\n✓ Synchronized contract address -> ${addressFilePath}`);
  }

  // Write contract ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/PassportRegistry.sol/PassportRegistry.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const abiFilePath = path.join(frontendContractsDir, "PassportRegistryABI.json");
    fs.writeFileSync(abiFilePath, JSON.stringify(artifact.abi, null, 2));
    if (!isQuiet) {
      console.log(`✓ Synchronized contract ABI     -> ${abiFilePath}`);
    }
  }

  if (!isQuiet) {
    console.log("====================================================");
    console.log(" Deployment Completed Successfully!");
    console.log("====================================================\n");
  }

  return { contractAddress };
}

async function main() {
  await deployContracts();
}

if (process.argv.some((arg) => arg.includes("deploy.ts") || arg.includes("deploy.js"))) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}
