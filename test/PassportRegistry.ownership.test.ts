import { expect } from "chai";
import { network } from "hardhat";

describe("PassportRegistry - Two-Step Ownership Transfer System (Sprint 3)", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [admin, manufacturer, owner1, owner2, buyer, unauthorizedUser] = await ethers.getSigners();

    const passportRegistry = await ethers.deployContract("PassportRegistry");
    await passportRegistry.waitForDeployment();

    // Register manufacturer
    await passportRegistry.connect(admin).registerManufacturer(
      manufacturer.address,
      "Acme Luxury Horology"
    );

    // Register passport 1 with initial owner owner1
    await passportRegistry.connect(manufacturer).registerProduct(
      owner1.address,
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
      owner1,
      owner2,
      buyer,
      unauthorizedUser,
    };
  }

  describe("initiateTransfer", function () {
    it("should successfully initiate an ownership transfer and emit OwnershipTransferRequested", async function () {
      const { passportRegistry, owner1, buyer } = await deployFixture();

      expect(await passportRegistry.hasPendingTransfer(1n)).to.be.false;

      const tx = await passportRegistry.connect(owner1).initiateTransfer(1n, buyer.address);

      await expect(tx)
        .to.emit(passportRegistry, "OwnershipTransferRequested")
        .withArgs(1n, owner1.address, buyer.address, (val: any) => val > 0n);

      expect(await passportRegistry.hasPendingTransfer(1n)).to.be.true;

      const pending = await passportRegistry.getPendingTransfer(1n);
      expect(pending.to).to.equal(buyer.address);
      expect(pending.exists).to.be.true;
      expect(pending.requestedAt).to.be.gt(0n);
    });

    it("should revert with Unauthorized when called by non-owner", async function () {
      const { passportRegistry, unauthorizedUser, buyer } = await deployFixture();

      await expect(
        passportRegistry.connect(unauthorizedUser).initiateTransfer(1n, buyer.address)
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with PassportNotFound when passport does not exist", async function () {
      const { passportRegistry, owner1, buyer } = await deployFixture();

      await expect(
        passportRegistry.connect(owner1).initiateTransfer(999n, buyer.address)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);
    });

    it("should revert with ZeroAddress when recipient is address(0)", async function () {
      const { passportRegistry, owner1, ethers } = await deployFixture();

      await expect(
        passportRegistry.connect(owner1).initiateTransfer(1n, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(passportRegistry, "ZeroAddress");
    });

    it("should revert with TransferToSelf when owner attempts to transfer to self", async function () {
      const { passportRegistry, owner1 } = await deployFixture();

      await expect(
        passportRegistry.connect(owner1).initiateTransfer(1n, owner1.address)
      ).to.be.revertedWithCustomError(passportRegistry, "TransferToSelf");
    });

    it("should revert with TransferAlreadyPending when a transfer is already pending", async function () {
      const { passportRegistry, owner1, buyer, owner2 } = await deployFixture();

      await passportRegistry.connect(owner1).initiateTransfer(1n, buyer.address);

      await expect(
        passportRegistry.connect(owner1).initiateTransfer(1n, owner2.address)
      ).to.be.revertedWithCustomError(passportRegistry, "TransferAlreadyPending")
        .withArgs(1n);
    });

    it("should revert with AlreadyReportedStolen when product is in ReportedStolen status", async function () {
      const { passportRegistry, owner1, buyer } = await deployFixture();

      // Report product stolen
      await passportRegistry.connect(owner1).reportStolen(1n);

      // Verify status is ReportedStolen (2)
      expect(await passportRegistry.getProductStatus(1n)).to.equal(2);

      // Attempting initiateTransfer should revert with AlreadyReportedStolen(1)
      await expect(
        passportRegistry.connect(owner1).initiateTransfer(1n, buyer.address)
      ).to.be.revertedWithCustomError(passportRegistry, "AlreadyReportedStolen")
        .withArgs(1n);
    });
  });

  describe("acceptTransfer", function () {
    it("should successfully accept a pending transfer and emit OwnershipTransferAccepted", async function () {
      const { passportRegistry, owner1, buyer } = await deployFixture();

      await passportRegistry.connect(owner1).initiateTransfer(1n, buyer.address);

      const tx = await passportRegistry.connect(buyer).acceptTransfer(1n);

      await expect(tx)
        .to.emit(passportRegistry, "OwnershipTransferAccepted")
        .withArgs(1n, owner1.address, buyer.address, (val: any) => val > 0n);

      // Verify new owner
      expect(await passportRegistry.getCurrentOwner(1n)).to.equal(buyer.address);

      // Verify pending transfer is cleared
      expect(await passportRegistry.hasPendingTransfer(1n)).to.be.false;
      const pending = await passportRegistry.getPendingTransfer(1n);
      expect(pending.exists).to.be.false;
      expect(pending.to).to.equal("0x0000000000000000000000000000000000000000");

      // Verify new owner can initiate a subsequent transfer
      const [newBuyer] = (await (await network.create()).ethers.getSigners()).slice(5);
      await expect(
        passportRegistry.connect(buyer).initiateTransfer(1n, newBuyer.address)
      ).to.emit(passportRegistry, "OwnershipTransferRequested");
    });

    it("should revert with NoPendingTransfer when no transfer is pending", async function () {
      const { passportRegistry, buyer } = await deployFixture();

      await expect(
        passportRegistry.connect(buyer).acceptTransfer(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "NoPendingTransfer")
        .withArgs(1n);
    });

    it("should revert with NotPendingRecipient when called by an unauthorized account", async function () {
      const { passportRegistry, owner1, buyer, unauthorizedUser } = await deployFixture();

      await passportRegistry.connect(owner1).initiateTransfer(1n, buyer.address);

      await expect(
        passportRegistry.connect(unauthorizedUser).acceptTransfer(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "NotPendingRecipient")
        .withArgs(1n, unauthorizedUser.address);
    });

    it("should revert with PassportNotFound when passport does not exist", async function () {
      const { passportRegistry, buyer } = await deployFixture();

      await expect(
        passportRegistry.connect(buyer).acceptTransfer(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);
    });
  });

  describe("cancelTransfer", function () {
    it("should successfully cancel an active pending transfer and emit OwnershipTransferCancelled", async function () {
      const { passportRegistry, owner1, buyer } = await deployFixture();

      await passportRegistry.connect(owner1).initiateTransfer(1n, buyer.address);
      expect(await passportRegistry.hasPendingTransfer(1n)).to.be.true;

      const tx = await passportRegistry.connect(owner1).cancelTransfer(1n);

      await expect(tx)
        .to.emit(passportRegistry, "OwnershipTransferCancelled")
        .withArgs(1n, owner1.address, buyer.address, (val: any) => val > 0n);

      // Verify pending transfer is cleared
      expect(await passportRegistry.hasPendingTransfer(1n)).to.be.false;

      // Verify original owner remains owner
      expect(await passportRegistry.getCurrentOwner(1n)).to.equal(owner1.address);

      // Verify buyer can no longer accept
      await expect(
        passportRegistry.connect(buyer).acceptTransfer(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "NoPendingTransfer")
        .withArgs(1n);
    });

    it("should revert with Unauthorized when a non-owner attempts cancellation", async function () {
      const { passportRegistry, owner1, buyer, unauthorizedUser } = await deployFixture();

      await passportRegistry.connect(owner1).initiateTransfer(1n, buyer.address);

      await expect(
        passportRegistry.connect(unauthorizedUser).cancelTransfer(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with NoPendingTransfer when attempting to cancel with no active transfer", async function () {
      const { passportRegistry, owner1 } = await deployFixture();

      await expect(
        passportRegistry.connect(owner1).cancelTransfer(1n)
      ).to.be.revertedWithCustomError(passportRegistry, "NoPendingTransfer")
        .withArgs(1n);
    });

    it("should revert with PassportNotFound when passport does not exist", async function () {
      const { passportRegistry, owner1 } = await deployFixture();

      await expect(
        passportRegistry.connect(owner1).cancelTransfer(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);
    });
  });

  describe("Public Views (getPendingTransfer, hasPendingTransfer)", function () {
    it("should revert with PassportNotFound for non-existent passport IDs", async function () {
      const { passportRegistry } = await deployFixture();

      await expect(
        passportRegistry.getPendingTransfer(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);

      await expect(
        passportRegistry.hasPendingTransfer(999n)
      ).to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);
    });
  });
});
