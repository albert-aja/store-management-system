import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/models/user_profile.dart';
import '../../auth/providers/auth_provider.dart';
class SalesWorkCenterScreen extends ConsumerStatefulWidget {
  const SalesWorkCenterScreen({super.key});
  @override
  ConsumerState<SalesWorkCenterScreen> createState() =>
      _SalesWorkCenterScreenState();
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
  String? _error;
  int? _confirmedOrders;
  double? _salesVolume;
  double? _commission;
  final double _monthlyQuotaTarget = 50000000.0;
  double get _quotaProgress => _monthlyQuotaTarget > 0 ? ((_salesVolume ?? 0) / _monthlyQuotaTarget) : 0.0;
  String get _quotaPercent => (_quotaProgress * 100).toStringAsFixed(1);
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
  String _formatCurrency(double? value) => value == null
      ? '—'
      : 'Rp ${value.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (match) => '${match[1]}.')}';
  Future<void> _loadProgress() async {
    final user = _user;
    if (user?.storeId == null) return;
    try {
      final now = DateTime.now();
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get(
            '/api/v1/reporting/sales-performance',
            queryParameters: {
              'storeId': user!.storeId,
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
        final mine = rows.where((row) => row['salespersonId'] == user.id);
        final row = mine.firstOrNull;
        if (mounted) {
          setState(() {
            _confirmedOrders =
                (row?['confirmedOrdersCount'] as num?)?.toInt() ?? 0;
            _salesVolume = (row?['totalSalesVolume'] as num?)?.toDouble() ?? 0;
            _commission =
                (row?['estimatedCommission'] as num?)?.toDouble() ?? 0;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'Sales progress unavailable. Check access or connection.',
        );
      }
    }
  }
  Future<void> _searchCustomers() async {
    final query = _customerQuery.text.trim();
    if (query.isEmpty) {
      setState(() => _error = 'Enter customer name or phone to search.');
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
        throw const FormatException('Customer search returned invalid data.');
      }
      setState(() {
        _customers = (response.data as List).cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = 'Customer search failed: $error';
      });
    }
  }
  Future<void> _createDraft(Map<String, dynamic> customer) async {
    final user = _user;
    if (user?.storeId == null) {
      setState(() => _error = 'Your profile has no store assignment.');
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
        _error = 'Draft quotation could not be created: $error';
      });
    }
  }
  Future<void> _searchProducts() async {
    final query = _productQuery.text.trim();
    if (query.isEmpty) {
      setState(() => _error = 'Enter product name or code to search.');
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
        throw const FormatException('Product search returned invalid data.');
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
        _error = 'Product search failed: $error';
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
        throw StateError('No active product variants found.');
      }
      final prices = (responses[1].data as List).cast<Map<String, dynamic>>();
      final variant = variants.firstWhere(
        (candidate) => prices.any(
          (price) =>
              price['productVariantId'] == candidate['id'] &&
              price['active'] == true,
        ),
        orElse: () =>
            throw StateError('No active store price for this product.'),
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
        throw const FormatException('Quote items returned invalid data.');
      }
      setState(() {
        _quoteItems = (itemsResponse.data as List).cast<Map<String, dynamic>>();
        _isLoading = false;
        _error = null;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${product['name']} added to draft quote.')),
        );
      }
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = 'Could not add product to quote: $error';
      });
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
      appBar: AppBar(title: const Text('Salesperson Work Center')),
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
                            const Icon(
                              Icons.trending_up,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _confirmedOrders == null
                                    ? 'Sales progress unavailable'
                                    : '$_confirmedOrders confirmed orders this month',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                            IconButton(
                              tooltip: 'Refresh progress',
                              onPressed: _loadProgress,
                              icon: const Icon(Icons.refresh),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Actual: ${_formatCurrency(_salesVolume)} / Target: ${_formatCurrency(_monthlyQuotaTarget)} ($_quotaPercent%)',
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: _quotaProgress.clamp(0.0, 1.0),
                            backgroundColor: Colors.grey.shade200,
                            valueColor: AlwaysStoppedAnimation<Color>(_quotaProgress >= 1.0 ? Colors.green : AppColors.primary),
                            minHeight: 8,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Estimated Commission: ${_formatCurrency(_commission)}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.primary,
                          ),
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
                        _error!,
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
                              ? 'Find customer'
                              : 'Quote draft: ${_draft!['number'] ?? _draft!['id']}',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        if (_customer != null) ...[
                          const SizedBox(height: 4),
                          Text('Customer: ${_customer!['fullName']}'),
                          if (_quoteItems.isNotEmpty) ...[
                            const Divider(height: 20),
                            ..._quoteItems.map(
                              (item) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                  item['variantName']?.toString() ?? 'Item',
                                ),
                                subtitle: Text(
                                  'Quantity: ${item['quantity'] ?? 0}',
                                ),
                                trailing: Text(
                                  'Rp ${(((item['finalPrice'] as num?)?.toDouble() ?? 0) * ((item['quantity'] as num?)?.toInt() ?? 0)).toStringAsFixed(0)}',
                                ),
                              ),
                            ),
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: const Text(
                                'Quote total',
                                style: TextStyle(fontWeight: FontWeight.w700),
                              ),
                              trailing: Text(
                                'Rp ${quoteTotal.toStringAsFixed(0)}',
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
                            decoration: const InputDecoration(
                              labelText: 'Customer name or phone',
                              prefixIcon: Icon(Icons.search),
                            ),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton(
                            onPressed: _searchCustomers,
                            child: const Text('Search Customers'),
                          ),
                          ..._customers.map(
                            (customer) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                customer['fullName']?.toString() ?? 'Customer',
                              ),
                              subtitle: Text(
                                customer['primaryPhone']?.toString() ?? '',
                              ),
                              trailing: IconButton(
                                tooltip: 'Create draft quotation',
                                icon: const Icon(Icons.add_shopping_cart),
                                onPressed: () => _createDraft(customer),
                              ),
                            ),
                          ),
                        ] else ...[
                          const SizedBox(height: 4),
                          Text('Customer: ${_customer!['fullName']}'),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _productQuery,
                            textInputAction: TextInputAction.search,
                            onSubmitted: (_) => _searchProducts(),
                            decoration: const InputDecoration(
                              labelText: 'Product name or code',
                              prefixIcon: Icon(Icons.search),
                            ),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton(
                            onPressed: _searchProducts,
                            child: const Text('Search Products'),
                          ),
                          ..._products.map(
                            (product) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                product['name']?.toString() ?? 'Product',
                              ),
                              subtitle: Text(product['code']?.toString() ?? ''),
                              trailing: IconButton(
                                tooltip: 'Add one unit at store cash price',
                                icon: const Icon(Icons.add_circle_outline),
                                onPressed: () => _addProduct(product),
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
