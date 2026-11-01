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

enum CalculatorMode { single, bundle }

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
  CalculatorMode _calculatorMode = CalculatorMode.single;
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

  // G.15 Multi-Product Bundle Simulator State
  List<BundleItem> _bundleItems = [
    const BundleItem(
      id: 'b1',
      name: 'Smart TV 55 Inch UHD',
      category: 'Elektronik',
      quantity: 1,
      hargaDasar: 5000000,
      cashPrice: 5500000,
    ),
    const BundleItem(
      id: 'b2',
      name: 'Sofa Bed L-Shape Scandinavian',
      category: 'Furnitur',
      quantity: 1,
      hargaDasar: 3500000,
      cashPrice: 4000000,
    ),
  ];
  double _bundleDiscountPercent = 0.0;
  DpMode _bundleDpMode = DpMode.autoBracket;
  final _bundleCustomDpController = TextEditingController();
  double _bundleSelectedPercentage = 10.0;
  int _selectedBundleTenor = 10;

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
    _bundleCustomDpController.dispose();
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

  double get _currentBundleDownPayment {
    final totalHd = _bundleItems.fold<double>(
      0.0,
      (sum, it) => sum + (it.hargaDasar * (it.quantity > 0 ? it.quantity : 1)),
    );
    final discount = (totalHd * (_bundleDiscountPercent / 100.0)).roundToDouble();
    final netHd = (totalHd - discount).clamp(0.0, double.infinity);

    switch (_bundleDpMode) {
      case DpMode.autoBracket:
        return CreditCalculatorService.getSuggestedDp(netHd);
      case DpMode.percentage:
        return (netHd * (_bundleSelectedPercentage / 100.0)).roundToDouble();
      case DpMode.customNominal:
        final text = _bundleCustomDpController.text.replaceAll(RegExp(r'[^0-9]'), '');
        return double.tryParse(text) ?? 0.0;
    }
  }

  BundleSimulationResult get _bundleSimulation {
    return CreditCalculatorService.simulateBundle(
      items: _bundleItems,
      discountPercent: _bundleDiscountPercent,
      downPayment: _bundleDpMode == DpMode.autoBracket ? null : _currentBundleDownPayment,
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

  void _copyBundleQuotationToClipboard() {
    final user = ref.read(authProvider).user;
    final text = CreditCalculatorService.generateBundleShareSummary(
      simulation: _bundleSimulation,
      storeName: user?.storeName,
      localization: context.l10n,
    );

    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Simulasi paket bundle disalin! Siap dikirim ke WhatsApp pembeli.'),
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
        title: Text(
          _calculatorMode == CalculatorMode.single
              ? context.l10n.message353
              : 'Simulator Paket Kredit Bundle',
        ),
        actions: [
          const WorkerLanguageSwitcher(),
          IconButton(
            tooltip: context.l10n.message354,
            icon: const Icon(Icons.share_outlined),
            onPressed: _calculatorMode == CalculatorMode.bundle
                ? _copyBundleQuotationToClipboard
                : _copyQuotationToClipboard,
          ),
          IconButton(
            tooltip: context.l10n.message355,
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                if (_calculatorMode == CalculatorMode.single) {
                  _hdController.text = '4500000';
                  _customDpController.clear();
                  _selectedPercentage = 10.0;
                  _dpMode = DpMode.autoBracket;
                  _selectedProduct = null;
                  _manualNameController.clear();
                } else {
                  _bundleDiscountPercent = 0.0;
                  _bundleDpMode = DpMode.autoBracket;
                  _bundleCustomDpController.clear();
                  _bundleSelectedPercentage = 10.0;
                }
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: Theme.of(context).cardColor,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            child: SegmentedButton<CalculatorMode>(
              segments: const [
                ButtonSegment(
                  value: CalculatorMode.single,
                  label: Text('Simulasi Satuan (Custom DP)'),
                  icon: Icon(Icons.calculate_outlined),
                ),
                ButtonSegment(
                  value: CalculatorMode.bundle,
                  label: Text('Paket Bundle Showroom'),
                  icon: Icon(Icons.auto_awesome),
                ),
              ],
              selected: {_calculatorMode},
              onSelectionChanged: (set) {
                setState(() => _calculatorMode = set.first);
              },
            ),
          ),
          Expanded(
            child: _calculatorMode == CalculatorMode.single
                ? _buildSingleSimulatorView(context, sim, selectedTermCalc)
                : _buildBundleSimulatorView(context),
          ),
        ],
      ),
    );
  }

  Widget _buildSingleSimulatorView(
    BuildContext context,
    CreditSimulationResult sim,
    CreditTermCalculation selectedTermCalc,
  ) {
    return ListView(
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
      );
  }

  Widget _buildBundleSimulatorView(BuildContext context) {
    final bundleSim = _bundleSimulation;
    final selectedTermCalc = bundleSim.bundleTerms.firstWhere(
      (t) => t.termMonths == _selectedBundleTenor,
      orElse: () => bundleSim.bundleTerms.isNotEmpty
          ? bundleSim.bundleTerms.first
          : CreditCalculatorService.calculateTerm(
              hargaDasar: 0,
              downPayment: 0,
              termMonths: _selectedBundleTenor,
            ),
    );
    final monthlySaving = bundleSim.monthlySavings[_selectedBundleTenor] ?? 0.0;
    final separateMonthly = bundleSim.separateTotalMonthly[_selectedBundleTenor] ?? 0.0;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Showroom Bundling Header Card
        Card(
          color: Colors.indigo.withValues(alpha: 0.08),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.indigo.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.auto_awesome, color: Colors.indigo, size: 28),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Multi-Product Credit Bundle Simulator',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.indigo,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Gabungkan Elektronik (TV) & Furnitur (Sofa) dalam 1 kontrak cicilan terpadu dengan DP gabungan.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.indigo.shade900,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Quick Preset Bundles
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Preset Paket Populer Showroom:',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.living, size: 16),
                        label: const Text('Ruang Tamu: TV + Sofa'),
                        onPressed: () {
                          setState(() {
                            _bundleItems = [
                              const BundleItem(
                                id: 'p1',
                                name: 'Smart TV 55 Inch UHD 4K',
                                category: 'Elektronik',
                                quantity: 1,
                                hargaDasar: 5000000,
                                cashPrice: 5500000,
                              ),
                              const BundleItem(
                                id: 'p2',
                                name: 'Sofa Bed L-Shape Scandinavian',
                                category: 'Furnitur',
                                quantity: 1,
                                hargaDasar: 3500000,
                                cashPrice: 4000000,
                              ),
                            ];
                          });
                        },
                      ),
                      const SizedBox(width: 8),
                      ActionChip(
                        avatar: const Icon(Icons.bed, size: 16),
                        label: const Text('Kamar: Springbed + Lemari'),
                        onPressed: () {
                          setState(() {
                            _bundleItems = [
                              const BundleItem(
                                id: 'p3',
                                name: 'Springbed Queen 160x200',
                                category: 'Furnitur',
                                quantity: 1,
                                hargaDasar: 4200000,
                                cashPrice: 4800000,
                              ),
                              const BundleItem(
                                id: 'p4',
                                name: 'Lemari Pakaian 3 Pintu Cermin',
                                category: 'Furnitur',
                                quantity: 1,
                                hargaDasar: 3200000,
                                cashPrice: 3700000,
                              ),
                            ];
                          });
                        },
                      ),
                      const SizedBox(width: 8),
                      ActionChip(
                        avatar: const Icon(Icons.kitchen, size: 16),
                        label: const Text('Dapur: Kulkas + Mesin Cuci'),
                        onPressed: () {
                          setState(() {
                            _bundleItems = [
                              const BundleItem(
                                id: 'p5',
                                name: 'Kulkas 2 Pintu Inverter',
                                category: 'Elektronik',
                                quantity: 1,
                                hargaDasar: 4000000,
                                cashPrice: 4500000,
                              ),
                              const BundleItem(
                                id: 'p6',
                                name: 'Mesin Cuci Front Load 8kg',
                                category: 'Elektronik',
                                quantity: 1,
                                hargaDasar: 3800000,
                                cashPrice: 4200000,
                              ),
                            ];
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Items in Bundle List
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
                      'Produk Dalam Paket (${_bundleItems.length})',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.add_circle_outline, size: 18),
                      label: const Text('Tambah Produk'),
                      onPressed: () => _showAddBundleItemDialog(context),
                    ),
                  ],
                ),
                const Divider(),
                if (_bundleItems.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'Belum ada produk dalam paket. Klik "Tambah Produk" di atas.',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ),
                  )
                else
                  ..._bundleItems.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final item = entry.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            item.category.toLowerCase().contains('elektronik')
                                ? Icons.tv
                                : item.category.toLowerCase().contains('furnitur')
                                    ? Icons.chair
                                    : Icons.inventory_2,
                            color: item.category.toLowerCase().contains('elektronik')
                                ? Colors.blue
                                : Colors.amber.shade800,
                            size: 24,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade200,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        item.category,
                                        style: TextStyle(fontSize: 10, color: Colors.grey.shade800),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'HD: ${CreditCalculatorService.formatRupiah(item.hargaDasar)}',
                                      style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          // Quantity Controls
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove_circle_outline, size: 18),
                                visualDensity: VisualDensity.compact,
                                onPressed: item.quantity > 1
                                    ? () {
                                        setState(() {
                                          _bundleItems[idx] = item.copyWith(quantity: item.quantity - 1);
                                        });
                                      }
                                    : null,
                              ),
                              Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                              IconButton(
                                icon: const Icon(Icons.add_circle_outline, size: 18),
                                visualDensity: VisualDensity.compact,
                                onPressed: () {
                                  setState(() {
                                    _bundleItems[idx] = item.copyWith(quantity: item.quantity + 1);
                                  });
                                },
                              ),
                            ],
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                            visualDensity: VisualDensity.compact,
                            onPressed: () {
                              setState(() {
                                _bundleItems.removeAt(idx);
                              });
                            },
                          ),
                        ],
                      ),
                    );
                  }),
                const SizedBox(height: 8),
                // Total Summary Row
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.indigo.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Harga Dasar Item:'),
                          Text(
                            CreditCalculatorService.formatRupiah(bundleSim.totalHargaDasar),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      if (bundleSim.bundleDiscount > 0) ...[
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Diskon Promo Bundle (${_bundleDiscountPercent.toStringAsFixed(0)}%):',
                              style: const TextStyle(color: Colors.green),
                            ),
                            Text(
                              '- ${CreditCalculatorService.formatRupiah(bundleSim.bundleDiscount)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Harga Bersih Paket:'),
                            Text(
                              CreditCalculatorService.formatRupiah(bundleSim.netHargaDasar),
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.indigo),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Bundle Promotional Discount Selector
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Diskon Promo Paket Showroom:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [0.0, 5.0, 10.0, 15.0].map((pct) {
                    final isSelected = _bundleDiscountPercent == pct;
                    return ChoiceChip(
                      label: Text(pct == 0.0 ? 'Tanpa Diskon' : 'Diskon ${pct.toStringAsFixed(0)}%'),
                      selected: isSelected,
                      selectedColor: Colors.green.shade100,
                      onSelected: (sel) {
                        if (sel) setState(() => _bundleDiscountPercent = pct);
                      },
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Aggregated Down Payment (DP) Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Uang Muka (DP) Gabungan:',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    Text(
                      '${CreditCalculatorService.formatRupiah(bundleSim.downPayment)} (${bundleSim.dpPercentage.round()}%)',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.indigo),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SegmentedButton<DpMode>(
                  segments: const [
                    ButtonSegment(
                      value: DpMode.autoBracket,
                      label: Text('Auto Bracket'),
                    ),
                    ButtonSegment(
                      value: DpMode.percentage,
                      label: Text('Persentase'),
                    ),
                    ButtonSegment(
                      value: DpMode.customNominal,
                      label: Text('Nominal'),
                    ),
                  ],
                  selected: {_bundleDpMode},
                  onSelectionChanged: (set) {
                    setState(() => _bundleDpMode = set.first);
                  },
                ),
                if (_bundleDpMode == DpMode.percentage) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    children: [5.0, 10.0, 15.0, 20.0, 25.0].map((pct) {
                      return ChoiceChip(
                        label: Text('${pct.toStringAsFixed(0)}%'),
                        selected: _bundleSelectedPercentage == pct,
                        onSelected: (sel) {
                          if (sel) setState(() => _bundleSelectedPercentage = pct);
                        },
                      );
                    }).toList(),
                  ),
                ],
                if (_bundleDpMode == DpMode.customNominal) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _bundleCustomDpController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      prefixText: 'Rp ',
                      labelText: 'Nominal DP Gabungan',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Tenor Selection & Shared Installment Hero Card
        Card(
          color: Colors.white,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: Colors.indigo.shade200, width: 1.5),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Pilihan Tenor Cicilan Gabungan (Satu Kontrak):',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [6, 10, 12, 15, 18, 24].map((tenor) {
                      final isSelected = _selectedBundleTenor == tenor;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text('$tenor Bulan'),
                          selected: isSelected,
                          selectedColor: Colors.indigo.shade100,
                          labelStyle: TextStyle(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? Colors.indigo.shade900 : Colors.black87,
                          ),
                          onSelected: (sel) {
                            if (sel) setState(() => _selectedBundleTenor = tenor);
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 16),
                // Monthly Installment Hero
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.indigo.shade700, Colors.indigo.shade900],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Text(
                        'ANGSURAN BULANAN SATU KONTRAK',
                        style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 0.5),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        CreditCalculatorService.formatRupiah(selectedTermCalc.monthlyInstallment),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'per bulan x $_selectedBundleTenor Bulan',
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      if (monthlySaving > 0) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.shade500,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '🎉 Hemat ${CreditCalculatorService.formatRupiah(monthlySaving)}/bulan vs Kredit Terpisah!',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Jika Dicicil Terpisah: ${CreditCalculatorService.formatRupiah(separateMonthly)}/bln',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                    Text(
                      'Total: ${CreditCalculatorService.formatRupiah(selectedTermCalc.totalCustomerCost)}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Comparison Table Across All Tenors
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Tabel Komparasi Cicilan Semua Tenor:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 8),
                Table(
                  columnWidths: const {
                    0: FlexColumnWidth(1.2),
                    1: FlexColumnWidth(1.8),
                    2: FlexColumnWidth(1.8),
                    3: FlexColumnWidth(1.8),
                  },
                  children: [
                    TableRow(
                      decoration: BoxDecoration(color: Colors.grey.shade100),
                      children: const [
                        Padding(
                          padding: EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                          child: Text('Tenor', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                          child: Text('Paket Bundle', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                          child: Text('Terpisah', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                          child: Text('Hemat/Bln', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.green)),
                        ),
                      ],
                    ),
                    ...bundleSim.bundleTerms.map((term) {
                      final sep = bundleSim.separateTotalMonthly[term.termMonths] ?? 0.0;
                      final sav = bundleSim.monthlySavings[term.termMonths] ?? 0.0;
                      final isCurrent = term.termMonths == _selectedBundleTenor;
                      return TableRow(
                        decoration: isCurrent ? BoxDecoration(color: Colors.indigo.shade50) : null,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                            child: Text('${term.termMonths} bln', style: TextStyle(fontSize: 11, fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal)),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                            child: Text(CreditCalculatorService.formatRupiah(term.monthlyInstallment), style: TextStyle(fontSize: 11, fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal)),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                            child: Text(CreditCalculatorService.formatRupiah(sep), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                            child: Text(
                              sav > 0 ? CreditCalculatorService.formatRupiah(sav) : '-',
                              style: const TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Action Buttons for Bundle
        FilledButton.icon(
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            backgroundColor: Colors.green.shade700,
          ),
          icon: const Icon(Icons.share_outlined),
          label: const Text(
            'Salin Rincian Paket untuk WhatsApp',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          onPressed: _copyBundleQuotationToClipboard,
        ),
        const SizedBox(height: 8),

        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          icon: const Icon(Icons.check_circle_outline),
          label: Text(
            'Gunakan Kontrak Paket Ini ($_selectedBundleTenor bln @ ${CreditCalculatorService.formatRupiah(selectedTermCalc.monthlyInstallment)})',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          onPressed: () {
            Navigator.pop(context, {
              'isBundle': true,
              'bundleItems': _bundleItems,
              'totalHargaDasar': bundleSim.totalHargaDasar,
              'bundleDiscount': bundleSim.bundleDiscount,
              'netHargaDasar': bundleSim.netHargaDasar,
              'downPayment': bundleSim.downPayment,
              'termMonths': _selectedBundleTenor,
              'monthlyInstallment': selectedTermCalc.monthlyInstallment,
              'totalPrice': selectedTermCalc.totalPrice,
            });
          },
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  void _showAddBundleItemDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    String category = 'Elektronik';
    int qty = 1;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            return AlertDialog(
              title: const Text('Tambah Produk ke Paket'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Nama Produk / Model',
                        hintText: 'Misal: Kulkas Sharp 2 Pintu',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: category,
                      decoration: const InputDecoration(
                        labelText: 'Kategori Produk',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Elektronik', child: Text('Elektronik')),
                        DropdownMenuItem(value: 'Furnitur', child: Text('Furnitur')),
                        DropdownMenuItem(value: 'Gadget', child: Text('Gadget & IT')),
                        DropdownMenuItem(value: 'Rumah Tangga', child: Text('Rumah Tangga')),
                        DropdownMenuItem(value: 'Lainnya', child: Text('Lainnya')),
                      ],
                      onChanged: (val) {
                        if (val != null) setDialogState(() => category = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: priceCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        prefixText: 'Rp ',
                        labelText: 'Harga Dasar (HD)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Jumlah (Qty):'),
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline),
                              onPressed: qty > 1 ? () => setDialogState(() => qty--) : null,
                            ),
                            Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold)),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline),
                              onPressed: () => setDialogState(() => qty++),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Batal'),
                ),
                FilledButton(
                  onPressed: () {
                    final name = nameCtrl.text.trim();
                    final rawPrice = priceCtrl.text.replaceAll(RegExp(r'[^0-9]'), '');
                    final price = double.tryParse(rawPrice) ?? 0.0;
                    if (name.isNotEmpty && price > 0) {
                      setState(() {
                        _bundleItems.add(
                          BundleItem(
                            id: 'item_${DateTime.now().millisecondsSinceEpoch}',
                            name: name,
                            category: category,
                            quantity: qty,
                            hargaDasar: price,
                            cashPrice: price,
                          ),
                        );
                      });
                      Navigator.pop(ctx);
                    }
                  },
                  child: const Text('Tambahkan'),
                ),
              ],
            );
          },
        );
      },
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
