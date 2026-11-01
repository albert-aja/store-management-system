/**
 * Universal Retail Price Formula Engine (Electronics & Furniture).
 * Verified against official store price sheets and VBA standard:
 *
 * h1 = (hd - dp) + 30
 * h2 = h1 + (h1 * 0.04 * term)
 * h3 = h2 / term
 * h4 = h3 - (h3 * 0.15)
 * ANGSURAN = Round(h4 / 5, 0) * 5 + 5
 */

export interface InstallmentPlanResult {
  termMonths: number;
  monthlyInstallment: number;
  totalPrice: number;
}

export interface PriceMatrixResult {
  hargaDasar: number;
  downPayment: number;
  autoDpApplied: boolean;
  terms: InstallmentPlanResult[];
}

export interface BundleItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  hargaDasar: number;
  cashPrice?: number;
}

export interface BundleSimulationResult {
  items: BundleItem[];
  totalHargaDasar: number;
  bundleDiscount: number;
  netHargaDasar: number;
  downPayment: number;
  autoDpApplied: boolean;
  terms: InstallmentPlanResult[];
  separateTotalInstallments: Record<number, number>;
  monthlySavings: Record<number, number>;
}

/**
 * Normalizes input value to thousands (e.g. 2,878,000 -> 2878).
 */
export function toThousands(value: number): number {
  if (!value || isNaN(value)) return 0;
  if (value >= 10000) {
    return Math.round(value / 1000);
  }
  return value;
}

/**
 * Computes suggested Down Payment (DP) based on Harga Dasar (HD) brackets.
 * - HD < 5.000.000 (5000k)  -> DP = 0
 * - 5.000.000 - 5.999.000  -> DP = 1.000.000
 * - 6.000.000 - 6.999.000  -> DP = 1.500.000
 * - 7.000.000 - 7.999.000  -> DP = 2.000.000
 * - HD >= 8.000.000 (8000k) -> DP = 2.500.000
 */
export function getSuggestedDp(hargaDasar: number): number {
  const hdK = toThousands(hargaDasar);
  if (hdK < 5000) return 0;
  if (hdK < 6000) return 1000000;
  if (hdK < 7000) return 1500000;
  if (hdK < 8000) return 2000000;
  return 2500000;
}

/**
 * Calculates monthly installment and total price for a given tenor.
 * @param hargaDasar Base cost / Harga dasar (in full Rupiah or thousands)
 * @param downPayment Down payment (in full Rupiah or thousands)
 * @param termMonths Installment term length (e.g. 10, 12, 15)
 */
export function calculateInstallment(
  hargaDasar: number,
  downPayment: number = 0,
  termMonths: number = 10
): InstallmentPlanResult {
  if (!hargaDasar || isNaN(hargaDasar) || hargaDasar <= 0 || termMonths <= 0) {
    return { termMonths, monthlyInstallment: 0, totalPrice: 0 };
  }

  const hdK = toThousands(hargaDasar);
  const dpK = toThousands(downPayment);

  // Step 1: Net Financed Base + Rp 30.000 handling/admin fee
  const h1 = hdK - dpK + 30;

  // Step 2: 4% Flat interest per month
  const markupRate = 0.04 * termMonths;
  const h2 = h1 + h1 * markupRate;

  // Step 3: Gross monthly payment
  const h3 = h2 / termMonths;

  // Step 4: 15% prompt / commercial incentive discount
  const h4 = h3 - h3 * 0.15;

  // Step 5: Rounding to 5k and add 5k
  const angsuranK = Math.round(h4 / 5) * 5 + 5;

  const monthlyInstallment = angsuranK * 1000;
  const totalPrice = monthlyInstallment * termMonths;

  return {
    termMonths,
    monthlyInstallment,
    totalPrice,
  };
}

/**
 * Computes full installment matrix across multiple terms (default: 10, 12, 15).
 */
export function calculatePriceMatrix(
  hargaDasar: number,
  downPayment?: number,
  terms: number[] = [10, 12, 15]
): PriceMatrixResult {
  const autoDpApplied = downPayment === undefined || downPayment === null;
  const actualDp = autoDpApplied ? getSuggestedDp(hargaDasar) : downPayment;

  const calculatedTerms = terms.map((term) =>
    calculateInstallment(hargaDasar, actualDp, term)
  );

  return {
    hargaDasar,
    downPayment: actualDp,
    autoDpApplied,
    terms: calculatedTerms,
  };
}

/**
 * Calculates blended multi-product credit bundle financing.
 * Allows salespersons to combine electronics (e.g. TV) and furniture (e.g. Sofa) into
 * a single financed contract with aggregated DP, optional promotional bundle discount,
 * shared installment schedule, and comparison vs financing each item separately.
 */
export function calculateBundleSimulation(
  items: BundleItem[],
  options?: {
    discountPercent?: number;
    discountAmount?: number;
    downPayment?: number;
    terms?: number[];
  }
): BundleSimulationResult {
  if (!items || items.length === 0) {
    return {
      items: [],
      totalHargaDasar: 0,
      bundleDiscount: 0,
      netHargaDasar: 0,
      downPayment: 0,
      autoDpApplied: true,
      terms: [],
      separateTotalInstallments: {},
      monthlySavings: {},
    };
  }

  const totalHargaDasar = items.reduce(
    (sum, item) => sum + (item.hargaDasar || 0) * (item.quantity > 0 ? item.quantity : 1),
    0
  );

  let bundleDiscount = 0;
  if (options?.discountAmount !== undefined && options.discountAmount > 0) {
    bundleDiscount = options.discountAmount;
  } else if (options?.discountPercent !== undefined && options.discountPercent > 0) {
    bundleDiscount = Math.round(totalHargaDasar * (options.discountPercent / 100));
  }
  if (bundleDiscount > totalHargaDasar) {
    bundleDiscount = totalHargaDasar;
  }

  const netHargaDasar = Math.max(0, totalHargaDasar - bundleDiscount);
  const autoDpApplied = options?.downPayment === undefined || options?.downPayment === null;
  const downPayment = autoDpApplied ? getSuggestedDp(netHargaDasar) : options.downPayment;

  const targetTerms = options?.terms && options.terms.length > 0
    ? options.terms
    : [6, 10, 12, 15, 18, 24];

  const calculatedTerms: InstallmentPlanResult[] = targetTerms.map((term) =>
    calculateInstallment(netHargaDasar, downPayment, term)
  );

  const separateTotalInstallments: Record<number, number> = {};
  const monthlySavings: Record<number, number> = {};

  for (const term of targetTerms) {
    let separateMonthly = 0;
    for (const item of items) {
      const itemHd = item.hargaDasar || 0;
      const qty = item.quantity > 0 ? item.quantity : 1;
      const itemDp = getSuggestedDp(itemHd);
      const single = calculateInstallment(itemHd, itemDp, term);
      separateMonthly += single.monthlyInstallment * qty;
    }
    separateTotalInstallments[term] = separateMonthly;

    const bundlePlan = calculatedTerms.find((t) => t.termMonths === term);
    const bundleMonthly = bundlePlan ? bundlePlan.monthlyInstallment : 0;
    const diff = separateMonthly - bundleMonthly;
    monthlySavings[term] = diff > 0 ? diff : 0;
  }

  return {
    items,
    totalHargaDasar,
    bundleDiscount,
    netHargaDasar,
    downPayment,
    autoDpApplied,
    terms: calculatedTerms,
    separateTotalInstallments,
    monthlySavings,
  };
}

/**
 * Formats a clean WhatsApp / SMS quotation message for multi-product showroom bundle.
 */
export function generateBundleShareSummary(
  simulation: BundleSimulationResult,
  options?: { storeName?: string; note?: string }
): string {
  const formatRp = (val: number) =>
    `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(val))}`;

  const lines: string[] = [
    `*SIMULASI KREDIT PAKET BUNDLE SHOWROOM*`,
    options?.storeName ? `Toko: *${options.storeName}*` : "",
    `--------------------------------`,
    `*DAFTAR PRODUK PAKET:*`,
  ].filter(Boolean);

  simulation.items.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. *${item.name}* (${item.category || "Produk"}) x${item.quantity || 1} - ${formatRp(item.hargaDasar)}`
    );
  });

  lines.push(`--------------------------------`);
  lines.push(`Total Harga Dasar: *${formatRp(simulation.totalHargaDasar)}*`);
  if (simulation.bundleDiscount > 0) {
    lines.push(`Diskon Promo Bundle: *- ${formatRp(simulation.bundleDiscount)}*`);
    lines.push(`Harga Bersih Paket: *${formatRp(simulation.netHargaDasar)}*`);
  }
  lines.push(`Total DP Gabungan: *${formatRp(simulation.downPayment)}*`);
  lines.push(`--------------------------------`);
  lines.push(`*PILIHAN ANGSURAN SATU KONTRAK:*`);

  simulation.terms.forEach((term) => {
    const savings = simulation.monthlySavings[term.termMonths] || 0;
    const savingNote = savings > 0 ? ` (Hemat ${formatRp(savings)}/bln!)` : "";
    lines.push(
      `- *${term.termMonths} Bulan*: ${formatRp(term.monthlyInstallment)} / bln${savingNote}`
    );
  });

  lines.push(`--------------------------------`);
  lines.push(`*Keuntungan Paket Bundle:* Biaya admin cukup 1x, cicilan gabungan lebih terjangkau.`);
  if (options?.note) {
    lines.push(`Catatan: ${options.note}`);
  }

  return lines.join("\n");
}
