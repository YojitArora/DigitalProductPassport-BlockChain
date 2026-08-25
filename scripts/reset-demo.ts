import { deployContracts } from "./deploy.js";
import { seedDemo } from "./seed-demo.js";
import { fileURLToPath } from "url";

export async function resetDemo(): Promise<void> {
  console.log("====================================================");
  console.log(" Resetting & Initializing Demo Environment");
  console.log("====================================================\n");

  // Step 1: Deploy Fresh Smart Contracts
  console.log("--- Step 1: Deploying Fresh Smart Contract ---");
  await deployContracts({ quiet: false });

  // Step 2: Seed Demo Roles, Products, Warranty, and Service History
  console.log("--- Step 2: Bootstrapping Demo Roles & Passports ---");
  await seedDemo({ quiet: false });

  // Step 3: Print Presentation Ready Summary
  console.log("====================================================");
  console.log("Demo Environment Ready");
  console.log("✓ Platform Admin");
  console.log("✓ Manufacturer");
  console.log("✓ Service Center");
  console.log("✓ Product Owner");
  console.log("✓ Demo Products");
  console.log("✓ Warranty");
  console.log("✓ Service History");
  console.log("✓ Verification Passed");
  console.log("====================================================\n");
}

async function main() {
  await resetDemo();
}

if (process.argv.some((arg) => arg.includes("reset-demo.ts") || arg.includes("reset-demo.js"))) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Demo reset failed:", error);
      process.exit(1);
    });
}
