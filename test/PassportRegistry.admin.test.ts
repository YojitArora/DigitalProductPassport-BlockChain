import { expect } from "chai";
import { network } from "hardhat";

describe("PassportRegistry - Admin System", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [deployer, admin2, nonAdmin, zeroAddressUser] = await ethers.getSigners();

    const passportRegistry = await ethers.deployContract("PassportRegistry");
    await passportRegistry.waitForDeployment();

    return { passportRegistry, ethers, deployer, admin2, nonAdmin, zeroAddressUser };
  }

  describe("Deployment & Initial State", function () {
    it("should set the deployer as the initial admin", async function () {
      const { passportRegistry, deployer } = await deployFixture();
      expect(await passportRegistry.isAdmin(deployer.address)).to.be.true;
    });

    it("should return false for non-admin accounts", async function () {
      const { passportRegistry, nonAdmin } = await deployFixture();
      expect(await passportRegistry.isAdmin(nonAdmin.address)).to.be.false;
    });
  });

  describe("addAdmin", function () {
    it("should allow an existing admin to add a new admin and emit AdminAdded event", async function () {
      const { passportRegistry, deployer, admin2 } = await deployFixture();

      const tx = await passportRegistry.connect(deployer).addAdmin(admin2.address);
      const receipt = await tx.wait();

      expect(await passportRegistry.isAdmin(admin2.address)).to.be.true;

      // Verify event emission
      await expect(tx)
        .to.emit(passportRegistry, "AdminAdded")
        .withArgs(admin2.address, deployer.address, (val: any) => val > 0n);
    });

    it("should allow the newly added admin to add further admins", async function () {
      const { passportRegistry, deployer, admin2, nonAdmin } = await deployFixture();

      await passportRegistry.connect(deployer).addAdmin(admin2.address);
      await passportRegistry.connect(admin2).addAdmin(nonAdmin.address);

      expect(await passportRegistry.isAdmin(nonAdmin.address)).to.be.true;
    });

    it("should revert with Unauthorized when called by a non-admin", async function () {
      const { passportRegistry, nonAdmin, admin2 } = await deployFixture();

      await expect(
        passportRegistry.connect(nonAdmin).addAdmin(admin2.address)
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with ZeroAddress when adding address(0)", async function () {
      const { passportRegistry, deployer, ethers } = await deployFixture();

      await expect(
        passportRegistry.connect(deployer).addAdmin(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(passportRegistry, "ZeroAddress");
    });

    it("should revert with AdminAlreadyExists when adding an existing admin", async function () {
      const { passportRegistry, deployer, admin2 } = await deployFixture();

      await passportRegistry.connect(deployer).addAdmin(admin2.address);

      await expect(
        passportRegistry.connect(deployer).addAdmin(admin2.address)
      ).to.be.revertedWithCustomError(passportRegistry, "AdminAlreadyExists")
        .withArgs(admin2.address);
    });
  });
});
