import 'package:intl/intl.dart';
import '../../../l10n/app_localizations.dart';
import '../../../l10n/app_localizations_id.dart';

class CreditTermCalculation {
  final int termMonths;
  final double monthlyInstallment;
  final double totalPrice;
  final double totalCustomerCost;
  final double grossMonthly;
  final double monthlyDiscountSaved;
  final double h1Nominal;
  final double h2Nominal;
  final double h4Nominal;

  const CreditTermCalculation({
    required this.termMonths,
    required this.monthlyInstallment,
    required this.totalPrice,
    required this.totalCustomerCost,
    required this.grossMonthly,
    required this.monthlyDiscountSaved,
    required this.h1Nominal,
    required this.h2Nominal,
    required this.h4Nominal,
  });
}

class CreditSimulationResult {
  final double hargaDasar;
  final double downPayment;
  final double dpPercentage;
  final bool isAutoDp;
  final double netFinancedBase;
  final List<CreditTermCalculation> terms;

  const CreditSimulationResult({
    required this.hargaDasar,
    required this.downPayment,
    required this.dpPercentage,
    required this.isAutoDp,
    required this.netFinancedBase,
    required this.terms,
  });
}

class CreditCalculatorService {
  static const double adminFee = 30000.0;
  static const double monthlyInterestRate = 0.04;
  static const double promptPaymentDiscount = 0.15;
  static const List<int> defaultTerms = [6, 10, 12, 15, 18, 24];

  /// Suggested DP based on company retail brackets:
  /// HD < 5.000.000: DP = 0
  /// 5.000.000 <= HD < 6.000.000: DP = 1.000.000
  /// 6.000.000 <= HD < 7.000.000: DP = 1.500.000
  /// 7.000.000 <= HD < 8.000.000: DP = 2.000.000
  /// HD >= 8.000.000: DP = 2.500.000
  static double getSuggestedDp(double hargaDasar) {
    if (hargaDasar <= 0) return 0.0;
    final hdK = hargaDasar / 1000.0;
    if (hdK < 5000.0) {
      return 0.0;
    } else if (hdK < 6000.0) {
      return 1000000.0;
    } else if (hdK < 7000.0) {
      return 1500000.0;
    } else if (hdK < 8000.0) {
      return 2000000.0;
    } else {
      return 2500000.0;
    }
  }

  /// Calculates installment for single term based on verified retail formula:
  /// h1 = (HD - DP) + 30
  /// h2 = h1 * (1 + 0.04 * T)
  /// h3 = h2 / T
  /// h4 = h3 * 0.85
  /// Angsuran = Round(h4 / 5, 0) * 5 + 5
  static CreditTermCalculation calculateTerm({
    required double hargaDasar,
    required double downPayment,
    required int termMonths,
  }) {
    if (hargaDasar <= 0 || termMonths <= 0) {
      return CreditTermCalculation(
        termMonths: termMonths,
        monthlyInstallment: 0,
        totalPrice: 0,
        totalCustomerCost: downPayment,
        grossMonthly: 0,
        monthlyDiscountSaved: 0,
        h1Nominal: 0,
        h2Nominal: 0,
        h4Nominal: 0,
      );
    }

    final hdK = hargaDasar / 1000.0;
    final dpK = downPayment / 1000.0;

    // Step 1: Net Financed Base + Rp 30.000 handling fee
    final h1 = (hdK - dpK) + 30.0;

    // Step 2: 4% Flat interest per month
    final markupRate = monthlyInterestRate * termMonths;
    final h2 = h1 + (h1 * markupRate);

    // Step 3: Gross monthly payment
    final h3 = h2 / termMonths;

    // Step 4: 15% prompt commercial payment discount
    final h4 = h3 * (1.0 - promptPaymentDiscount);

    // Step 5: Rounding to nearest 5k increment + Rp 5.000
    final angsuranK = (h4 / 5.0).round() * 5 + 5;

    final monthlyInstallment = angsuranK * 1000.0;
    final totalPrice = monthlyInstallment * termMonths;
    final totalCustomerCost = totalPrice + downPayment;
    final grossMonthly = (h3 * 1000.0).roundToDouble();
    final monthlyDiscountSaved = grossMonthly - monthlyInstallment;

    return CreditTermCalculation(
      termMonths: termMonths,
      monthlyInstallment: monthlyInstallment,
      totalPrice: totalPrice,
      totalCustomerCost: totalCustomerCost,
      grossMonthly: grossMonthly,
      monthlyDiscountSaved: monthlyDiscountSaved,
      h1Nominal: h1 * 1000.0,
      h2Nominal: h2 * 1000.0,
      h4Nominal: h4 * 1000.0,
    );
  }

  /// Calculates complete simulation with all requested tenors
  static CreditSimulationResult simulate({
    required double hargaDasar,
    double? downPayment,
    List<int>? terms,
  }) {
    final isAutoDp = downPayment == null;
    final dp = isAutoDp ? getSuggestedDp(hargaDasar) : downPayment;
    final activeTerms = terms ?? defaultTerms;

    final termResults = activeTerms.map((t) {
      return calculateTerm(
        hargaDasar: hargaDasar,
        downPayment: dp,
        termMonths: t,
      );
    }).toList();

    final dpPercent = hargaDasar > 0 ? ((dp / hargaDasar) * 100) : 0.0;
    final h1 = ((hargaDasar - dp) / 1000.0 + 30.0) * 1000.0;

    return CreditSimulationResult(
      hargaDasar: hargaDasar,
      downPayment: dp,
      dpPercentage: dpPercent,
      isAutoDp: isAutoDp,
      netFinancedBase: h1,
      terms: termResults,
    );
  }

  /// Currency and rounding stay IDR; only presentation follows the locale.
  static String formatRupiah(double value, {String locale = 'id'}) =>
      NumberFormat.currency(
        locale: locale,
        symbol: 'Rp ',
        decimalDigits: 0,
      ).format(value.round());

  /// Generates a clean text quotation suitable for sharing on WhatsApp or SMS
  static String generateShareSummary({
    String? productName,
    required CreditSimulationResult simulation,
    AppLocalizations? localization,
  }) {
    final l10n = localization ?? AppLocalizationsId();
    String money(double value) => formatRupiah(value, locale: l10n.localeName);
    final numbers = NumberFormat.decimalPattern(l10n.localeName);
    final buffer = StringBuffer();
    buffer.writeln(l10n.simulationTitle);
    if (productName != null && productName.trim().isNotEmpty) {
      buffer.writeln(l10n.simulationProduct(productName));
    }
    buffer.writeln(l10n.simulationPrice(money(simulation.hargaDasar)));
    buffer.writeln(
      l10n.simulationDp(
        money(simulation.downPayment),
        numbers.format(simulation.dpPercentage.round()),
      ),
    );
    buffer.writeln('--------------------------------');
    buffer.writeln(l10n.simulationOptions);
    for (final term in simulation.terms) {
      buffer.writeln(
        l10n.simulationTerm(
          numbers.format(term.termMonths),
          money(term.monthlyInstallment),
        ),
      );
      buffer.writeln(
        l10n.simulationTotal(
          money(term.totalCustomerCost),
          money(term.monthlyDiscountSaved),
        ),
      );
    }
    buffer.writeln('--------------------------------');
    buffer.writeln(l10n.simulationDiscount);
    return buffer.toString();
  }
}
