import '../core/app_text.dart';
import '../core/localized_errors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../core/currency_formatter.dart';
import '../models/order_model.dart';
import '../providers/catalog_provider.dart';
import 'pickup_pass_screen.dart';
import '../widgets/delivery_reschedule_panel.dart';

class OrderTrackingScreen extends ConsumerStatefulWidget {
  final String? initialOrderNumber;

  const OrderTrackingScreen({super.key, this.initialOrderNumber});

  @override
  ConsumerState<OrderTrackingScreen> createState() =>
      _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends ConsumerState<OrderTrackingScreen> {
  late final TextEditingController _orderNumCtrl;
  OrderDetail? _order;
  bool _isLoading = false;
  Object? _trackingError;
  String? _notFoundNumber;

  @override
  void initState() {
    super.initState();
    _orderNumCtrl = TextEditingController(
      text: widget.initialOrderNumber ?? '',
    );
    if (widget.initialOrderNumber != null &&
        widget.initialOrderNumber!.isNotEmpty) {
      _searchOrder(widget.initialOrderNumber!);
    }
  }

  @override
  void dispose() {
    _orderNumCtrl.dispose();
    super.dispose();
  }

  Future<void> _searchOrder(String num) async {
    if (num.trim().isEmpty) return;
    setState(() {
      _isLoading = true;
      _trackingError = null;
      _notFoundNumber = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final found = await api.findOrder(num.trim());
      if (!mounted) return;
      setState(() {
        _order = found;
        if (found == null) {
          _notFoundNumber = num;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _trackingError = e;
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final errorMsg = _notFoundNumber != null
        ? AppText.orderWasNotFoundInThe(context, _notFoundNumber)
        : _trackingError == null
        ? null
        : AppText.unableToTrackOrder(
            context,
            localError(context, _trackingError!),
          );
    return Scaffold(
      appBar: AppBar(
        title: Text(
          AppText.trackOrder(context),
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Input Box
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppText.salesOrderSoNumber(context),
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _orderNumCtrl,
                          textCapitalization: TextCapitalization.characters,
                          decoration: InputDecoration(
                            hintText: AppText.exampleSoApp(context),
                            prefixIcon: Icon(Icons.receipt_outlined, size: 20),
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(vertical: 12),
                            filled: true,
                            fillColor: Color(0xFFF1F5F9),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primarySky,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: _isLoading
                            ? null
                            : () => _searchOrder(_orderNumCtrl.text),
                        child: _isLoading
                            ? SizedBox(
                                height: 16,
                                width: 16,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                AppText.track(context),
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            SizedBox(height: 16),

            if (errorMsg != null) ...[
              Container(
                padding: EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Color(0xFFFECACA)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        errorMsg,
                        style: TextStyle(
                          color: Color(0xFF991B1B),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            if (_order != null) ...[
              // Order Summary Header
              Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _order!.orderNumber,
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                            color: AppTheme.primarySky,
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: _order!.depositPaid
                                ? Color(0xFFDCFCE7)
                                : Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _order!.depositPaid
                                ? AppText.paidDepositReceived(context)
                                : AppText.awaitingPayment(context),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: _order!.depositPaid
                                  ? Color(0xFF166534)
                                  : Color(0xFF92400E),
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      AppText.recipient(
                        context,
                        _order!.customerName,
                        _order!.customerPhone,
                      ),
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    SizedBox(height: 4),
                    Text(
                      AppText.totalValue(
                        context,
                        CurrencyFormatter.format(_order!.totalAmount, context),
                      ),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      AppText.fulfillmentPreference131(
                        context,
                        businessLabel(context, _order!.fulfillmentPreference),
                      ),
                      style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
                    ),
                  ],
                ),
              ),

              SizedBox(height: 16),

              // Visual Step Tracker
              DeliveryReschedulePanel(
                key: ValueKey(_order!.orderId),
                orderId: _order!.orderId,
              ),
              SizedBox(height: 16),
              Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppText.fulfillmentProgress(context),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 16),
                    _buildStepRow(
                      stepNum: 1,
                      title: AppText.orderReceived(context),
                      desc: AppText.salesOrderRecordedInTheBackend(context),
                      isDone: true,
                    ),
                    _buildStepRow(
                      stepNum: 2,
                      title: AppText.paymentAuthorizationDepositFull(context),
                      desc: _order!.depositPaid
                          ? AppText.paymentVerifiedProcurementIsAuthorized(
                              context,
                            )
                          : AppText.awaitingCustomerPaymentDeposit(context),
                      isDone: _order!.depositPaid,
                    ),
                    _buildStepRow(
                      stepNum: 3,
                      title: AppText.stockPreparationPreorderProcurement(
                        context,
                      ),
                      desc: AppText.theWarehouseTeamPreparesInStock(context),
                      isDone: _order!.depositPaid,
                    ),
                    _buildStepRow(
                      stepNum: 4,
                      title: AppText.deliveryBranchPickup(context),
                      desc: AppText.deliveredByAnSmsMartDriver(context),
                      isDone: false,
                      isLast: true,
                    ),
                  ],
                ),
              ),

              SizedBox(height: 16),

              // Fulfillment Groups Detail
              Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppText.deliveryGroupDetailsFulfillmentGroups(context),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 12),
                    ..._order!.fulfillmentGroups.map((grp) {
                      return Container(
                        margin: EdgeInsets.only(bottom: 10),
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.cardBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  AppText.group143(
                                    context,
                                    grp.groupNumber,
                                    businessLabel(
                                      context,
                                      grp.fulfillmentMethod,
                                    ),
                                  ),
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                                Text(
                                  businessLabel(context, grp.status),
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primarySky,
                                  ),
                                ),
                              ],
                            ),
                            Divider(height: 12),
                            ...grp.items.map(
                              (i) => Padding(
                                padding: EdgeInsets.symmetric(vertical: 2),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${formatArgument(context, i.quantity)}x ${i.productName}',
                                      style: TextStyle(fontSize: 12),
                                    ),
                                    Text(
                                      i.isProcurementRequired
                                          ? AppText.preorder144(
                                              context,
                                              businessLabel(
                                                context,
                                                i.procurementStatus,
                                              ),
                                            )
                                          : AppText.inStock(context),
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: i.isProcurementRequired
                                            ? Colors.amber.shade900
                                            : Colors.green.shade800,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            if (grp.fulfillmentMethod == 'PICKUP') ...[
                              SizedBox(height: 8),
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => PickupPassScreen(
                                          orderNumber: _order!.orderNumber,
                                        ),
                                      ),
                                    );
                                  },
                                  icon: Icon(Icons.qr_code_2, size: 16),
                                  label: Text(
                                    AppText.openPickupTicketPickupPassQr(
                                      context,
                                    ),
                                    style: TextStyle(fontSize: 11),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppTheme.primarySky,
                                    side: BorderSide(
                                      color: AppTheme.primarySky,
                                    ),
                                    visualDensity: VisualDensity.compact,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStepRow({
    required int stepNum,
    required String title,
    required String desc,
    required bool isDone,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: isDone ? Color(0xFF10B981) : Color(0xFFE2E8F0),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: isDone
                    ? Icon(Icons.check, size: 16, color: Colors.white)
                    : Text(
                        formatArgument(context, stepNum),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                        ),
                      ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 36,
                color: isDone ? Color(0xFF10B981) : Color(0xFFE2E8F0),
              ),
          ],
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: isDone ? AppTheme.darkSlate : Colors.grey,
                ),
              ),
              SizedBox(height: 2),
              Text(
                desc,
                style: TextStyle(fontSize: 11, color: Colors.grey, height: 1.2),
              ),
              SizedBox(height: 12),
            ],
          ),
        ),
      ],
    );
  }
}
