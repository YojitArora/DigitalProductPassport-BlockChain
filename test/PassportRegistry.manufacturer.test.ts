import { expect } from "chai";
import { network } from "hardhat";

describe("PassportRegistry - Manufacturer & Product Passport System", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [admin, manufacturer1, manufacturer2, initialOwner, nonAdmin, otherAccount] = await ethers.getSigners();

    const passportRegistry = await ethers.deployContract("PassportRegistry");
    await passportRegistry.waitForDeployment();

    // Register manufacturer1 and manufacturer2
    await passportRegistry.connect(admin).registerManufacturer(
      manufacturer1.address,
      "Acme Chronographs"
    );
    await passportRegistry.connect(admin).registerManufacturer(
      manufacturer2.address,
      "Apex Electronics"
    );

    return {
      passportRegistry,
      ethers,
      admin,
      manufacturer1,
      manufacturer2,
      initialOwner,
      nonAdmin,
      otherAccount,
    };
  }

  describe("Manufacturer Registration & Role Management (Sprint 1)", function () {
    it("should allow admin to register a manufacturer successfully and emit ManufacturerRegistered", async function () {
      const { passportRegistry, admin, otherAccount } = await deployFixture();

      const tx = await passportRegistry.connect(admin).registerManufacturer(
        otherAccount.address,
        "Zenith Automotives"
      );

      await expect(tx)
        .to.emit(passportRegistry, "ManufacturerRegistered")
        .withArgs(otherAccount.address, "Zenith Automotives", (val: any) => val > 0n);

      expect(await passportRegistry.isApprovedManufacturer(otherAccount.address)).to.be.true;

      const mfg = await passportRegistry.getManufacturer(otherAccount.address);
      expect(mfg.walletAddress).to.equal(otherAccount.address);
      expect(mfg.name).to.equal("Zenith Automotives");
      expect(mfg.approved).to.be.true;
      expect(mfg.registeredAt).to.be.gt(0n);
    });

    it("should revert with Unauthorized when a non-admin attempts to register a manufacturer", async function () {
      const { passportRegistry, nonAdmin, otherAccount } = await deployFixture();

      await expect(
        passportRegistry.connect(nonAdmin).registerManufacturer(
          otherAccount.address,
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
      const { passportRegistry, admin, otherAccount } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).registerManufacturer(
          otherAccount.address,
          ""
        )
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString")
        .withArgs("name");
    });

    it("should revert with StringTooLong when name exceeds MAX_NAME_LENGTH (128 bytes)", async function () {
      const { passportRegistry, admin, otherAccount } = await deployFixture();
      const longName = "A".repeat(129);

      await expect(
        passportRegistry.connect(admin).registerManufacturer(
          otherAccount.address,
          longName
        )
      ).to.be.revertedWithCustomError(passportRegistry, "StringTooLong")
        .withArgs("name", 128);
    });

    it("should revert with ManufacturerAlreadyExists when registering an already active manufacturer", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).registerManufacturer(
          manufacturer1.address,
          "Acme Brand Duplicate"
        )
      ).to.be.revertedWithCustomError(passportRegistry, "ManufacturerAlreadyExists")
        .withArgs(manufacturer1.address);
    });

    it("should allow admin to revoke an approved manufacturer and emit ManufacturerRevoked", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      const tx = await passportRegistry.connect(admin).revokeManufacturer(manufacturer1.address);

      await expect(tx)
        .to.emit(passportRegistry, "ManufacturerRevoked")
        .withArgs(manufacturer1.address, (val: any) => val > 0n);

      expect(await passportRegistry.isApprovedManufacturer(manufacturer1.address)).to.be.false;

      const mfg = await passportRegistry.getManufacturer(manufacturer1.address);
      expect(mfg.approved).to.be.false;
      expect(mfg.name).to.equal("Acme Chronographs");
    });

    it("should revert with Unauthorized when a non-admin attempts revocation", async function () {
      const { passportRegistry, nonAdmin, manufacturer1 } = await deployFixture();

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
      const { passportRegistry, admin, otherAccount } = await deployFixture();

      await expect(
        passportRegistry.connect(admin).revokeManufacturer(otherAccount.address)
      ).to.be.revertedWithCustomError(passportRegistry, "ManufacturerNotFound")
        .withArgs(otherAccount.address);
    });

    it("should revert with ManufacturerAlreadyRevoked when revoking an already revoked manufacturer", async function () {
      const { passportRegistry, admin, manufacturer1 } = await deployFixture();

      await passportRegistry.connect(admin).revokeManufacturer(manufacturer1.address);

      await expect(
        passportRegistry.connect(admin).revokeManufacturer(manufacturer1.address)
      ).to.be.revertedWithCustomError(passportRegistry, "ManufacturerAlreadyRevoked")
        .withArgs(manufacturer1.address);
    });
  });

  describe("Product Passport Registration & Lifecycle (Sprint 2)", function () {
    const validProduct = {
      productName: "Heritage Chronometer",
      brand: "Acme Watches",
      category: "Timepieces",
      modelNumber: "AC-2024-LUX",
      serialNumber: "SN-998877",
      manufactureDate: 1704067200, // Jan 1, 2024
    };

    it("should initialize nextPassportId at 1", async function () {
      const { passportRegistry } = await deployFixture();
      expect(await passportRegistry.getNextPassportId()).to.equal(1n);
    });

    it("should successfully register a product by an approved manufacturer", async function () {
      const { passportRegistry, manufacturer1, initialOwner } = await deployFixture();

      const tx = await passportRegistry.connect(manufacturer1).registerProduct(
        initialOwner.address,
        validProduct.productName,
        validProduct.brand,
        validProduct.category,
        validProduct.modelNumber,
        validProduct.serialNumber,
        validProduct.manufactureDate
      );

      // Verify event emission with rich metadata
      await expect(tx)
        .to.emit(passportRegistry, "ProductRegistered")
        .withArgs(
          1n,
          manufacturer1.address,
          initialOwner.address,
          validProduct.serialNumber,
          validProduct.productName,
          (val: any) => val > 0n
        );

      // Verify passportExists
      expect(await passportRegistry.passportExists(1n)).to.be.true;
      expect(await passportRegistry.passportExists(2n)).to.be.false;

      // Verify nextPassportId incremented
      expect(await passportRegistry.getNextPassportId()).to.equal(2n);

      // Verify product entity details
      const product = await passportRegistry.getProduct(1n);
      expect(product.passportId).to.equal(1n);
      expect(product.manufacturer).to.equal(manufacturer1.address);
      expect(product.currentOwner).to.equal(initialOwner.address);
      expect(product.status).to.equal(0); // ProductStatus.Active
      expect(product.productName).to.equal(validProduct.productName);
      expect(product.brand).to.equal(validProduct.brand);
      expect(product.category).to.equal(validProduct.category);
      expect(product.modelNumber).to.equal(validProduct.modelNumber);
      expect(product.serialNumber).to.equal(validProduct.serialNumber);
      expect(product.manufactureDate).to.equal(BigInt(validProduct.manufactureDate));
      expect(product.createdAt).to.be.gt(0n);
      expect(product.warranty.startTimestamp).to.equal(0n);
      expect(product.warranty.endTimestamp).to.equal(0n);

      // Verify helper queries
      expect(await passportRegistry.getCurrentOwner(1n)).to.equal(initialOwner.address);
      expect(await passportRegistry.getProductStatus(1n)).to.equal(0);
      expect(await passportRegistry.isWarrantyActive(1n)).to.be.false;
    });

    it("should auto-increment passport IDs sequentially (1, 2, 3...)", async function () {
      const { passportRegistry, manufacturer1, initialOwner } = await deployFixture();

      await passportRegistry.connect(manufacturer1).registerProduct(
        initialOwner.address,
        "Watch 1",
        "Acme",
        "Watches",
        "W-1",
        "SN-001",
        1704067200
      );

      await passportRegistry.connect(manufacturer1).registerProduct(
        initialOwner.address,
        "Watch 2",
        "Acme",
        "Watches",
        "W-2",
        "SN-002",
        1704067200
      );

      expect(await passportRegistry.getNextPassportId()).to.equal(3n);
      expect(await passportRegistry.passportExists(1n)).to.be.true;
      expect(await passportRegistry.passportExists(2n)).to.be.true;
      expect(await passportRegistry.passportExists(3n)).to.be.false;

      const p1 = await passportRegistry.getProduct(1n);
      const p2 = await passportRegistry.getProduct(2n);
      expect(p1.passportId).to.equal(1n);
      expect(p2.passportId).to.equal(2n);
    });

    it("should prevent duplicate serial numbers from the same manufacturer", async function () {
      const { passportRegistry, manufacturer1, initialOwner } = await deployFixture();

      await passportRegistry.connect(manufacturer1).registerProduct(
        initialOwner.address,
        validProduct.productName,
        validProduct.brand,
        validProduct.category,
        validProduct.modelNumber,
        validProduct.serialNumber,
        validProduct.manufactureDate
      );

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          "Second Watch",
          validProduct.brand,
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "DuplicateSerialNumber")
        .withArgs(manufacturer1.address, validProduct.serialNumber);
    });

    it("should allow different manufacturers to independently register the same serial number", async function () {
      const { passportRegistry, manufacturer1, manufacturer2, initialOwner } = await deployFixture();

      await passportRegistry.connect(manufacturer1).registerProduct(
        initialOwner.address,
        "Watch 1",
        "Acme",
        "Watches",
        "W-1",
        "SERIAL-COMMON-100",
        1704067200
      );

      // Manufacturer 2 should succeed with same serial number because namespaces are distinct
      await expect(
        passportRegistry.connect(manufacturer2).registerProduct(
          initialOwner.address,
          "Laptop 1",
          "Apex",
          "Computers",
          "L-1",
          "SERIAL-COMMON-100",
          1704067200
        )
      ).to.emit(passportRegistry, "ProductRegistered");

      expect(await passportRegistry.passportExists(1n)).to.be.true;
      expect(await passportRegistry.passportExists(2n)).to.be.true;
    });

    it("should revert with Unauthorized when caller is not an approved manufacturer", async function () {
      const { passportRegistry, nonAdmin, initialOwner } = await deployFixture();

      await expect(
        passportRegistry.connect(nonAdmin).registerProduct(
          initialOwner.address,
          validProduct.productName,
          validProduct.brand,
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with Unauthorized when manufacturer was revoked", async function () {
      const { passportRegistry, admin, manufacturer1, initialOwner } = await deployFixture();

      await passportRegistry.connect(admin).revokeManufacturer(manufacturer1.address);

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          validProduct.productName,
          validProduct.brand,
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "Unauthorized");
    });

    it("should revert with ZeroAddress when initialOwner is address(0)", async function () {
      const { passportRegistry, manufacturer1, ethers } = await deployFixture();

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          ethers.ZeroAddress,
          validProduct.productName,
          validProduct.brand,
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "ZeroAddress");
    });

    it("should revert with EmptyString on empty input strings", async function () {
      const { passportRegistry, manufacturer1, initialOwner } = await deployFixture();

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          "",
          validProduct.brand,
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString").withArgs("productName");

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          validProduct.productName,
          "",
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString").withArgs("brand");

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          validProduct.productName,
          validProduct.brand,
          "",
          validProduct.modelNumber,
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString").withArgs("category");

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          validProduct.productName,
          validProduct.brand,
          validProduct.category,
          "",
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString").withArgs("modelNumber");

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          validProduct.productName,
          validProduct.brand,
          validProduct.category,
          validProduct.modelNumber,
          "",
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "EmptyString").withArgs("serialNumber");
    });

    it("should revert with StringTooLong when string parameters exceed byte length limits", async function () {
      const { passportRegistry, manufacturer1, initialOwner } = await deployFixture();

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          "P".repeat(129),
          validProduct.brand,
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "StringTooLong").withArgs("productName", 128);

      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          validProduct.productName,
          "B".repeat(65),
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          validProduct.manufactureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "StringTooLong").withArgs("brand", 64);
    });

    it("should revert with InvalidManufactureDate when date is 0 or in the future", async function () {
      const { passportRegistry, manufacturer1, initialOwner } = await deployFixture();

      // Zero timestamp
      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          validProduct.productName,
          validProduct.brand,
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          0
        )
      ).to.be.revertedWithCustomError(passportRegistry, "InvalidManufactureDate").withArgs(0);

      // Future timestamp
      const futureDate = Math.floor(Date.now() / 1000) + 100000;
      await expect(
        passportRegistry.connect(manufacturer1).registerProduct(
          initialOwner.address,
          validProduct.productName,
          validProduct.brand,
          validProduct.category,
          validProduct.modelNumber,
          validProduct.serialNumber,
          futureDate
        )
      ).to.be.revertedWithCustomError(passportRegistry, "InvalidManufactureDate").withArgs(futureDate);
    });

    it("should revert with PassportNotFound when querying non-existent passport ID", async function () {
      const { passportRegistry } = await deployFixture();

      await expect(passportRegistry.getProduct(999n))
        .to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);

      await expect(passportRegistry.getCurrentOwner(999n))
        .to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);

      await expect(passportRegistry.getProductStatus(999n))
        .to.be.revertedWithCustomError(passportRegistry, "PassportNotFound")
        .withArgs(999n);

      // isWarrantyActive returns false for non-existent IDs without reverting
      expect(await passportRegistry.isWarrantyActive(999n)).to.be.false;
    });
  });
});
