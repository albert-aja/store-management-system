/**
 * Universal Retail Price Formula Engine for Multi-Product Bundling.
 * Blends electronics (TV) and furniture (Sofa) into a single financed contract
 * with aggregated DP and shared installment schedule.
 */

export interface BundleItem {
  id: string;
  name: string;
  category: "Elektronik" | "Furnitur" | "Peralatan Rumah" | "Lainnya";
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface BundleInstallmentPlan {
  termMonths: number;
  monthlyInstallment: number;
  totalPrice: number;
  totalCustomerCost: number;
  separateMonthlySum: number;
  monthlySavings: number;
}

export interface BundleCalculationResult {
  items: BundleItem[];
  totalPrice: number;
  bundleDiscount: number;
  netPrice: number;
  downPayment: number;
  dpPercentage: number;
  plans: BundleInstallmentPlan[];
}

export function getSuggestedDp(amount: number): number {
  const k = Math.round(amount / 1000);
  if (k < 5000) return 0;
  if (k < 6000) return 1000000;
  if (k < 7000) return 1500000;
  if (k < 8000) return 2000000;
  return 2500000;
}

export function calculateInstallment(
  hargaDasar: number,
  downPayment: number = 0,
  termMonths: number = 10
): { monthlyInstallment: number; totalPrice: number } {
  if (hargaDasar <= 0 || termMonths <= 0) {
    return { monthlyInstallment: 0, totalPrice: 0 };
  }

  const hdK = Math.round(hargaDasar / 1000);
  const dpK = Math.round(downPayment / 1000);

  // h1 = (HD - DP) + 30 admin fee
  const h1 = hdK - dpK + 30;
  // h2 = 4% flat interest per month
  const h2 = h1 + h1 * (0.04 * termMonths);
  // h3 = gross monthly payment
  const h3 = h2 / termMonths;
  // h4 = 15% prompt commercial payment discount
  const h4 = h3 - h3 * 0.15;
  // angsuran rounding to 5k and + 5k
  const angsuranK = Math.round(h4 / 5) * 5 + 5;

  const monthlyInstallment = angsuranK * 1000;
  const totalPrice = monthlyInstallment * termMonths;

  return { monthlyInstallment, totalPrice };
}

export function calculateBundle(
  items: BundleItem[],
  options?: {
    discountPercent?: number;
    downPayment?: number;
    terms?: number[];
  }
): BundleCalculationResult {
  if (!items || items.length === 0) {
    return {
      items: [],
      totalPrice: 0,
      bundleDiscount: 0,
      netPrice: 0,
      downPayment: 0,
      dpPercentage: 0,
      plans: [],
    };
  }

  const totalPrice = items.reduce(
    (sum, it) => sum + (it.price || 0) * (it.quantity > 0 ? it.quantity : 1),
    0
  );

  const discountPercent = options?.discountPercent || 0;
  const bundleDiscount = Math.round(totalPrice * (discountPercent / 100));
  const netPrice = Math.max(0, totalPrice - bundleDiscount);

  const downPayment =
    options?.downPayment !== undefined
      ? options.downPayment
      : getSuggestedDp(netPrice);

  const dpPercentage = totalPrice > 0 ? Math.round((downPayment / totalPrice) * 100) : 0;
  const terms = options?.terms || [6, 12, 18, 24];

  const plans: BundleInstallmentPlan[] = terms.map((term) => {
    const bundleCalc = calculateInstallment(netPrice, downPayment, term);

    // Calculate standalone financing if purchased separately
    let separateMonthlySum = 0;
    for (const item of items) {
      const itemDp = getSuggestedDp(item.price);
      const single = calculateInstallment(item.price, itemDp, term);
      separateMonthlySum += single.monthlyInstallment * (item.quantity > 0 ? item.quantity : 1);
    }

    const monthlySavings = Math.max(0, separateMonthlySum - bundleCalc.monthlyInstallment);

    return {
      termMonths: term,
      monthlyInstallment: bundleCalc.monthlyInstallment,
      totalPrice: bundleCalc.totalPrice,
      totalCustomerCost: bundleCalc.totalPrice + downPayment,
      separateMonthlySum,
      monthlySavings,
    };
  });

  return {
    items,
    totalPrice,
    bundleDiscount,
    netPrice,
    downPayment,
    dpPercentage,
    plans,
  };
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

