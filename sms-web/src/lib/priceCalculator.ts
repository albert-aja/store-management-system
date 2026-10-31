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
