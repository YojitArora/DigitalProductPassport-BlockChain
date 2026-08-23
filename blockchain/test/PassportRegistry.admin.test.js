const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PassportRegistry - Deployment", function () {
  it("should deploy PassportRegistry successfully", async function () {
    const PassportRegistry = await ethers.getContractFactory("PassportRegistry");
    const passportRegistry = await PassportRegistry.deploy();
    await passportRegistry.waitForDeployment();

    expect(await passportRegistry.getAddress()).to.be.properAddress;
  });
});
