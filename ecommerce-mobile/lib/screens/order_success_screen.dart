import '../core/app_text.dart';
import '../core/localized_errors.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../core/currency_formatter.dart';
import '../models/order_model.dart';
import '../providers/catalog_provider.dart';
import '../providers/notification_provider.dart';
import 'order_tracking_screen.dart';
import 'pickup_pass_screen.dart';

class OrderSuccessScreen extends ConsumerStatefulWidget {
  final OrderDetail order;

  const OrderSuccessScreen({super.key, required this.order});

  @override
  ConsumerState<OrderSuccessScreen> createState() => _OrderSuccessScreenState();
}

class _OrderSuccessScreenState extends ConsumerState<OrderSuccessScreen> {
  late OrderDetail _order;
  bool _isSimulating = false;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
  }

  Future<void> _handleSimulatePayment() async {
    setState(() => _isSimulating = true);
    try {
      final api = ref.read(apiClientProvider);
      final updated = await api.simulatePayment(_order.orderNumber);
      setState(() {
        _order = updated;
      });

      // Dispatch real-time milestone push notification
      await ref
          .read(notificationsProvider.notifier)
          .triggerMilestone(
            orderNumber: _order.orderNumber,
            milestoneType: 'DEPOSIT_CONFIRMED',
            metadata: {'amount': _order.requiredDepositAmount},
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppText.paymentVerifiedMilestoneNotificationSent(context),
            ),
            backgroundColor: Color(0xFF047857),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppText.simulationFailed(context, localError(context, e)),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSimulating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isQris = _order.paymentMethod == 'QRIS';
    final isVA = _order.paymentMethod == 'BANK_TRANSFER_VA';

    return Scaffold(
      appBar: AppBar(
        title: Text(AppText.paymentInstructions(context)),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            // Header Success
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: Column(
                children: [
                  Container(
                    padding: EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Color(0xFFDCFCE7),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check,
                      color: Color(0xFF16A34A),
                      size: 36,
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    AppText.orderPlacedSuccessfully(context),
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                  SizedBox(height: 4),
                  Text(
                    AppText.orderNo(context, _order.orderNumber),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primarySky,
                    ),
                  ),
                  SizedBox(height: 12),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _order.depositPaid
                          ? Color(0xFFDCFCE7)
                          : Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _order.depositPaid
                          ? AppText.paymentConfirmed(context)
                          : AppText.awaitingPayment(context),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: _order.depositPaid
                            ? Color(0xFF166534)
                            : Color(0xFF92400E),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 16),

            // Payment Instructions Card
            Container(
              padding: EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppText.amountDue(context),
                        style: TextStyle(color: Colors.grey),
                      ),
                      Text(
                        CurrencyFormatter.format(
                          _order.requiredDepositAmount,
                          context,
                        ),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.darkSlate,
                        ),
                      ),
                    ],
                  ),
                  if (_order.orderDiscountAmount > 0) ...[
                    SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            _order.orderDiscountLabel ??
                                AppText.volumeBundleDiscount(context),
                            style: TextStyle(
                              color: Color(0xFFBE123C),
                              fontSize: 12,
                            ),
                          ),
                        ),
                        Text(
                          '-${CurrencyFormatter.format(_order.orderDiscountAmount, context)}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFBE123C),
                          ),
                        ),
                      ],
                    ),
                  ],
                  Divider(height: 24),

                  if (isQris) ...[
                    Text(
                      AppText.scanTheNationalQrisCode(context),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      AppText.openBcaMobileGopayOvoShopeepay(context),
                      style: TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                    SizedBox(height: 16),
                    Container(
                      width: 180,
                      height: 180,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.grey.shade300,
                          width: 2,
                        ),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.qr_code_2,
                              size: 120,
                              color: AppTheme.darkSlate,
                            ),
                            Text(
                              _order.orderNumber,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else if (isVA) ...[
                    Text(
                      AppText.virtualAccountNumber(context),
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '8808 1234 5678 9012',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                            ),
                          ),
                          IconButton(
                            icon: Icon(
                              Icons.copy,
                              size: 18,
                              color: AppTheme.primarySky,
                            ),
                            onPressed: () {
                              Clipboard.setData(
                                ClipboardData(text: '8808123456789012'),
                              );
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    AppText.vaNumberCopied(context),
                                  ),
                                  duration: Duration(seconds: 1),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    Text(
                      AppText.method(
                        context,
                        businessLabel(context, _order.paymentMethod),
                      ),
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 4),
                    Text(
                      AppText.pleaseCompletePaymentUsingTheInstructions(
                        context,
                      ),
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],

                  SizedBox(height: 18),

                  // Simulation Button
                  if (!_order.depositPaid)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFF10B981),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: _isSimulating
                            ? null
                            : _handleSimulatePayment,
                        icon: Icon(Icons.check_circle_outline, size: 18),
                        label: _isSimulating
                            ? SizedBox(
                                height: 16,
                                width: 16,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                AppText.simulateFullPayment(context),
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                      ),
                    ),
                ],
              ),
            ),

            SizedBox(height: 16),

            // Dual-Axis Fulfillment Groups Breakdown
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
                        AppText.fulfillmentGroups(context),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _order.fulfillmentPreference == 'PARTIAL'
                              ? AppText.partialDelivery(context)
                              : AppText.completeDelivery(context),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primarySky,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 12),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    itemCount: _order.fulfillmentGroups.length,
                    separatorBuilder: (context, index) => SizedBox(height: 10),
                    itemBuilder: (context, idx) {
                      final group = _order.fulfillmentGroups[idx];
                      final isReady = group.status == 'READY_FOR_PACKING';
                      return Container(
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
                                  AppText.group(
                                    context,
                                    group.groupNumber,
                                    businessLabel(
                                      context,
                                      group.fulfillmentMethod,
                                    ),
                                  ),
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                                Container(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isReady
                                        ? Color(0xFFDCFCE7)
                                        : Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    isReady
                                        ? AppText.readyToProcess(context)
                                        : AppText.awaitingDepositPo(context),
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: isReady
                                          ? Color(0xFF166534)
                                          : Color(0xFF92400E),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 6),
                            ...group.items.map(
                              (item) => Text(
                                '• ${formatArgument(context, item.quantity)}x ${item.productName}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF475569),
                                ),
                              ),
                            ),
                            if (group.fulfillmentMethod == 'PICKUP') ...[
                              SizedBox(height: 8),
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => PickupPassScreen(
                                          orderNumber: widget.order.orderNumber,
                                        ),
                                      ),
                                    );
                                  },
                                  icon: Icon(Icons.qr_code_2, size: 16),
                                  label: Text(
                                    AppText.openPickupTicketQrPass(context),
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
                    },
                  ),
                ],
              ),
            ),

            SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () =>
                        Navigator.popUntil(context, (r) => r.isFirst),
                    child: Text(
                      AppText.backToStore(context),
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primarySky,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => OrderTrackingScreen(
                            initialOrderNumber: _order.orderNumber,
                          ),
                        ),
                      );
                    },
                    child: Text(
                      AppText.trackOrder(context),
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
