import { describe, it, expect } from "vitest";
import {
  calculateBundle,
  getSuggestedDp,
  calculateInstallment,
  type BundleItem,
} from "./bundleCalculator";

describe("Multi-Product Credit Bundle Simulator (E-Commerce)", () => {
  it("determines suggested DP brackets according to retail policy", () => {
    expect(getSuggestedDp(3500000)).toBe(0);
    expect(getSuggestedDp(5500000)).toBe(1000000);
    expect(getSuggestedDp(6500000)).toBe(1500000);
    expect(getSuggestedDp(7500000)).toBe(2000000);
    expect(getSuggestedDp(8500000)).toBe(2500000);
  });

  it("G.15: combines TV and Sofa into blended financed contract with aggregated DP & shared schedule", () => {
    const items: BundleItem[] = [
      { id: "tv1", name: "Smart TV 55 Inch UHD", category: "Elektronik", price: 5000000, quantity: 1 },
      { id: "sofa1", name: "Sofa Bed L-Shape Scandinavian", category: "Furnitur", price: 3500000, quantity: 1 },
    ];

    const result = calculateBundle(items, { terms: [6, 12, 18, 24] });

    expect(result.totalPrice).toBe(8500000);
    expect(result.bundleDiscount).toBe(0);
    expect(result.netPrice).toBe(8500000);
    expect(result.downPayment).toBe(2500000); // 8.5M bracket
    expect(result.plans).toHaveLength(4);

    const plan12 = result.plans.find((p) => p.termMonths === 12);
    expect(plan12).toBeDefined();
    expect(plan12?.monthlyInstallment).toBeGreaterThan(0);
    expect(plan12?.monthlySavings).toBeGreaterThan(0);
  });

  it("calculates promotional bundle discount", () => {
    const items: BundleItem[] = [
      { id: "tv", name: "Smart TV", category: "Elektronik", price: 5000000, quantity: 1 },
      { id: "sound", name: "Soundbar", category: "Elektronik", price: 1000000, quantity: 1 },
    ];

    const result = calculateBundle(items, { discountPercent: 10, downPayment: 500000 });

    expect(result.totalPrice).toBe(6000000);
    expect(result.bundleDiscount).toBe(600000);
    expect(result.netPrice).toBe(5400000);
    expect(result.downPayment).toBe(500000);
  });
});

