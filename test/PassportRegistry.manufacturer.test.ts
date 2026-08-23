import { expect } from "chai";
import { network } from "hardhat";

describe("PassportRegistry - Manufacturer System", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [admin, manufacturer1, manufacturer2, nonAdmin] = await ethers.getSigners();

    const passportRegistry = await ethers.deployContract("PassportRegistry");
    await passportRegistry.waitForDeployment();

    return { passportRegistry, ethers, admin, manufacturer1, manufacturer2, nonAdmin };
  }

  describe("registerManufacturer", function () {
    it("should allow admin to register a manufacturer successfully and emit ManufacturerRegistered", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      const tx = await passportRegistry.connect(admin).registerManufacturer(
        manufacturer1.address,
        "Acme Chronographs"
      );

      await expect(tx)
        .to.emit(passportRegistry, "ManufacturerRegistered")
        .withArgs(manufacturer1.address, "Acme Chronographs", (val: any) => val > 0n);

      expect(await passportRegistry.isApprovedManufacturer(manufacturer1.address)).to.be.true;

      const mfg = await passportRegistry.getManufacturer(manufacturer1.address);
      expect(mfg.walletAddress).to.equal(manufacturer1.address);
      expect(mfg.name).to.equal("Acme Chronographs");
      expect(mfg.approved).to.be.true;
      expect(mfg.registeredAt).to.be.gt(0n);
    });

    it("should revert with Unauthorized when a non-admin attempts to register a manufacturer", async function () {
      const { passportRegistry, nonAdmin, manufacturer1 } = await deployFixture();

      await expect(
        passportRegistry.connect(nonAdmin).registerManufacturer(
          manufacturer1.address,
          "Unauthorized Brand"
        )
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with ZeroAddress when manufacturer address is address(0)", async function () {
      const { passportRegistry, admin, ethers } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).registerManufacturer(
          ethers.ZeroAddress,
          "Zero Address Brand"
        )
      ).to.be.revertedWithCustomError(passportRegistry, "ZeroAddress");
    });

    it("should revert with EmptyString when name is empty", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).registerManufacturer(
          manufacturer1.address,
          ""
        )
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString")
        .withArgs("name");
    });

    it("should revert with StringTooLong when name exceeds MAX_NAME_LENGTH (128 bytes)", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();
      const longName = "A".repeat(129);

      await expect(
        passportRegistry.connect(admin).registerManufacturer(
          manufacturer1.address,
          longName
        )
      ).to.be.revertedWithCustomError(passportRegistry, "StringTooLong")
        .withArgs("name", 128);
    });

    it("should revert with ManufacturerAlreadyExists when registering an already active manufacturer", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      await passportRegistry.connect(admin).registerManufacturer(
        manufacturer1.address,
        "Acme Brand"
      );

      await expect(
        passportRegistry.connect(admin).registerManufacturer(
          manufacturer1.address,
          "Acme Brand Duplicate"
        )
      ).to.be.revertedWithCustomError(passportRegistry, "ManufacturerAlreadyExists")
        .withArgs(manufacturer1.address);
    });
  });

  describe("revokeManufacturer", function () {
    it("should allow admin to revoke an approved manufacturer and emit ManufacturerRevoked", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      await passportRegistry.connect(admin).registerManufacturer(
        manufacturer1.address,
        "Acme Brand"
      );

      const tx = await passportRegistry.connect(admin).revokeManufacturer(manufacturer1.address);

      await expect(tx)
        .to.emit(passportRegistry, "ManufacturerRevoked")
        .withArgs(manufacturer1.address, (val: any) => val > 0n);

      expect(await passportRegistry.isApprovedManufacturer(manufacturer1.address)).to.be.false;

      const mfg = await passportRegistry.getManufacturer(manufacturer1.address);
      expect(mfg.approved).to.be.false;
      expect(mfg.name).to.equal("Acme Brand"); // metadata preserved
    });

    it("should revert with Unauthorized when a non-admin attempts revocation", async function () {
      const { passportRegistry, admin, nonAdmin, manufacturer1 } = await deployFixture();

      await passportRegistry.connect(admin).registerManufacturer(
        manufacturer1.address,
        "Acme Brand"
      );

      await expect(
        passportRegistry.connect(nonAdmin).revokeManufacturer(manufacturer1.address)
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with ZeroAddress when revoking address(0)", async function () {
      const { passportRegistry, admin, ethers } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).revokeManufacturer(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(passportRegistry, "ZeroAddress");
    });

    it("should revert with ManufacturerNotFound when revoking an address that was never registered", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).revokeManufacturer(manufacturer1.address)
      ).to.be.revertedWithCustomError(passportRegistry, "ManufacturerNotFound")
        .withArgs(manufacturer1.address);
    });

    it("should revert with ManufacturerAlreadyRevoked when revoking an already revoked manufacturer", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      await passportRegistry.connect(admin).registerManufacturer(
        manufacturer1.address,
        "Acme Brand"
      );
      await passportRegistry.connect(admin).revokeManufacturer(manufacturer1.address);

      await expect(
        passportRegistry.connect(admin).revokeManufacturer(manufacturer1.address)
      ).to.be.revertedWithCustomError(passportRegistry, "ManufacturerAlreadyRevoked")
        .withArgs(manufacturer1.address);
    });

    it("should allow admin to re-register a revoked manufacturer preserving original registeredAt", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      await passportRegistry.connect(admin).registerManufacturer(
        manufacturer1.address,
        "Acme Brand"
      );
      const mfgBefore = await passportRegistry.getManufacturer(manufacturer1.address);
      const originalRegisteredAt = mfgBefore.registeredAt;

      await passportRegistry.connect(admin).revokeManufacturer(manufacturer1.address);
      expect(await passportRegistry.isApprovedManufacturer(manufacturer1.address)).to.be.false;

      // Re-register
      await passportRegistry.connect(admin).registerManufacturer(
        manufacturer1.address,
        "Acme Brand Re-Authorized"
      );
      expect(await passportRegistry.isApprovedManufacturer(manufacturer1.address)).to.be.true;

      const mfgAfter = await passportRegistry.getManufacturer(manufacturer1.address);
      expect(mfgAfter.approved).to.be.true;
      expect(mfgAfter.name).to.equal("Acme Brand Re-Authorized");
      expect(mfgAfter.registeredAt).to.equal(originalRegisteredAt);
    });
  });
});
