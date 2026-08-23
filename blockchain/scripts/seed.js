const hre = require("hardhat");

async function main() {
  console.log("Seeding script initialized. (Ready for test data once smart contract methods are implemented)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
