import { describe, it, expect } from "vitest";
import {
  calculateInstallment,
  calculatePriceMatrix,
  getSuggestedDp,
} from "./priceCalculator";

describe("Universal Retail Price Formula (TypeScript)", () => {
  it("Lemari 2 Pintu Bet AI (HD 2.878.000, DP 0) matches exact retail sheet", () => {
    const hd = 2878000;
    const dp = 0;

    const t10 = calculateInstallment(hd, dp, 10);
    const t12 = calculateInstallment(hd, dp, 12);
    const t15 = calculateInstallment(hd, dp, 15);

    expect(t10.monthlyInstallment).toBe(350000);
    expect(t10.totalPrice).toBe(3500000);

    expect(t12.monthlyInstallment).toBe(310000);
    expect(t12.totalPrice).toBe(3720000);

    expect(t15.monthlyInstallment).toBe(270000);
    expect(t15.totalPrice).toBe(4050000);
  });

  it("Lemari 4 Pintu Bet AI (HD 5.068.000, DP 1.000.000) matches exact retail sheet", () => {
    const hd = 5068000;
    const dp = 1000000;

    const t10 = calculateInstallment(hd, dp, 10);
    const t12 = calculateInstallment(hd, dp, 12);
    const t15 = calculateInstallment(hd, dp, 15);

    expect(t10.monthlyInstallment).toBe(495000);
    expect(t12.monthlyInstallment).toBe(435000);
    expect(t15.monthlyInstallment).toBe(375000);
  });

  it("Electronics Polytron XL-5510 (HD 5.008.000, DP 1.000.000) matches exact sheet", () => {
    const hd = 5008000;
    const dp = 1000000;

    const matrix = calculatePriceMatrix(hd, dp, [10, 12, 15]);

    expect(matrix.terms[0].monthlyInstallment).toBe(485000);
    expect(matrix.terms[1].monthlyInstallment).toBe(430000);
    expect(matrix.terms[2].monthlyInstallment).toBe(370000);
  });

  it("computes suggested DP brackets correctly", () => {
    expect(getSuggestedDp(2878000)).toBe(0);
    expect(getSuggestedDp(4999000)).toBe(0);
    expect(getSuggestedDp(5000000)).toBe(1000000);
    expect(getSuggestedDp(6500000)).toBe(1500000);
    expect(getSuggestedDp(7500000)).toBe(2000000);
    expect(getSuggestedDp(8500000)).toBe(2500000);
  });
});
