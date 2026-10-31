import 'package:sms_mobile/core/localization/worker_format.dart';
import 'package:sms_mobile/core/localization/worker_message.dart';
import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../services/credit_calculator_service.dart';

enum ProductSource { catalog, manual }

enum DpMode { autoBracket, percentage, customNominal }

class CreditCalculatorScreen extends ConsumerStatefulWidget {
  final double? initialPrice;
  final String? initialProductName;
  final String? initialProductCode;
  final String? initialVariantId;

  const CreditCalculatorScreen({
    super.key,
    this.initialPrice,
    this.initialProductName,
    this.initialProductCode,
    this.initialVariantId,
  });

  @override
  ConsumerState<CreditCalculatorScreen> createState() =>
      _CreditCalculatorScreenState();
}

class _CreditCalculatorScreenState
    extends ConsumerState<CreditCalculatorScreen> {
  ProductSource _productSource = ProductSource.manual;
  DpMode _dpMode = DpMode.autoBracket;

  final _productQueryController = TextEditingController();
  final _manualNameController = TextEditingController();
  final _hdController = TextEditingController();
  final _customDpController = TextEditingController();

  List<Map<String, dynamic>> _catalogProducts = [];
  Map<String, dynamic>? _selectedProduct;
  bool _isLoadingCatalog = false;
  WorkerMessage? _catalogError;

  double _selectedPercentage = 10.0;
  int _selectedTenor = 10;
  bool _showFormulaDetails = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialProductName != null &&
        widget.initialProductName!.isNotEmpty) {
      _manualNameController.text = widget.initialProductName!;
    }
    if (widget.initialPrice != null && widget.initialPrice! > 0) {
      _hdController.text = widget.initialPrice!.toStringAsFixed(0);
    } else {
      _hdController.text = '4500000';
    }
  }

  @override
  void dispose() {
    _productQueryController.dispose();
    _manualNameController.dispose();
    _hdController.dispose();
    _customDpController.dispose();
    super.dispose();
  }

  double get _currentHargaDasar {
    final text = _hdController.text.replaceAll(RegExp(r'[^0-9]'), '');
    return double.tryParse(text) ?? 0.0;
  }

  double get _currentDownPayment {
    final hd = _currentHargaDasar;
    switch (_dpMode) {
      case DpMode.autoBracket:
        return CreditCalculatorService.getSuggestedDp(hd);
      case DpMode.percentage:
        return (hd * (_selectedPercentage / 100.0)).roundToDouble();
      case DpMode.customNominal:
        final text = _customDpController.text.replaceAll(RegExp(r'[^0-9]'), '');
        return double.tryParse(text) ?? 0.0;
    }
  }

  CreditSimulationResult get _simulation {
    return CreditCalculatorService.simulate(
      hargaDasar: _currentHargaDasar,
      downPayment: _currentDownPayment,
      terms: const [6, 10, 12, 15, 18, 24],
    );
  }

  String get _productDisplayName {
    if (_productSource == ProductSource.catalog && _selectedProduct != null) {
      return _selectedProduct!['name']?.toString() ?? context.l10n.message349;
    }
    if (_manualNameController.text.trim().isNotEmpty) {
      return _manualNameController.text.trim();
    }
    return context.l10n.message350;
  }

  Future<void> _searchCatalog() async {
    final query = _productQueryController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isLoadingCatalog = true;
      _catalogError = null;
    });

    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get('/api/products', queryParameters: {'query': query});

      if (response.data is List) {
        final list = (response.data as List)
            .cast<Map<String, dynamic>>()
            .where((p) => p['active'] == true)
            .toList();
        setState(() {
          _catalogProducts = list;
          _isLoadingCatalog = false;
        });
      } else {
        setState(() {
          _catalogProducts = [];
          _isLoadingCatalog = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoadingCatalog = false;
        _catalogError = WorkerMessage(
          (l10n) => l10n.message351(localizedError(l10n, e)),
        );
      });
    }
  }

  Future<void> _selectProduct(Map<String, dynamic> product) async {
    final user = ref.read(authProvider).user;
    final storeId = user?.storeId;

    setState(() {
      _selectedProduct = product;
      _isLoadingCatalog = true;
      _catalogProducts = [];
    });

    try {
      if (storeId != null) {
        final client = ref.read(apiClientProvider).dio;
        final res = await client.get('/api/stores/$storeId/pricing');
        if (res.data is List) {
          final prices = (res.data as List).cast<Map<String, dynamic>>();
          final matching = prices.firstWhere(
            (p) => p['productName'] == product['name'] || p['active'] == true,
            orElse: () => <String, dynamic>{},
          );
          final cashPrice =
              (matching['cashPrice'] as num?)?.toDouble() ??
              (matching['basePrice'] as num?)?.toDouble();
          if (cashPrice != null && cashPrice > 0) {
            _hdController.text = cashPrice.toStringAsFixed(0);
          }
        }
      }
    } catch (_) {
      // Fallback silently
    } finally {
      if (mounted) {
        setState(() => _isLoadingCatalog = false);
      }
    }
  }

  void _copyQuotationToClipboard() {
    final text = CreditCalculatorService.generateShareSummary(
      productName: _productDisplayName,
      simulation: _simulation,
      localization: context.l10n,
    );

    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.l10n.message352),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sim = _simulation;
    final selectedTermCalc = sim.terms.firstWhere(
      (t) => t.termMonths == _selectedTenor,
      orElse: () => sim.terms.first,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.message353),
        actions: [
          const WorkerLanguageSwitcher(),
          IconButton(
            tooltip: context.l10n.message354,
            icon: const Icon(Icons.share_outlined),
            onPressed: _copyQuotationToClipboard,
          ),
          IconButton(
            tooltip: context.l10n.message355,
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _hdController.text = '4500000';
                _customDpController.clear();
                _selectedPercentage = 10.0;
                _dpMode = DpMode.autoBracket;
                _selectedProduct = null;
                _manualNameController.clear();
              });
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Banner Info
          Card(
            color: AppColors.primary.withValues(alpha: 0.06),
            child: Padding(
              padding: EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(
                    Icons.calculate_rounded,
                    color: AppColors.primary,
                    size: 28,
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      context.l10n.message356,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Source Switcher Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    context.l10n.message357,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  SegmentedButton<ProductSource>(
                    segments: [
                      ButtonSegment(
                        value: ProductSource.manual,
                        label: Text(context.l10n.message358),
                        icon: Icon(Icons.edit_outlined),
                      ),
                      ButtonSegment(
                        value: ProductSource.catalog,
                        label: Text(context.l10n.message359),
                        icon: Icon(Icons.storefront_outlined),
                      ),
                    ],
                    selected: {_productSource},
                    onSelectionChanged: (set) {
                      setState(() => _productSource = set.first);
                    },
                  ),
                  const SizedBox(height: 12),

                  if (_productSource == ProductSource.catalog) ...[
                    if (_selectedProduct != null)
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green.shade300),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle, color: Colors.green),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _selectedProduct!['name'] ?? '',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  Text(
                                    context.l10n.message360(
                                      (_selectedProduct!['code'] ?? '—')
                                          .toString(),
                                    ),
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close),
                              onPressed: () {
                                setState(() => _selectedProduct = null);
                              },
                            ),
                          ],
                        ),
                      )
                    else ...[
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _productQueryController,
                              textInputAction: TextInputAction.search,
                              onSubmitted: (_) => _searchCatalog(),
                              decoration: InputDecoration(
                                labelText: context.l10n.message361,
                                prefixIcon: Icon(Icons.search),
                                isDense: true,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          FilledButton(
                            onPressed: _searchCatalog,
                            child: Text(context.l10n.message362),
                          ),
                        ],
                      ),
                      if (_isLoadingCatalog)
                        const Padding(
                          padding: EdgeInsets.all(8),
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      if (_catalogError != null)
                        Padding(
                          padding: const EdgeInsets.all(8),
                          child: Text(
                            context.errorText(_catalogError),
                            style: const TextStyle(
                              color: Colors.red,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      if (_catalogProducts.isNotEmpty)
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _catalogProducts.length,
                          itemBuilder: (context, idx) {
                            final prod = _catalogProducts[idx];
                            return ListTile(
                              dense: true,
                              title: Text(prod['name'] ?? ''),
                              subtitle: Text(prod['code'] ?? ''),
                              trailing: const Icon(
                                Icons.arrow_forward_ios,
                                size: 14,
                              ),
                              onTap: () => _selectProduct(prod),
                            );
                          },
                        ),
                    ],
                  ] else ...[
                    TextField(
                      controller: _manualNameController,
                      decoration: InputDecoration(
                        labelText: context.l10n.message363,
                        hintText: context.l10n.message364,
                        prefixIcon: Icon(Icons.shopping_bag_outlined),
                        isDense: true,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Harga Dasar (HD) Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    context.l10n.message365,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _hdController,
                    keyboardType: TextInputType.number,
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      prefixText: 'Rp ',
                      labelText: context.l10n.message366,
                      prefixIcon: Icon(Icons.payments_outlined),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    children: [
                      ActionChip(
                        label: Text(context.l10n.message367),
                        onPressed: () {
                          final current = _currentHargaDasar;
                          _hdController.text = (current + 500000)
                              .toStringAsFixed(0);
                          setState(() {});
                        },
                      ),
                      ActionChip(
                        label: Text(context.l10n.message368),
                        onPressed: () {
                          final current = _currentHargaDasar;
                          _hdController.text = (current + 1000000)
                              .toStringAsFixed(0);
                          setState(() {});
                        },
                      ),
                      ActionChip(
                        label: Text(context.l10n.message369),
                        onPressed: () {
                          final current = _currentHargaDasar;
                          _hdController.text = (current + 2000000)
                              .toStringAsFixed(0);
                          setState(() {});
                        },
                      ),
                      ActionChip(
                        label: Text(context.l10n.message370),
                        onPressed: () {
                          final current = _currentHargaDasar;
                          _hdController.text = (current + 5000000)
                              .toStringAsFixed(0);
                          setState(() {});
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Down Payment (DP) Selection Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        context.l10n.message371,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        context.rupiah(_currentDownPayment),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SegmentedButton<DpMode>(
                    segments: [
                      ButtonSegment(
                        value: DpMode.autoBracket,
                        label: Text(context.l10n.message372),
                      ),
                      ButtonSegment(
                        value: DpMode.percentage,
                        label: Text(context.l10n.message373),
                      ),
                      ButtonSegment(
                        value: DpMode.customNominal,
                        label: Text(context.l10n.message374),
                      ),
                    ],
                    selected: {_dpMode},
                    onSelectionChanged: (set) {
                      setState(() => _dpMode = set.first);
                    },
                  ),
                  const SizedBox(height: 12),

                  if (_dpMode == DpMode.autoBracket) ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        context.l10n.message375(
                          (context.rupiah(
                            CreditCalculatorService.getSuggestedDp(
                              _currentHargaDasar,
                            ),
                          )).toString(),
                          (_currentHargaDasar < 5000000
                                  ? context.l10n.noDp
                                  : context.l10n.priceBracket)
                              .toString(),
                        ),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.blue.shade900,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ] else if (_dpMode == DpMode.percentage) ...[
                    Text(
                      context.l10n.message376(
                        (context.number(
                          _selectedPercentage,
                          decimals: 0,
                        )).toString(),
                        (context.rupiah(_currentDownPayment)).toString(),
                      ),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 40.0]
                          .map((pct) {
                            final isSel = _selectedPercentage == pct;
                            return ChoiceChip(
                              label: Text('${pct.toInt()}%'),
                              selected: isSel,
                              onSelected: (selected) {
                                if (selected) {
                                  setState(() => _selectedPercentage = pct);
                                }
                              },
                            );
                          })
                          .toList(),
                    ),
                  ] else ...[
                    TextField(
                      controller: _customDpController,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        prefixText: 'Rp ',
                        labelText: context.l10n.message377,
                        hintText: context.l10n.message378,
                        prefixIcon: Icon(Icons.handshake_outlined),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      context.l10n.message379(
                        (context.number(
                          sim.dpPercentage,
                          decimals: 1,
                        )).toString(),
                      ),
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Financial Net Base Summary
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.l10n.message380,
                      style: TextStyle(fontSize: 12, color: Colors.black87),
                    ),
                    Text(
                      context.l10n.message381(
                        (context.rupiah(sim.netFinancedBase)).toString(),
                      ),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    context.l10n.message382,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Tenor Simulation Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                context.l10n.message383,
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              Text(
                context.l10n.message384((sim.terms.length).toString()),
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Tenor Grid / Cards
          ...sim.terms.map((term) {
            final isStandard =
                term.termMonths == 10 ||
                term.termMonths == 12 ||
                term.termMonths == 15;
            final isSelected = term.termMonths == _selectedTenor;

            return Card(
              elevation: isSelected ? 3 : 1,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(
                  color: isSelected
                      ? AppColors.primary
                      : (isStandard
                            ? Colors.blue.shade200
                            : Colors.grey.shade300),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () {
                  setState(() => _selectedTenor = term.termMonths);
                },
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      // ignore: deprecated_member_use
                      Radio<int>(
                        value: term.termMonths,
                        // ignore: deprecated_member_use
                        groupValue: _selectedTenor,
                        // ignore: deprecated_member_use
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedTenor = val);
                          }
                        },
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  context.l10n.message385(
                                    (term.termMonths).toString(),
                                  ),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                                if (isStandard) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.blue.shade100,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      context.l10n.message372,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blue,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              context.l10n.message386(
                                (context.rupiah(
                                  term.totalCustomerCost,
                                )).toString(),
                              ),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade700,
                              ),
                            ),
                            Text(
                              context.l10n.message387(
                                ((term.monthlyDiscountSaved / 1000).round())
                                    .toString(),
                              ),
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.green,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            context.rupiah(term.monthlyInstallment),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                          Text(
                            context.l10n.perMonth,
                            style: TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 12),

          // Formula Breakdown Accordion
          Card(
            child: ExpansionTile(
              initiallyExpanded: _showFormulaDetails,
              onExpansionChanged: (exp) =>
                  setState(() => _showFormulaDetails = exp),
              leading: const Icon(Icons.info_outline, color: AppColors.primary),
              title: Text(
                context.l10n.message388,
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                context.l10n.message389(
                  (selectedTermCalc.termMonths).toString(),
                ),
                style: const TextStyle(fontSize: 11),
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Divider(),
                      _buildFormulaRow(
                        context.l10n.message390,
                        context.l10n.formulaPrincipal,
                        context.rupiah(selectedTermCalc.h1Nominal),
                      ),
                      _buildFormulaRow(
                        context.l10n.message391,
                        context.l10n.message392(
                          (selectedTermCalc.termMonths).toString(),
                        ),
                        context.rupiah(selectedTermCalc.h2Nominal),
                      ),
                      _buildFormulaRow(
                        context.l10n.message393,
                        'h2 ÷ ${selectedTermCalc.termMonths}',
                        context.l10n.message394(
                          (context.rupiah(
                            selectedTermCalc.grossMonthly,
                          )).toString(),
                        ),
                      ),
                      _buildFormulaRow(
                        context.l10n.message395,
                        context.l10n.message396,
                        context.l10n.message394(
                          (context.rupiah(
                            selectedTermCalc.h4Nominal,
                          )).toString(),
                        ),
                      ),
                      _buildFormulaRow(
                        context.l10n.message397,
                        context.l10n.formulaRounding,
                        context.l10n.message394(
                          (context.rupiah(
                            selectedTermCalc.monthlyInstallment,
                          )).toString(),
                        ),
                        isHighlight: true,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Action Buttons
          FilledButton.icon(
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: Colors.green.shade700,
            ),
            icon: const Icon(Icons.share_outlined),
            label: Text(
              context.l10n.message398,
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: _copyQuotationToClipboard,
          ),
          const SizedBox(height: 8),

          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            icon: const Icon(Icons.check_circle_outline),
            label: Text(
              context.l10n.message399(
                (_selectedTenor).toString(),
                (context.rupiah(
                  selectedTermCalc.monthlyInstallment,
                )).toString(),
              ),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: () {
              Navigator.pop(context, {
                'productName': _productDisplayName,
                'hargaDasar': _currentHargaDasar,
                'downPayment': _currentDownPayment,
                'termMonths': _selectedTenor,
                'monthlyInstallment': selectedTermCalc.monthlyInstallment,
                'totalPrice': selectedTermCalc.totalPrice,
              });
            },
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildFormulaRow(
    String step,
    String formula,
    String result, {
    bool isHighlight = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isHighlight ? FontWeight.bold : FontWeight.w500,
                    color: isHighlight ? AppColors.primary : Colors.black87,
                  ),
                ),
                Text(
                  formula,
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
          Text(
            result,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isHighlight ? AppColors.primary : Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}
