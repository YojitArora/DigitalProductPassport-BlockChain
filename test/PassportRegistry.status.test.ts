import { expect } from "chai";
import { network } from "hardhat";

describe("PassportRegistry - Status & Theft Lifecycle System (Sprint 5)", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [admin, manufacturer, serviceCenter, owner, recipient, unauthorizedUser] =
      await ethers.getSigners();

    const passportRegistry = await ethers.deployContract("PassportRegistry");
    await passportRegistry.waitForDeployment();

    // Register manufacturer
    await passportRegistry.connect(admin).registerManufacturer(
      manufacturer.address,
      "Apex Horology SA"
    );

    // Register service center
    await passportRegistry.connect(admin).registerServiceCenter(
      serviceCenter.address,
      "Geneva Precision Care"
    );

    // Mint product 1
    await passportRegistry.connect(manufacturer).registerProduct(
      owner.address,
      "Royal Chronograph",
      "Apex",
      "Luxury Watches",
      "AP-7700",
      "SN-THEFT-001",
      1704067200
    );

    return {
      passportRegistry,
      ethers,
      admin,
      manufacturer,
      serviceCenter,
      owner,
      recipient,
      unauthorizedUser,
    };
  }

  describe("reportStolen", function () {
    it("should allow current owner to report product stolen, update status to ReportedStolen, and emit ProductReportedStolen", async function () {
      const { passportRegistry, owner } = await deployFixture();

      expect(await passportRegistry.getProductStatus(1n)).to.equal(0); // Active

      const tx = await passportRegistry.connect(owner).reportStolen(1n);

      await expect(tx)
        .to.emit(passportRegistry, "ProductReportedStolen")
        .withArgs(1n, owner.address, (val: any) => val > 0n);

      expect(await passportRegistry.getProductStatus(1n)).to.equal(2); // ReportedStolen
    });

    it("should revert with AlreadyReportedStolen when attempting duplicate stolen report", async function () {
      const { passportRegistry, owner } = await deployFixture();

      await passportRegistry.connect(owner).reportStolen(1n);

      await expect(
        passportRegistry.connect(owner).reportStolen(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "AlreadyReportedStolen")
        .withArgs(1n);
    });

    it("should revert with Unauthorized when non-owner attempts to report stolen", async function () {
      const { passportRegistry, unauthorizedUser } = await deployFixture();

      await expect(
        passportRegistry.connect(unauthorizedUser).reportStolen(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with PassportNotFound for non-existent passport ID", async function () {
      const { passportRegistry, owner } = await deployFixture();

      await expect(
        passportRegistry.connect(owner).reportStolen(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);
    });
  });

  describe("Operations Blocked While ReportedStolen", function () {
    it("should block initiateTransfer when product is ReportedStolen", async function () {
      const { passportRegistry, owner, recipient } = await deployFixture();

      await passportRegistry.connect(owner).reportStolen(1n);

      await expect(
        passportRegistry.connect(owner).initiateTransfer(1n, recipient.address)
      ).to.be.revertedWithCustomError(passportRegistry, "AlreadyReportedStolen")
        .withArgs(1n);
    });

    it("should block startService when product is ReportedStolen", async function () {
      const { passportRegistry, owner, serviceCenter } = await deployFixture();

      await passportRegistry.connect(owner).reportStolen(1n);

      await expect(
        passportRegistry.connect(serviceCenter).startService(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "AlreadyReportedStolen")
        .withArgs(1n);
    });
  });

  describe("reportRecovered", function () {
    it("should allow current owner to report a stolen product recovered, update status to Recovered, and emit ProductRecovered", async function () {
      const { passportRegistry, owner } = await deployFixture();

      await passportRegistry.connect(owner).reportStolen(1n);
      expect(await passportRegistry.getProductStatus(1n)).to.equal(2); // ReportedStolen

      const tx = await passportRegistry.connect(owner).reportRecovered(1n);

      await expect(tx)
        .to.emit(passportRegistry, "ProductRecovered")
        .withArgs(1n, owner.address, (val: any) => val > 0n);

      expect(await passportRegistry.getProductStatus(1n)).to.equal(3); // Recovered
    });

    it("should revert with ProductNotReportedStolen when attempting to report recovery on a non-stolen product", async function () {
      const { passportRegistry, owner } = await deployFixture();

      // Product is Active (0), not ReportedStolen
      await expect(
        passportRegistry.connect(owner).reportRecovered(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "ProductNotReportedStolen")
        .withArgs(1n);
    });

    it("should revert with ProductNotReportedStolen on duplicate recovery attempts", async function () {
      const { passportRegistry, owner } = await deployFixture();

      await passportRegistry.connect(owner).reportStolen(1n);
      await passportRegistry.connect(owner).reportRecovered(1n);

      // Second recovery attempt on status Recovered (3)
      await expect(
        passportRegistry.connect(owner).reportRecovered(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "ProductNotReportedStolen")
        .withArgs(1n);
    });

    it("should revert with Unauthorized when non-owner attempts to report recovery", async function () {
      const { passportRegistry, owner, unauthorizedUser } = await deployFixture();

      await passportRegistry.connect(owner).reportStolen(1n);

      await expect(
        passportRegistry.connect(unauthorizedUser).reportRecovered(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with PassportNotFound for non-existent passport ID", async function () {
      const { passportRegistry, owner } = await deployFixture();

      await expect(
        passportRegistry.connect(owner).reportRecovered(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);
    });
  });

  describe("Recovered Product Operational Behavior", function () {
    it("should allow a recovered product to be transferred through two-step transfer workflow", async function () {
      const { passportRegistry, owner, recipient } = await deployFixture();

      // Theft & Recovery
      await passportRegistry.connect(owner).reportStolen(1n);
      await passportRegistry.connect(owner).reportRecovered(1n);
      expect(await passportRegistry.getProductStatus(1n)).to.equal(3); // Recovered

      // Initiate transfer
      await expect(
        passportRegistry.connect(owner).initiateTransfer(1n, recipient.address)
      ).to.emit(passportRegistry, "OwnershipTransferRequested");

      // Accept transfer
      await expect(
        passportRegistry.connect(recipient).acceptTransfer(1n)
      ).to.emit(passportRegistry, "OwnershipTransferAccepted");

      expect(await passportRegistry.getCurrentOwner(1n)).to.equal(recipient.address);
      // Status remains Recovered
      expect(await passportRegistry.getProductStatus(1n)).to.equal(3);
    });

    it("should allow a recovered product to be serviced and preserve Recovered status after service completion", async function () {
      const { passportRegistry, owner, serviceCenter } = await deployFixture();

      // Theft & Recovery
      await passportRegistry.connect(owner).reportStolen(1n);
      await passportRegistry.connect(owner).reportRecovered(1n);
      expect(await passportRegistry.getProductStatus(1n)).to.equal(3); // Recovered

      // Start service (transitions to UnderService = 1)
      await passportRegistry.connect(serviceCenter).startService(1n);
      expect(await passportRegistry.getProductStatus(1n)).to.equal(1); // UnderService

      // Complete service (restores previous status = Recovered)
      await passportRegistry.connect(serviceCenter).completeService(1n, "Full overhaul after recovery");

      expect(await passportRegistry.getProductStatus(1n)).to.equal(3); // Restored to Recovered (3)
      expect(await passportRegistry.getRepairCount(1n)).to.equal(1n);
    });
  });
});
