import { expect } from "chai";
import { network } from "hardhat";

describe("PassportRegistry - Admin & Deployment", function () {
  it("should deploy PassportRegistry successfully", async function () {
    const { ethers } = await network.create();
    const passportRegistry = await ethers.deployContract("PassportRegistry");
    await passportRegistry.waitForDeployment();

    expect(await passportRegistry.getAddress()).to.be.properAddress;
  });
});
