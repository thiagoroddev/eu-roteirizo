import { describe, it, expect, vi } from "vitest";
import { getCorreiosDeliveryStatus } from "../../utils/correiosDelivery";
import { DELIVERY_KEYS } from "../../constants";

// 1. DATA MOCK
// We simulate JSON so as not to depend on the real file (which may change).
// We define two test zip codes: one with delivery ("Yes") and one without ("No").
vi.mock("../../data/zipcodes-delivery-status-correios.json", () => ({
  default: {
    "10000000": {
      zipcode: "10000000",
      homeDelivery: "Yes",
      message: "Entrega domiciliar",
      date: "2025-12-03T01:56:09.528Z",
    },
    "20000000": {
      zipcode: "20000000",
      homeDelivery: "No",
      message: "A entrega será realizada na unidade dos Correios habilitada mais próxima do endereço do destinatário.",
      date: "2025-12-03T01:55:56.087Z",
    },
  },
}));

describe("getCorreiosDeliveryStatus", () => {
  // ========================================================================================
  // SUCCESS SCENARIOS (HAPPY PATH)
  // ========================================================================================

  it("returns YES when dataset indicates 'Yes'", () => {
    // ZIP code 10000000 is mocked as "Yes"
    const result = getCorreiosDeliveryStatus("10000000");
    expect(result).toBe(DELIVERY_KEYS.YES);
  });

  it("returns NO when dataset indicates 'No'", () => {
    // ZIP code 20000000 is mocked as "No"
    const result = getCorreiosDeliveryStatus("20000000");
    expect(result).toBe(DELIVERY_KEYS.NO);
  });

  // ========================================================================================
  // SANITIZATION SCENARIOS (DATA CLEANING)
  // ========================================================================================

  it("handles formatted strings (removes dots and dashes)", () => {
    // "10.000-000" should become "10000000" and find "Yes"
    const result = getCorreiosDeliveryStatus("10.000-000");
    expect(result).toBe(DELIVERY_KEYS.YES);
  });

  it("handles numeric inputs correctly", () => {
    // The number 10000000 should become the string "10000000"
    const result = getCorreiosDeliveryStatus(10000000);
    expect(result).toBe(DELIVERY_KEYS.YES);
  });

  it("handles strings with whitespace", () => {
    const result = getCorreiosDeliveryStatus(" 20000000 ");
    expect(result).toBe(DELIVERY_KEYS.NO);
  });

  // ========================================================================================
  // ERROR SCENARIOS AND INVALID DATA
  // ========================================================================================

  it("returns undefined for ZIP codes not present in the dataset", () => {
    // "99999999" is a valid ZIP code (8 digits) but does not exist in our mock
    const result = getCorreiosDeliveryStatus("99999999");
    expect(result).toBeUndefined();
  });

  it("returns undefined for input with incorrect length (short)", () => {
    const result = getCorreiosDeliveryStatus("123");
    expect(result).toBeUndefined();
  });

  it("returns undefined for input with incorrect length (long)", () => {
    const result = getCorreiosDeliveryStatus("123456789");
    expect(result).toBeUndefined();
  });

  it("returns undefined for input containing letters", () => {
    const result = getCorreiosDeliveryStatus("10000ABC");
    expect(result).toBeUndefined();
  });

  it("returns undefined for null, undefined, or empty strings", () => {
    expect(getCorreiosDeliveryStatus(null)).toBeUndefined();
    expect(getCorreiosDeliveryStatus(undefined)).toBeUndefined();
    expect(getCorreiosDeliveryStatus("")).toBeUndefined();
  });
});
