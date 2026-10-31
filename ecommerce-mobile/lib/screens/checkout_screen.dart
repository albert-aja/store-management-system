import '../core/app_text.dart';
import '../core/localized_errors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../core/currency_formatter.dart';
import '../models/checkout_model.dart';
import '../providers/cart_provider.dart';
import '../providers/catalog_provider.dart';
import '../providers/auth_provider.dart';
import 'order_success_screen.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _nameCtrl = TextEditingController(text: 'Budi Santoso');
  final _phoneCtrl = TextEditingController(text: '081234567890');
  final _addressCtrl = TextEditingController(
    text: 'Jl. Melati Indah No. 12, Kebayoran Baru, Jakarta Selatan',
  );

  String _fulfillmentMethod = 'DELIVERY'; // DELIVERY or PICKUP
  String _fulfillmentPreference = 'PARTIAL'; // PARTIAL or COMPLETE
  String _selectedPaymentMethod = 'QRIS';
  String _selectedBranch = 'br-1';

  List<PaymentMethod> _paymentMethods = [];
  List<PickupBranch> _branches = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).value;
    if (user != null) {
      _nameCtrl.text = user.fullName;
      _phoneCtrl.text = user.phone ?? '';
    }
    _loadCheckoutConfig();
  }

  Future<void> _loadCheckoutConfig() async {
    final api = ref.read(apiClientProvider);
    final pms = await api.getPaymentMethods();
    final brs = await api.getPickupBranches();
    if (mounted) {
      setState(() {
        _paymentMethods = pms;
        _branches = brs;
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final hasIndentItems = cart.items.any((i) => !i.isReadyStock);
    final requiredDeposit = hasIndentItems
        ? (cart.totalAmount * 0.3).roundToDouble()
        : cart.totalAmount;

    if (_isLoading) {
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          AppText.checkoutOrderConfirmation(context),
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 1: Customer Contact
            _buildSectionHeader(
              Icons.person_outline,
              AppText.contactRecipient(context),
            ),
            SizedBox(height: 10),
            Container(
              padding: EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: Column(
                children: [
                  TextField(
                    controller: _nameCtrl,
                    decoration: InputDecoration(
                      labelText: AppText.fullName(context),
                      isDense: true,
                    ),
                  ),
                  SizedBox(height: 10),
                  TextField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: AppText.whatsappMobileNumber(context),
                      isDense: true,
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 20),

            // Section 2: Decision B - Fulfillment Method
            _buildSectionHeader(
              Icons.local_shipping_outlined,
              AppText.deliveryOrPickup(context),
            ),
            SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildChoiceCard(
                    title: AppText.storeFleetDelivery(context),
                    subtitle: AppText.deliveredDirectlyByAnSmsMart(context),
                    icon: Icons.local_shipping,
                    isSelected: _fulfillmentMethod == 'DELIVERY',
                    onTap: () =>
                        setState(() => _fulfillmentMethod = 'DELIVERY'),
                  ),
                ),
                SizedBox(width: 10),
                Expanded(
                  child: _buildChoiceCard(
                    title: AppText.branchPickup(context),
                    subtitle: AppText.noDeliveryFeeAtYourNearest(context),
                    icon: Icons.storefront,
                    isSelected: _fulfillmentMethod == 'PICKUP',
                    onTap: () => setState(() => _fulfillmentMethod = 'PICKUP'),
                  ),
                ),
              ],
            ),

            if (_fulfillmentMethod == 'DELIVERY') ...[
              SizedBox(height: 10),
              Container(
                padding: EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: TextField(
                  controller: _addressCtrl,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: AppText.fullDeliveryAddress(context),
                    isDense: true,
                  ),
                ),
              ),
            ] else ...[
              SizedBox(height: 10),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedBranch,
                    isExpanded: true,
                    items: _branches.map((b) {
                      return DropdownMenuItem(
                        value: b.id,
                        child: Text(
                          '${b.name} (${b.address})',
                          style: TextStyle(fontSize: 13),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedBranch = val);
                    },
                  ),
                ),
              ),
            ],

            SizedBox(height: 20),

            // Section 3: Decision A - Fulfillment Completeness
            _buildSectionHeader(
              Icons.splitscreen_outlined,
              AppText.fulfillmentPreference(context),
            ),
            SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildChoiceCard(
                    title: AppText.partialDelivery(context),
                    subtitle: AppText.deliverInStockItemsFirstPreorders(
                      context,
                    ),
                    icon: Icons.call_split,
                    isSelected: _fulfillmentPreference == 'PARTIAL',
                    onTap: () =>
                        setState(() => _fulfillmentPreference = 'PARTIAL'),
                  ),
                ),
                SizedBox(width: 10),
                Expanded(
                  child: _buildChoiceCard(
                    title: AppText.completeDelivery(context),
                    subtitle: AppText.waitUntilAllItemsAreAvailable(context),
                    icon: Icons.done_all,
                    isSelected: _fulfillmentPreference == 'COMPLETE',
                    onTap: () =>
                        setState(() => _fulfillmentPreference = 'COMPLETE'),
                  ),
                ),
              ],
            ),

            // Deposit-first notice banner if indent items present
            if (hasIndentItems) ...[
              SizedBox(height: 12),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Color(0xFFFDE68A)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Color(0xFFD97706),
                      size: 18,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppText.procurementAuthorizationDepositFirst(
                              context,
                            ),
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: Color(0xFF92400E),
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            AppText.yourOrderContainsPreorderedProductsA(
                              context,
                              CurrencyFormatter.format(
                                requiredDeposit,
                                context,
                              ),
                            ),
                            style: TextStyle(
                              fontSize: 11,
                              color: Color(0xFFB45309),
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            SizedBox(height: 20),

            // Section 4: Configurable Payment Method
            _buildSectionHeader(
              Icons.payment_outlined,
              AppText.paymentMethod(context),
            ),
            SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                itemCount: _paymentMethods.length,
                separatorBuilder: (context, index) => Divider(height: 1),
                itemBuilder: (context, idx) {
                  final pm = _paymentMethods[idx];
                  final isSelected = _selectedPaymentMethod == pm.code;
                  return InkWell(
                    onTap: () =>
                        setState(() => _selectedPaymentMethod = pm.code),
                    child: Container(
                      color: isSelected
                          ? Color(0xFFF0F9FF)
                          : Colors.transparent,
                      padding: EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 20,
                            height: 20,
                            margin: EdgeInsets.only(right: 10),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSelected
                                    ? AppTheme.primarySky
                                    : Colors.grey.shade400,
                                width: isSelected ? 6 : 2,
                              ),
                            ),
                          ),
                          SizedBox(width: 6),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      paymentName(context, pm.code, pm.name),
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                    if (pm.requiresApproval) ...[
                                      SizedBox(width: 6),
                                      Container(
                                        padding: EdgeInsets.symmetric(
                                          horizontal: 5,
                                          vertical: 1,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.amber.shade100,
                                          borderRadius: BorderRadius.circular(
                                            4,
                                          ),
                                        ),
                                        child: Text(
                                          AppText.surveyRequired(context),
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.brown,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                SizedBox(height: 2),
                                Text(
                                  paymentDescription(
                                    context,
                                    pm.code,
                                    pm.description,
                                  ),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            SizedBox(height: 20),

            // Section 5: Order Breakdown
            _buildSectionHeader(
              Icons.receipt_long_outlined,
              AppText.billingSummary(context),
            ),
            SizedBox(height: 10),
            Container(
              padding: EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppText.itemsSubtotal(context),
                        style: TextStyle(color: Colors.grey),
                      ),
                      Text(
                        CurrencyFormatter.format(cart.subtotalAmount, context),
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppText.vat(context),
                        style: TextStyle(color: Colors.grey),
                      ),
                      Text(
                        CurrencyFormatter.format(cart.estimatedTax, context),
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  Divider(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppText.totalOrderValue(context),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        CurrencyFormatter.format(cart.totalAmount, context),
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                          color: AppTheme.darkSlate,
                        ),
                      ),
                    ],
                  ),
                  if (hasIndentItems) ...[
                    SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          AppText.dueNowDeposit(context),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFD97706),
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          CurrencyFormatter.format(requiredDeposit, context),
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFD97706),
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            SizedBox(height: 30),

            // Submit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: AppTheme.primarySky,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: _isSubmitting
                    ? null
                    : () async {
                        final navigator = Navigator.of(context);
                        final messenger = ScaffoldMessenger.of(context);
                        setState(() => _isSubmitting = true);
                        try {
                          final api = ref.read(apiClientProvider);
                          final order = await api.processCheckout(
                            customerName: _nameCtrl.text.trim(),
                            customerEmail: ref.read(authProvider).value?.email,
                            customerPhone: _phoneCtrl.text.trim(),
                            fulfillmentMethod: _fulfillmentMethod,
                            fulfillmentPreference: _fulfillmentPreference,
                            paymentMethod: _selectedPaymentMethod,
                            address: _fulfillmentMethod == 'DELIVERY'
                                ? _addressCtrl.text.trim()
                                : null,
                            branchId: _fulfillmentMethod == 'PICKUP'
                                ? _selectedBranch
                                : null,
                          );

                          // Invalidate cart
                          await ref.read(cartProvider.notifier).loadCart();

                          if (!mounted) return;
                          navigator.pushReplacement(
                            MaterialPageRoute(
                              builder: (_) => OrderSuccessScreen(order: order),
                            ),
                          );
                        } catch (e) {
                          if (!context.mounted) return;
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(
                                AppText.unableToCreateOrder(
                                  context,
                                  localError(context, e),
                                ),
                              ),
                            ),
                          );
                        } finally {
                          if (mounted) setState(() => _isSubmitting = false);
                        }
                      },
                child: _isSubmitting
                    ? SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        AppText.placeOrderPay(context),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
              ),
            ),
            SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.primarySky),
        SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            color: AppTheme.darkSlate,
          ),
        ),
      ],
    );
  }

  Widget _buildChoiceCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primarySky : AppTheme.cardBorder,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              icon,
              color: isSelected ? AppTheme.primarySky : Colors.grey,
              size: 22,
            ),
            SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: isSelected ? AppTheme.primarySky : AppTheme.darkSlate,
              ),
            ),
            SizedBox(height: 4),
            Text(subtitle, style: TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
