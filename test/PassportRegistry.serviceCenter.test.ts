import { expect } from "chai";
import { network } from "hardhat";

describe("PassportRegistry - Service Center System", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [admin, serviceCenter1, serviceCenter2, nonAdmin] = await ethers.getSigners();

    const passportRegistry = await ethers.deployContract("PassportRegistry");
    await passportRegistry.waitForDeployment();

    return { passportRegistry, ethers, admin, serviceCenter1, serviceCenter2, nonAdmin };
  }

  describe("registerServiceCenter", function () {
    it("should allow admin to register a service center successfully and emit ServiceCenterRegistered", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      const tx = await passportRegistry.connect(admin).registerServiceCenter(
        serviceCenter1.address,
        "Swiss Precision Care"
      );

      await expect(tx)
        .to.emit(passportRegistry, "ServiceCenterRegistered")
        .withArgs(serviceCenter1.address, "Swiss Precision Care", (val: any) => val > 0n);

      expect(await passportRegistry.isApprovedServiceCenter(serviceCenter1.address)).to.be.true;

      const sc = await passportRegistry.getServiceCenter(serviceCenter1.address);
      expect(sc.walletAddress).to.equal(serviceCenter1.address);
      expect(sc.name).to.equal("Swiss Precision Care");
      expect(sc.approved).to.be.true;
      expect(sc.registeredAt).to.be.gt(0n);
    });

    it("should revert with Unauthorized when a non-admin attempts to register a service center", async function () {
      const { passportRegistry, nonAdmin, serviceCenter1 } = await deployFixture();

      await expect(
        passportRegistry.connect(nonAdmin).registerServiceCenter(
          serviceCenter1.address,
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
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).registerServiceCenter(
          serviceCenter1.address,
          ""
        )
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString")
        .withArgs("name");
    });

    it("should revert with StringTooLong when name exceeds MAX_NAME_LENGTH (128 bytes)", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();
      const longName = "S".repeat(129);

      await expect(
        passportRegistry.connect(admin).registerServiceCenter(
          serviceCenter1.address,
          longName
        )
      ).to.be.revertedWithCustomError(passportRegistry, "StringTooLong")
        .withArgs("name", 128);
    });

    it("should revert with ServiceCenterAlreadyExists when registering an already active service center", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      await passportRegistry.connect(admin).registerServiceCenter(
        serviceCenter1.address,
        "Swiss Care"
      );

      await expect(
        passportRegistry.connect(admin).registerServiceCenter(
          serviceCenter1.address,
          "Swiss Care Duplicate"
        )
      ).to.be.revertedWithCustomError(passportRegistry, "ServiceCenterAlreadyExists")
        .withArgs(serviceCenter1.address);
    });
  });

  describe("revokeServiceCenter", function () {
    it("should allow admin to revoke an approved service center and emit ServiceCenterRevoked", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      await passportRegistry.connect(admin).registerServiceCenter(
        serviceCenter1.address,
        "Swiss Care"
      );

      const tx = await passportRegistry.connect(admin).revokeServiceCenter(serviceCenter1.address);

      await expect(tx)
        .to.emit(passportRegistry, "ServiceCenterRevoked")
        .withArgs(serviceCenter1.address, (val: any) => val > 0n);

      expect(await passportRegistry.isApprovedServiceCenter(serviceCenter1.address)).to.be.false;

      const sc = await passportRegistry.getServiceCenter(serviceCenter1.address);
      expect(sc.approved).to.be.false;
      expect(sc.name).to.equal("Swiss Care"); // metadata preserved
    });

    it("should revert with Unauthorized when a non-admin attempts revocation", async function () {
      const { passportRegistry, admin, nonAdmin, serviceCenter1 } = await deployFixture();

      await passportRegistry.connect(admin).registerServiceCenter(
        serviceCenter1.address,
        "Swiss Care"
      );

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
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).revokeServiceCenter(serviceCenter1.address)
      ).to.be.revertedWithCustomError(passportRegistry, "ServiceCenterNotFound")
        .withArgs(serviceCenter1.address);
    });

    it("should revert with ServiceCenterAlreadyRevoked when revoking an already revoked service center", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      await passportRegistry.connect(admin).registerServiceCenter(
        serviceCenter1.address,
        "Swiss Care"
      );
      await passportRegistry.connect(admin).revokeServiceCenter(serviceCenter1.address);

      await expect(
        passportRegistry.connect(admin).revokeServiceCenter(serviceCenter1.address)
      ).to.be.revertedWithCustomError(passportRegistry, "ServiceCenterAlreadyRevoked")
        .withArgs(serviceCenter1.address);
    });

    it("should allow admin to re-register a revoked service center preserving original registeredAt", async function () {
      const { passportRegistry, admin, serviceCenter1 } = await deployFixture();

      await passportRegistry.connect(admin).registerServiceCenter(
        serviceCenter1.address,
        "Swiss Care"
      );
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
});
