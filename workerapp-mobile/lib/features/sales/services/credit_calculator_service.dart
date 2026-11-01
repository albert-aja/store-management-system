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

class BundleItem {
  final String id;
  final String name;
  final String category;
  final int quantity;
  final double hargaDasar;
  final double cashPrice;

  const BundleItem({
    required this.id,
    required this.name,
    required this.category,
    this.quantity = 1,
    required this.hargaDasar,
    required this.cashPrice,
  });

  BundleItem copyWith({
    String? id,
    String? name,
    String? category,
    int? quantity,
    double? hargaDasar,
    double? cashPrice,
  }) {
    return BundleItem(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      quantity: quantity ?? this.quantity,
      hargaDasar: hargaDasar ?? this.hargaDasar,
      cashPrice: cashPrice ?? this.cashPrice,
    );
  }
}

class BundleSimulationResult {
  final List<BundleItem> items;
  final double totalHargaDasar;
  final double bundleDiscount;
  final double netHargaDasar;
  final double downPayment;
  final double dpPercentage;
  final bool isAutoDp;
  final List<CreditTermCalculation> bundleTerms;
  final Map<int, double> separateTotalMonthly;
  final Map<int, double> monthlySavings;

  const BundleSimulationResult({
    required this.items,
    required this.totalHargaDasar,
    required this.bundleDiscount,
    required this.netHargaDasar,
    required this.downPayment,
    required this.dpPercentage,
    required this.isAutoDp,
    required this.bundleTerms,
    required this.separateTotalMonthly,
    required this.monthlySavings,
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

  /// Calculates blended multi-product credit bundle financing.
  /// Combines electronics (TV, fridge) and furniture (Sofa, bed) into a single financed contract.
  static BundleSimulationResult simulateBundle({
    required List<BundleItem> items,
    double? discountPercent,
    double? discountAmount,
    double? downPayment,
    List<int>? terms,
  }) {
    if (items.isEmpty) {
      return const BundleSimulationResult(
        items: [],
        totalHargaDasar: 0,
        bundleDiscount: 0,
        netHargaDasar: 0,
        downPayment: 0,
        dpPercentage: 0,
        isAutoDp: true,
        bundleTerms: [],
        separateTotalMonthly: {},
        monthlySavings: {},
      );
    }

    final totalHd = items.fold<double>(
      0.0,
      (sum, item) => sum + (item.hargaDasar * (item.quantity > 0 ? item.quantity : 1)),
    );

    double discount = 0.0;
    if (discountAmount != null && discountAmount > 0) {
      discount = discountAmount;
    } else if (discountPercent != null && discountPercent > 0) {
      discount = (totalHd * (discountPercent / 100.0)).roundToDouble();
    }
    if (discount > totalHd) discount = totalHd;

    final netHd = (totalHd - discount).clamp(0.0, double.infinity);
    final isAutoDp = downPayment == null;
    final dp = isAutoDp ? getSuggestedDp(netHd) : downPayment;
    final dpPercent = totalHd > 0 ? ((dp / totalHd) * 100) : 0.0;
    final activeTerms = terms ?? defaultTerms;

    final bundleTerms = activeTerms.map((t) {
      return calculateTerm(
        hargaDasar: netHd,
        downPayment: dp,
        termMonths: t,
      );
    }).toList();

    final separateTotals = <int, double>{};
    final savingsMap = <int, double>{};

    for (final term in activeTerms) {
      double separateMonthlySum = 0.0;
      for (final item in items) {
        final itemDp = getSuggestedDp(item.hargaDasar);
        final single = calculateTerm(
          hargaDasar: item.hargaDasar,
          downPayment: itemDp,
          termMonths: term,
        );
        separateMonthlySum += single.monthlyInstallment * (item.quantity > 0 ? item.quantity : 1);
      }
      separateTotals[term] = separateMonthlySum;

      final bundleTerm = bundleTerms.firstWhere(
        (b) => b.termMonths == term,
        orElse: () => bundleTerms.first,
      );
      final diff = separateMonthlySum - bundleTerm.monthlyInstallment;
      savingsMap[term] = diff > 0 ? diff : 0.0;
    }

    return BundleSimulationResult(
      items: items,
      totalHargaDasar: totalHd,
      bundleDiscount: discount,
      netHargaDasar: netHd,
      downPayment: dp,
      dpPercentage: dpPercent,
      isAutoDp: isAutoDp,
      bundleTerms: bundleTerms,
      separateTotalMonthly: separateTotals,
      monthlySavings: savingsMap,
    );
  }

  /// Generates a structured WhatsApp text quotation for multi-product showroom bundle.
  static String generateBundleShareSummary({
    required BundleSimulationResult simulation,
    String? storeName,
    AppLocalizations? localization,
  }) {
    final l10n = localization ?? AppLocalizationsId();
    String money(double value) => formatRupiah(value, locale: l10n.localeName);
    final numbers = NumberFormat.decimalPattern(l10n.localeName);

    final buffer = StringBuffer();
    buffer.writeln('✨ *SIMULASI KREDIT PAKET BUNDLE SHOWROOM*');
    if (storeName != null && storeName.isNotEmpty) {
      buffer.writeln('Toko: *$storeName*');
    }
    buffer.writeln('--------------------------------');
    buffer.writeln('📦 *ITEM DALAM PAKET:*');
    for (var i = 0; i < simulation.items.length; i++) {
      final item = simulation.items[i];
      buffer.writeln(
        '${i + 1}. *${item.name}* (${item.category}) x${item.quantity} - ${money(item.hargaDasar)}',
      );
    }
    buffer.writeln('--------------------------------');
    buffer.writeln('Total Harga Dasar: *${money(simulation.totalHargaDasar)}*');
    if (simulation.bundleDiscount > 0) {
      buffer.writeln('Diskon Promo Bundle: *- ${money(simulation.bundleDiscount)}*');
      buffer.writeln('Harga Bersih Paket: *${money(simulation.netHargaDasar)}*');
    }
    buffer.writeln(
      'Total DP Gabungan: *${money(simulation.downPayment)}* (${numbers.format(simulation.dpPercentage.round())}%)',
    );
    buffer.writeln('--------------------------------');
    buffer.writeln('🗓️ *PILIHAN ANGSURAN SATU KONTRAK:*');
    for (final term in simulation.bundleTerms) {
      final saving = simulation.monthlySavings[term.termMonths] ?? 0.0;
      final savingNote = saving > 0 ? ' (Hemat ${money(saving)}/bln!)' : '';
      buffer.writeln(
        '• *${term.termMonths} Bulan*: ${money(term.monthlyInstallment)} / bln$savingNote',
      );
    }
    buffer.writeln('--------------------------------');
    buffer.writeln('💡 *Keuntungan:* 1 Kontrak terpadu, hemat biaya admin & cicilan lebih terjangkau.');
    return buffer.toString();
  }
}
