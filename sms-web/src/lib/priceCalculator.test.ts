import { describe, it, expect } from "vitest";
import {
  calculateInstallment,
  calculatePriceMatrix,
  calculateBundleSimulation,
  generateBundleShareSummary,
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

  it("G.15: simulates multi-product bundle combining TV and Sofa with aggregated DP and shared installment schedule", () => {
    const items = [
      { id: "1", name: "Smart TV 55 Inch", category: "Elektronik", quantity: 1, hargaDasar: 5000000 },
      { id: "2", name: "Sofa Bed L-Shape", category: "Furnitur", quantity: 1, hargaDasar: 3500000 },
    ];

    const simulation = calculateBundleSimulation(items, { terms: [10, 12, 15] });

    expect(simulation.totalHargaDasar).toBe(8500000);
    expect(simulation.bundleDiscount).toBe(0);
    expect(simulation.netHargaDasar).toBe(8500000);
    expect(simulation.downPayment).toBe(2500000); // Bracket for 8.5M
    expect(simulation.autoDpApplied).toBe(true);

    const term10 = simulation.terms.find((t) => t.termMonths === 10);
    expect(term10).toBeDefined();
    expect(term10?.monthlyInstallment).toBe(725000);

    // Standalone separate financing comparison
    // TV (5M, 1M DP) @ 10 mo = 485.000
    // Sofa (3.5M, 0 DP) @ 10 mo = 425.000
    // Total separate = 910.000
    expect(simulation.separateTotalInstallments[10]).toBe(910000);
    expect(simulation.monthlySavings[10]).toBe(185000); // 910.000 - 725.000

    const summary = generateBundleShareSummary(simulation, { storeName: "Showroom SMS" });
    expect(summary).toContain("SIMULASI KREDIT PAKET BUNDLE SHOWROOM");
    expect(summary).toContain("Smart TV 55 Inch");
    expect(summary).toContain("Sofa Bed L-Shape");
    expect(summary).toContain("Rp 725.000");
  });

  it("G.15: applies bundle promotional discount correctly", () => {
    const items = [
      { id: "1", name: "Kulkas 2 Pintu", category: "Elektronik", quantity: 1, hargaDasar: 4000000 },
      { id: "2", name: "Mesin Cuci", category: "Elektronik", quantity: 1, hargaDasar: 2000000 },
    ];

    // 10% promo bundle discount
    const simulation = calculateBundleSimulation(items, {
      discountPercent: 10,
      downPayment: 500000,
      terms: [10],
    });

    expect(simulation.totalHargaDasar).toBe(6000000);
    expect(simulation.bundleDiscount).toBe(600000);
    expect(simulation.netHargaDasar).toBe(5400000);
    expect(simulation.downPayment).toBe(500000);
  });
});
