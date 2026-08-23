const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of PassportRegistry...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const PassportRegistry = await hre.ethers.getContractFactory("PassportRegistry");
  const passportRegistry = await PassportRegistry.deploy();
  await passportRegistry.waitForDeployment();

  const contractAddress = await passportRegistry.getAddress();
  console.log("PassportRegistry deployed to:", contractAddress);

  // Synchronize ABI and address to frontend contracts directory
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");

  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  // Write contract address
  const addressFilePath = path.join(frontendContractsDir, "contract-address.json");
  fs.writeFileSync(
    addressFilePath,
    JSON.stringify({ address: contractAddress }, null, 2)
  );
  console.log("Saved contract address to:", addressFilePath);

  // Write contract ABI
  const contractArtifact = await hre.artifacts.readArtifact("PassportRegistry");
  const abiFilePath = path.join(frontendContractsDir, "PassportRegistryABI.json");
  fs.writeFileSync(
    abiFilePath,
    JSON.stringify(contractArtifact.abi, null, 2)
  );
  console.log("Saved contract ABI to:", abiFilePath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
