import { expect } from "chai";
import { network } from "hardhat";

describe("PassportRegistry - Service Center & Repair Lifecycle System", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [admin, manufacturer, serviceCenter1, serviceCenter2, owner, nonAdmin, unauthorizedUser] =
      await ethers.getSigners();

    const passportRegistry = await ethers.deployContract("PassportRegistry");
    await passportRegistry.waitForDeployment();

    // Register manufacturer
    await passportRegistry.connect(admin).registerManufacturer(
      manufacturer.address,
      "Acme Luxury Horology"
    );

    // Register serviceCenter1 and serviceCenter2
    await passportRegistry.connect(admin).registerServiceCenter(
      serviceCenter1.address,
      "Swiss Precision Care"
    );
    await passportRegistry.connect(admin).registerServiceCenter(
      serviceCenter2.address,
      "Apex Authorized Diagnostics"
    );

    // Register a product passport (passportId = 1)
    await passportRegistry.connect(manufacturer).registerProduct(
      owner.address,
      "Master Chronograph",
      "Acme",
      "Watches",
      "MC-9000",
      "SN-CHRONO-001",
      1704067200
    );

    return {
      passportRegistry,
      ethers,
      admin,
      manufacturer,
      serviceCenter1,
      serviceCenter2,
      owner,
      nonAdmin,
      unauthorizedUser,
    };
  }

  describe("Service Center Registration & Role Management (Sprint 1)", function () {
    it("should allow admin to register a service center successfully and emit ServiceCenterRegistered", async function () {
      const { passportRegistry, admin, unauthorizedUser } = await deployFixture();

      const tx = await passportRegistry.connect(admin).registerServiceCenter(
        unauthorizedUser.address,
        "Geneva Watch Lab"
      );

      await expect(tx)
        .to.emit(passportRegistry, "ServiceCenterRegistered")
        .withArgs(unauthorizedUser.address, "Geneva Watch Lab", (val: any) => val > 0n);

      expect(await passportRegistry.isApprovedServiceCenter(unauthorizedUser.address)).to.be.true;

      const sc = await passportRegistry.getServiceCenter(unauthorizedUser.address);
      expect(sc.walletAddress).to.equal(unauthorizedUser.address);
      expect(sc.name).to.equal("Geneva Watch Lab");
      expect(sc.approved).to.be.true;
      expect(sc.registeredAt).to.be.gt(0n);
    });

    it("should revert with Unauthorized when a non-admin attempts to register a service center", async function () {
      const { passportRegistry, nonAdmin, unauthorizedUser } = await deployFixture();

      await expect(
        passportRegistry.connect(nonAdmin).registerServiceCenter(
          unauthorizedUser.address,
          "Unauthorized Service Center"
        )
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with ZeroAddress when service center address is address(0)", async function () {
      const { passportRegistry, admin, ethers } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).registerServiceCenter(
          ethers.ZeroAddress,
          "Zero Address SC"
        )
      ).to.be.revertedWithCustomError(passportRegistry, "ZeroAddress");
    });

    it("should revert with EmptyString when name is empty", async function () {
      const { passportRegistry, admin, unauthorizedUser } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).registerServiceCenter(
          unauthorizedUser.address,
          ""
        )
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString")
        .withArgs("name");
    });

    it("should revert with StringTooLong when name exceeds MAX_NAME_LENGTH (128 bytes)", async function () {
      const { passportRegistry, admin, unauthorizedUser } = await deployFixture();
      const longName = "S".repeat(129);

      await expect(
        passportRegistry.connect(admin).registerServiceCenter(
          unauthorizedUser.address,
          longName
        )
      ).to.be.revertedWithCustomError(passportRegistry, "StringTooLong")
        .withArgs("name", 128);
    });

    it("should revert with ServiceCenterAlreadyExists when registering an already active service center", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).registerServiceCenter(
          serviceCenter1.address,
          "Swiss Care Duplicate"
        )
      ).to.be.revertedWithCustomError(passportRegistry, "ServiceCenterAlreadyExists")
        .withArgs(serviceCenter1.address);
    });

    it("should allow admin to revoke an approved service center and emit ServiceCenterRevoked", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      const tx = await passportRegistry.connect(admin).revokeServiceCenter(serviceCenter1.address);

      await expect(tx)
        .to.emit(passportRegistry, "ServiceCenterRevoked")
        .withArgs(serviceCenter1.address, (val: any) => val > 0n);

      expect(await passportRegistry.isApprovedServiceCenter(serviceCenter1.address)).to.be.false;

      const sc = await passportRegistry.getServiceCenter(serviceCenter1.address);
      expect(sc.approved).to.be.false;
      expect(sc.name).to.equal("Swiss Precision Care"); // metadata preserved
    });

    it("should revert with Unauthorized when a non-admin attempts revocation", async function () {
      const { passportRegistry, nonAdmin, serviceCenter1 } = await deployFixture();

      await expect(
        passportRegistry.connect(nonAdmin).revokeServiceCenter(serviceCenter1.address)
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with ZeroAddress when revoking address(0)", async function () {
      const { passportRegistry, admin, ethers } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).revokeServiceCenter(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(passportRegistry, "ZeroAddress");
    });

    it("should revert with ServiceCenterNotFound when revoking an address that was never registered", async function () {
      const { passportRegistry, admin, unauthorizedUser } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).revokeServiceCenter(unauthorizedUser.address)
      ).to.be.revertedWithCustomError(passportRegistry, "ServiceCenterNotFound")
        .withArgs(unauthorizedUser.address);
    });

    it("should revert with ServiceCenterAlreadyRevoked when revoking an already revoked service center", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      await passportRegistry.connect(admin).revokeServiceCenter(serviceCenter1.address);

      await expect(
        passportRegistry.connect(admin).revokeServiceCenter(serviceCenter1.address)
      ).to.be.revertedWithCustomError(passportRegistry, "ServiceCenterAlreadyRevoked")
        .withArgs(serviceCenter1.address);
    });

    it("should allow admin to re-register a revoked service center preserving original registeredAt", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      const scBefore = await passportRegistry.getServiceCenter(serviceCenter1.address);
      const originalRegisteredAt = scBefore.registeredAt;

      await passportRegistry.connect(admin).revokeServiceCenter(serviceCenter1.address);
      expect(await passportRegistry.isApprovedServiceCenter(serviceCenter1.address)).to.be.false;

      // Re-register
      await passportRegistry.connect(admin).registerServiceCenter(
        serviceCenter1.address,
        "Swiss Care Authorized Again"
      );
      expect(await passportRegistry.isApprovedServiceCenter(serviceCenter1.address)).to.be.true;

      const scAfter = await passportRegistry.getServiceCenter(serviceCenter1.address);
      expect(scAfter.approved).to.be.true;
      expect(scAfter.name).to.equal("Swiss Care Authorized Again");
      expect(scAfter.registeredAt).to.equal(originalRegisteredAt);
    });
  });

  describe("Service & Repair Lifecycle (Sprint 4)", function () {
    it("should successfully start service, transition status to UnderService, and emit ServiceStarted", async function () {
      const { passportRegistry, serviceCenter1 } = await deployFixture();

      expect(await passportRegistry.isUnderService(1n)).to.be.false;
      expect(await passportRegistry.getProductStatus(1n)).to.equal(0); // ProductStatus.Active

      const tx = await passportRegistry.connect(serviceCenter1).startService(1n);

      await expect(tx)
        .to.emit(passportRegistry, "ServiceStarted")
        .withArgs(1n, serviceCenter1.address, (val: any) => val > 0n);

      expect(await passportRegistry.isUnderService(1n)).to.be.true;
      expect(await passportRegistry.getProductStatus(1n)).to.equal(1); // ProductStatus.UnderService
    });

    it("should successfully complete service, increment repairCount, update timestamp, restore status, and emit events", async function () {
      const { passportRegistry, ethers, serviceCenter1 } = await deployFixture();

      // Initial state
      expect(await passportRegistry.getRepairCount(1n)).to.equal(0n);
      expect(await passportRegistry.getLastRepairTimestamp(1n)).to.equal(0n);

      // Start service
      await passportRegistry.connect(serviceCenter1).startService(1n);

      // Complete service
      const description = "Replaced mainspring and performed escapement calibration.";
      const tx = await passportRegistry.connect(serviceCenter1).completeService(1n, description);

      await expect(tx)
        .to.emit(passportRegistry, "RepairAdded")
        .withArgs(1n, serviceCenter1.address, description, 1n, (val: any) => val > 0n);

      await expect(tx)
        .to.emit(passportRegistry, "ServiceCompleted")
        .withArgs(1n, serviceCenter1.address, (val: any) => val > 0n);

      // Verification
      expect(await passportRegistry.isUnderService(1n)).to.be.false;
      expect(await passportRegistry.getProductStatus(1n)).to.equal(0); // Restored to Active
      expect(await passportRegistry.getRepairCount(1n)).to.equal(1n);
      expect(await passportRegistry.getLastRepairTimestamp(1n)).to.equal((await ethers.provider.getBlock("latest"))!.timestamp);

      // Second repair session
      await passportRegistry.connect(serviceCenter1).startService(1n);
      const tx2 = await passportRegistry.connect(serviceCenter1).completeService(1n, "Polished sapphire bezel.");

      await expect(tx2)
        .to.emit(passportRegistry, "RepairAdded")
        .withArgs(1n, serviceCenter1.address, "Polished sapphire bezel.", 2n, (val: any) => val > 0n);

      expect(await passportRegistry.getRepairCount(1n)).to.equal(2n);
    });

    it("should revert with Unauthorized when called by unapproved address or revoked service center", async function () {
      const { passportRegistry, admin, serviceCenter1, unauthorizedUser } = await deployFixture();

      // Unapproved address
      await expect(
        passportRegistry.connect(unauthorizedUser).startService(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");

      // Revoked service center
      await passportRegistry.connect(admin).revokeServiceCenter(serviceCenter1.address);
      await expect(
        passportRegistry.connect(serviceCenter1).startService(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with AlreadyUnderService when attempting duplicate service start", async function () {
      const { passportRegistry, serviceCenter1 } = await deployFixture();

      await passportRegistry.connect(serviceCenter1).startService(1n);

      await expect(
        passportRegistry.connect(serviceCenter1).startService(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "AlreadyUnderService")
        .withArgs(1n);
    });

    it("should revert with NotUnderService when completeService is called without active service", async function () {
      const { passportRegistry, serviceCenter1 } = await deployFixture();

      await expect(
        passportRegistry.connect(serviceCenter1).completeService(1n, "Routine inspection")
      ).to.be.revertedWithCustomError(passportRegistry, "NotUnderService")
        .withArgs(1n);
    });

    it("should revert with PassportNotFound for non-existent passport IDs", async function () {
      const { passportRegistry, serviceCenter1 } = await deployFixture();

      await expect(
        passportRegistry.connect(serviceCenter1).startService(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);

      await expect(
        passportRegistry.connect(serviceCenter1).completeService(999n, "Inspection")
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);

      await expect(
        passportRegistry.getRepairCount(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);

      await expect(
        passportRegistry.getLastRepairTimestamp(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);

      await expect(
        passportRegistry.isUnderService(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);
    });

    it("should revert with EmptyString or StringTooLong for invalid repair descriptions", async function () {
      const { passportRegistry, serviceCenter1 } = await deployFixture();

      await passportRegistry.connect(serviceCenter1).startService(1n);

      // Empty description
      await expect(
        passportRegistry.connect(serviceCenter1).completeService(1n, "")
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString")
        .withArgs("description");

      // Exceeds 256 bytes
      const longDescription = "R".repeat(257);
      await expect(
        passportRegistry.connect(serviceCenter1).completeService(1n, longDescription)
      ).to.be.revertedWithCustomError(passportRegistry, "StringTooLong")
        .withArgs("description", 256);
    });

    it("should revert with NotCurrentServiceCenter when a different approved service center attempts to complete someone else's service", async function () {
      const { passportRegistry, serviceCenter1, serviceCenter2 } = await deployFixture();

      // serviceCenter1 starts service
      await passportRegistry.connect(serviceCenter1).startService(1n);

      // serviceCenter2 attempts to complete service
      await expect(
        passportRegistry.connect(serviceCenter2).completeService(1n, "Attempted unauthorized completion")
      ).to.be.revertedWithCustomError(passportRegistry, "NotCurrentServiceCenter")
        .withArgs(1n);

      // serviceCenter1 can successfully complete
      await expect(
        passportRegistry.connect(serviceCenter1).completeService(1n, "Legitimate completion")
      ).to.emit(passportRegistry, "ServiceCompleted");
    });

    it("should revert with AlreadyReportedStolen when startService is called on a stolen product", async function () {
      const { passportRegistry, owner, serviceCenter1 } = await deployFixture();

      // Report product stolen
      await passportRegistry.connect(owner).reportStolen(1n);

      expect(await passportRegistry.getProductStatus(1n)).to.equal(2); // ReportedStolen

      await expect(
        passportRegistry.connect(serviceCenter1).startService(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "AlreadyReportedStolen")
        .withArgs(1n);
    });
  });
});
