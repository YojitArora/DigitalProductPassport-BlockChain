import { expect } from "chai";
import {
  getCompanyCode,
  formatDppId,
  getProductDppId,
  parseDppSearchQuery,
} from "../frontend/src/utils/dppIdUtils.js";

describe("Professional Digital Product Passport ID System", function () {
  describe("Company Code Derivation (getCompanyCode)", function () {
    it("should derive company code from first word of manufacturer name", function () {
      expect(getCompanyCode("Aura Chronometrics", "Aura")).to.equal("AURA");
      expect(getCompanyCode("Geneva Precision Watches", "Geneva")).to.equal("GENEVA");
      expect(getCompanyCode("Vanguard Horology Inc", "Vanguard")).to.equal("VANGUARD");
    });

    it("should fallback to brand name if manufacturer name is empty", function () {
      expect(getCompanyCode("", "Rolex")).to.equal("ROLEX");
      expect(getCompanyCode(undefined, "Omega")).to.equal("OMEGA");
    });

    it("should truncate long single words to 8 characters max", function () {
      expect(getCompanyCode("Supercalifragilistic", "Brand")).to.equal("SUPERCAL");
    });

    it("should fallback to DPP if both name and brand are missing", function () {
      expect(getCompanyCode("", "")).to.equal("DPP");
      expect(getCompanyCode(undefined, undefined)).to.equal("DPP");
    });
  });

  describe("DPP ID Formatting (formatDppId)", function () {
    it("should format sequence number with 6-digit zero padding", function () {
      expect(formatDppId("AURA", 1)).to.equal("DPP-AURA-000001");
      expect(formatDppId("AURA", 42)).to.equal("DPP-AURA-000042");
      expect(formatDppId("GENEVA", 999999)).to.equal("DPP-GENEVA-999999");
      expect(formatDppId("OMEGA", 1000000n)).to.equal("DPP-OMEGA-1000000");
    });
  });

  describe("Product DPP ID Generation (getProductDppId)", function () {
    it("should generate professional DPP ID for a Product entity", function () {
      const p = {
        passportId: 1n,
        productName: "Aura Chrono Master",
        brand: "Aura",
      };
      expect(getProductDppId(p, "Aura Chronometrics", 1)).to.equal("DPP-AURA-000001");
    });
  });

  describe("Search Query Parser (parseDppSearchQuery)", function () {
    it("should parse pure numeric strings", function () {
      const res = parseDppSearchQuery("1");
      expect(res.isNumeric).to.be.true;
      expect(res.numericId).to.equal(1n);
    });

    it("should parse hash prefixed numbers (#1, #25)", function () {
      const res = parseDppSearchQuery("#25");
      expect(res.isNumeric).to.be.true;
      expect(res.numericId).to.equal(25n);
    });

    it("should parse legacy DPP numeric prefixes (DPP-1, dpp-5)", function () {
      const res = parseDppSearchQuery("DPP-5");
      expect(res.isNumeric).to.be.true;
      expect(res.numericId).to.equal(5n);
    });

    it("should parse Professional DPP IDs (DPP-AURA-000001)", function () {
      const res = parseDppSearchQuery("DPP-AURA-000001");
      expect(res.isNumeric).to.be.false;
      expect(res.dppIdString).to.equal("DPP-AURA-000001");
    });

    it("should normalize and trim case for DPP IDs", function () {
      const res = parseDppSearchQuery("  dpp-aura-000002  ");
      expect(res.dppIdString).to.equal("DPP-AURA-000002");
    });
  });
});
