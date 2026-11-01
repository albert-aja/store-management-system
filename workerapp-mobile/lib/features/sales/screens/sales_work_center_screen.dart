import 'package:sms_mobile/core/localization/worker_format.dart';
import 'package:sms_mobile/core/localization/worker_message.dart';
import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/models/user_profile.dart';
import '../../auth/providers/auth_provider.dart';
import 'credit_calculator_screen.dart';

class SalesWorkCenterScreen extends ConsumerStatefulWidget {
  const SalesWorkCenterScreen({super.key});
  @override
  ConsumerState<SalesWorkCenterScreen> createState() =>
      _SalesWorkCenterScreenState();
}

Color _parseHexColor(
  String? hexString, {
  Color defaultColor = AppColors.primary,
}) {
  if (hexString == null || hexString.isEmpty) return defaultColor;
  try {
    String cleanHex = hexString.replaceAll('#', '');
    if (cleanHex.length == 6) {
      cleanHex = 'FF$cleanHex';
    }
    return Color(int.parse(cleanHex, radix: 16));
  } catch (_) {
    return defaultColor;
  }
}

class _SalesWorkCenterScreenState extends ConsumerState<SalesWorkCenterScreen> {
  final _customerQuery = TextEditingController();
  final _productQuery = TextEditingController();
  List<Map<String, dynamic>> _customers = [];
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _quoteItems = [];
  Map<String, dynamic>? _customer;
  Map<String, dynamic>? _draft;
  bool _isLoading = false;
  WorkerMessage? _error;
  int? _confirmedOrders;
  double? _salesVolume;
  double? _commission;
  String _tierName = 'Bronze';
  String _tierColor = '#CD7F32';
  double _commissionRate = 0.01;
  String? _nextTierName;
  double? _volumeNeeded;
  double _tierProgress = 0.0;
  List<Map<String, dynamic>> _spvLeaderboard = [];
  bool _isLoadingLeaderboard = false;
  @override
  void initState() {
    super.initState();
    Future.microtask(_loadProgress);
  }

  @override
  void dispose() {
    _customerQuery.dispose();
    _productQuery.dispose();
    super.dispose();
  }

  UserProfile? get _user => ref.read(authProvider).user;
  String _formatCurrency(double? value) =>
      value == null ? '—' : context.rupiah(value);
  Future<void> _loadProgress() async {
    final user = _user;
    if (user?.storeId == null) return;
    final now = DateTime.now();
    final startStr = DateTime(
      now.year,
      now.month,
      1,
    ).toIso8601String().substring(0, 10);
    final endStr = now.toIso8601String().substring(0, 10);
    // 1. First try scoped personal endpoint
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get(
            '/api/v1/reporting/sales-performance/my-tier',
            queryParameters: {
              'storeId': user!.storeId,
              'salespersonId': user.id,
              'startDate': startStr,
              'endDate': endStr,
            },
          );
      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        if (mounted) {
          setState(() {
            _confirmedOrders =
                (data['confirmedOrdersCount'] as num?)?.toInt() ?? 0;
            _salesVolume = (data['totalSalesVolume'] as num?)?.toDouble() ?? 0;
            _commission =
                (data['estimatedCommission'] as num?)?.toDouble() ?? 0;
            _tierName = (data['currentTierName'] as String?) ?? 'Bronze';
            _tierColor = (data['currentTierColor'] as String?) ?? '#CD7F32';
            _commissionRate =
                (data['currentCommissionRate'] as num?)?.toDouble() ?? 0.01;
            _nextTierName = data['nextTierName'] as String?;
            _volumeNeeded = (data['volumeNeededForNextTier'] as num?)
                ?.toDouble();
            _tierProgress =
                (data['progressPercentage'] as num?)?.toDouble() ?? 0.0;
          });
          return;
        }
      }
    } catch (_) {
      // Fallback to legacy reporting query
    }
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get(
            '/api/v1/reporting/sales-performance',
            queryParameters: {
              'storeId': user!.storeId,
              'startDate': startStr,
              'endDate': endStr,
            },
          );
      if (response.data is List) {
        final rows = (response.data as List).cast<Map<String, dynamic>>();
        final mine = rows.where((row) => row['salespersonId'] == user.id);
        final row = mine.firstOrNull;
        if (mounted) {
          setState(() {
            _confirmedOrders =
                (row?['confirmedOrdersCount'] as num?)?.toInt() ?? 0;
            _salesVolume = (row?['totalSalesVolume'] as num?)?.toDouble() ?? 0;
            _commission =
                (row?['estimatedCommission'] as num?)?.toDouble() ?? 0;
            _tierName = (row?['tierName'] as String?) ?? 'Bronze';
            _tierColor = (row?['tierColor'] as String?) ?? '#CD7F32';
            _commissionRate =
                (row?['commissionRate'] as num?)?.toDouble() ?? 0.01;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = WorkerMessage((l10n) => l10n.message408));
      }
    }
  }

  Future<void> _loadSpvLeaderboard() async {
    final user = _user;
    if (user?.storeId == null || (!user!.isSPV && !user.isManager)) return;
    setState(() => _isLoadingLeaderboard = true);
    try {
      final now = DateTime.now();
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get(
            '/api/v1/reporting/sales-performance',
            queryParameters: {
              'storeId': user.storeId,
              'startDate': DateTime(
                now.year,
                now.month,
                1,
              ).toIso8601String().substring(0, 10),
              'endDate': now.toIso8601String().substring(0, 10),
            },
          );
      if (response.data is List) {
        final rows = (response.data as List).cast<Map<String, dynamic>>();
        if (mounted) {
          setState(() {
            _spvLeaderboard = rows;
            _isLoadingLeaderboard = false;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingLeaderboard = false);
      }
    }
  }

  Future<void> _searchCustomers() async {
    final query = _customerQuery.text.trim();
    if (query.isEmpty) {
      setState(() => _error = WorkerMessage((l10n) => l10n.message409));
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get('/api/customers', queryParameters: {'query': query});
      if (response.data is! List) {
        throw WorkerMessage((l10n) => l10n.message410);
      }
      setState(() {
        _customers = (response.data as List).cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = WorkerMessage(
          (l10n) => l10n.message411(localizedError(l10n, error)),
        );
      });
    }
  }

  Future<void> _createDraft(Map<String, dynamic> customer) async {
    final user = _user;
    if (user?.storeId == null) {
      setState(() => _error = WorkerMessage((l10n) => l10n.message286));
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .post(
            '/api/sales-orders',
            data: {'storeId': user!.storeId, 'customerId': customer['id']},
          );
      setState(() {
        _customer = customer;
        _draft = response.data as Map<String, dynamic>;
        _quoteItems = [];
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = WorkerMessage(
          (l10n) => l10n.message412(localizedError(l10n, error)),
        );
      });
    }
  }

  Future<void> _searchProducts() async {
    final query = _productQuery.text.trim();
    if (query.isEmpty) {
      setState(() => _error = WorkerMessage((l10n) => l10n.message413));
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get('/api/products', queryParameters: {'query': query});
      if (response.data is! List) {
        throw WorkerMessage((l10n) => l10n.message414);
      }
      setState(() {
        _products = (response.data as List)
            .cast<Map<String, dynamic>>()
            .where((product) => product['active'] == true)
            .toList();
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = WorkerMessage(
          (l10n) => l10n.message415(localizedError(l10n, error)),
        );
      });
    }
  }

  Future<void> _addProduct(Map<String, dynamic> product) async {
    final draftId = _draft?['id'];
    final storeId = _user?.storeId;
    if (draftId == null || storeId == null) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final client = ref.read(apiClientProvider).dio;
      final responses = await Future.wait([
        client.get('/api/products/${product['id']}/variants'),
        client.get('/api/stores/$storeId/pricing'),
      ]);
      final variants = (responses[0].data as List)
          .cast<Map<String, dynamic>>()
          .where((variant) => variant['active'] == true);
      if (variants.isEmpty) {
        throw WorkerMessage((l10n) => l10n.message416);
      }
      final prices = (responses[1].data as List).cast<Map<String, dynamic>>();
      final variant = variants.firstWhere(
        (candidate) => prices.any(
          (price) =>
              price['productVariantId'] == candidate['id'] &&
              price['active'] == true,
        ),
        orElse: () => throw WorkerMessage((l10n) => l10n.message417),
      );
      final price = prices.firstWhere(
        (entry) => entry['productVariantId'] == variant['id'],
      );
      await client.post(
        '/api/sales-orders/$draftId/items',
        data: {
          'productVariantId': variant['id'],
          'quantity': 1,
          'paymentTermMonths': 0,
          'finalPrice': price['cashPrice'],
        },
      );
      final itemsResponse = await client.get(
        '/api/sales-orders/$draftId/items',
      );
      if (itemsResponse.data is! List) {
        throw WorkerMessage((l10n) => l10n.message418);
      }
      setState(() {
        _quoteItems = (itemsResponse.data as List).cast<Map<String, dynamic>>();
        _isLoading = false;
        _error = null;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.l10n.message419((product['name']).toString()),
            ),
          ),
        );
      }
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = WorkerMessage(
          (l10n) => l10n.message420(localizedError(l10n, error)),
        );
      });
    }
  }

  Future<void> _openCalculator() async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(builder: (context) => const CreditCalculatorScreen()),
    );
    if (result != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.message421(
              (result['productName']).toString(),
              (result['termMonths']).toString(),
              (context.rupiah(result['monthlyInstallment'])).toString(),
            ),
          ),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _openCalculatorForProduct(Map<String, dynamic> product) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => CreditCalculatorScreen(
          initialProductName: product['name']?.toString(),
          initialProductCode: product['code']?.toString(),
        ),
      ),
    );
    if (result != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.message422(
              (result['productName']).toString(),
              (result['termMonths']).toString(),
              (context.rupiah(result['monthlyInstallment'])).toString(),
            ),
          ),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final quoteTotal = _quoteItems.fold<double>(
      0,
      (sum, item) =>
          sum +
          ((item['finalPrice'] as num?)?.toDouble() ?? 0) *
              ((item['quantity'] as num?)?.toInt() ?? 0),
    );
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.message423),
        actions: const [WorkerLanguageSwitcher()],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.workspace_premium,
                              color: _parseHexColor(_tierColor),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _confirmedOrders == null
                                    ? context.l10n.message424
                                    : context.l10n.message425(
                                        (_confirmedOrders).toString(),
                                      ),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: _parseHexColor(
                                  _tierColor,
                                ).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _parseHexColor(_tierColor),
                                  width: 1.2,
                                ),
                              ),
                              child: Text(
                                _tierName.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: _parseHexColor(_tierColor),
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            IconButton(
                              tooltip: context.l10n.message426,
                              onPressed: _loadProgress,
                              icon: const Icon(Icons.refresh),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Volume: ${_formatCurrency(_salesVolume)}',
                              style: TextStyle(
                                color: Colors.grey.shade800,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              'Rate: ${(_commissionRate * 100).toStringAsFixed(1)}%',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value:
                                (_nextTierName != null
                                        ? (_tierProgress / 100.0)
                                        : 1.0)
                                    .clamp(0.0, 1.0),
                            backgroundColor: Colors.grey.shade200,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              _parseHexColor(_tierColor),
                            ),
                            minHeight: 8,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                _nextTierName != null && _volumeNeeded != null
                                    ? 'Next: $_nextTierName (${_formatCurrency(_volumeNeeded)} needed)'
                                    : 'Top Tier Achieved',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey.shade700,
                                  fontStyle: FontStyle.italic,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              context.l10n.message428(
                                (_formatCurrency(_commission)).toString(),
                              ),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: _parseHexColor(_tierColor),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                if (_user?.isSPV == true || _user?.isManager == true) ...[
                  const SizedBox(height: 12),
                  Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: AppColors.primary.withValues(alpha: 0.4),
                      ),
                    ),
                    child: ExpansionTile(
                      leading: const Icon(
                        Icons.leaderboard,
                        color: AppColors.primary,
                      ),
                      title: const Text(
                        'Showroom Leaderboard (SPV View)',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        'Team sales performance & tier rankings',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      onExpansionChanged: (expanded) {
                        if (expanded && _spvLeaderboard.isEmpty) {
                          _loadSpvLeaderboard();
                        }
                      },
                      children: [
                        if (_isLoadingLeaderboard)
                          const Padding(
                            padding: EdgeInsets.all(16),
                            child: Center(child: CircularProgressIndicator()),
                          )
                        else if (_spvLeaderboard.isEmpty)
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: _loadSpvLeaderboard,
                                  icon: const Icon(Icons.refresh, size: 16),
                                  label: const Text('Load Team Rankings'),
                                ),
                              ],
                            ),
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _spvLeaderboard.length,
                            separatorBuilder: (ctx, idx) =>
                                const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final item = _spvLeaderboard[index];
                              final name =
                                  item['salespersonName'] as String? ??
                                  'Salesperson';
                              final volume =
                                  (item['totalSalesVolume'] as num?)
                                      ?.toDouble() ??
                                  0;
                              final orders =
                                  (item['confirmedOrdersCount'] as num?)
                                      ?.toInt() ??
                                  0;
                              final tier =
                                  item['tierName'] as String? ?? 'Bronze';
                              final color = _parseHexColor(
                                item['tierColor'] as String?,
                              );
                              final isTop3 = index < 3;
                              return ListTile(
                                dense: true,
                                leading: CircleAvatar(
                                  radius: 14,
                                  backgroundColor: isTop3
                                      ? AppColors.primary
                                      : Colors.grey.shade300,
                                  child: Text(
                                    '${index + 1}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: isTop3
                                          ? Colors.white
                                          : Colors.black87,
                                    ),
                                  ),
                                ),
                                title: Text(
                                  name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                subtitle: Text(
                                  '$orders orders • ${_formatCurrency(volume)}',
                                  style: const TextStyle(fontSize: 11),
                                ),
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: color.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: color, width: 1),
                                  ),
                                  child: Text(
                                    tier,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: color,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.calculate_rounded,
                            color: AppColors.primary,
                            size: 32,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                context.l10n.message429,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                context.l10n.message430,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        FilledButton.tonal(
                          onPressed: _openCalculator,
                          child: Text(context.l10n.message431),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                if (_error != null)
                  Card(
                    color: AppColors.error.withValues(alpha: 0.08),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        context.errorText(_error),
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ),
                  ),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          _draft == null
                              ? context.l10n.message432
                              : context.l10n.message433(
                                  (_draft!['number'] ?? _draft!['id'])
                                      .toString(),
                                ),
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        if (_customer != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            context.l10n.message316(
                              (_customer!['fullName']).toString(),
                            ),
                          ),
                          if (_quoteItems.isNotEmpty) ...[
                            const Divider(height: 20),
                            ..._quoteItems.map(
                              (item) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                  item['variantName']?.toString() ??
                                      context.l10n.message405,
                                ),
                                subtitle: Text(
                                  context.l10n.message406(
                                    (item['quantity'] ?? 0).toString(),
                                  ),
                                ),
                                trailing: Text(
                                  context.rupiah(
                                    ((item['finalPrice'] as num?)?.toDouble() ??
                                            0) *
                                        ((item['quantity'] as num?)?.toInt() ??
                                            0),
                                  ),
                                ),
                              ),
                            ),
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                context.l10n.message407,
                                style: TextStyle(fontWeight: FontWeight.w700),
                              ),
                              trailing: Text(
                                context.rupiah(quoteTotal),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ],
                        if (_customer == null) ...[
                          const SizedBox(height: 12),
                          TextField(
                            controller: _customerQuery,
                            textInputAction: TextInputAction.search,
                            onSubmitted: (_) => _searchCustomers(),
                            decoration: InputDecoration(
                              labelText: context.l10n.message434,
                              prefixIcon: Icon(Icons.search),
                            ),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton(
                            onPressed: _searchCustomers,
                            child: Text(context.l10n.message435),
                          ),
                          ..._customers.map(
                            (customer) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                customer['fullName']?.toString() ??
                                    context.l10n.message403,
                              ),
                              subtitle: Text(
                                customer['primaryPhone']?.toString() ?? '',
                              ),
                              trailing: IconButton(
                                tooltip: context.l10n.message436,
                                icon: const Icon(Icons.add_shopping_cart),
                                onPressed: () => _createDraft(customer),
                              ),
                            ),
                          ),
                        ] else ...[
                          const SizedBox(height: 4),
                          Text(
                            context.l10n.message316(
                              (_customer!['fullName']).toString(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _productQuery,
                            textInputAction: TextInputAction.search,
                            onSubmitted: (_) => _searchProducts(),
                            decoration: InputDecoration(
                              labelText: context.l10n.message437,
                              prefixIcon: Icon(Icons.search),
                            ),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton(
                            onPressed: _searchProducts,
                            child: Text(context.l10n.message438),
                          ),
                          ..._products.map(
                            (product) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                product['name']?.toString() ??
                                    context.l10n.message170,
                              ),
                              subtitle: Text(product['code']?.toString() ?? ''),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    tooltip: context.l10n.message439,
                                    icon: const Icon(
                                      Icons.calculate_outlined,
                                      color: AppColors.primary,
                                    ),
                                    onPressed: () =>
                                        _openCalculatorForProduct(product),
                                  ),
                                  IconButton(
                                    tooltip: context.l10n.message440,
                                    icon: const Icon(Icons.add_circle_outline),
                                    onPressed: () => _addProduct(product),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
