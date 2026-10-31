import '../core/app_text.dart';
import '../core/localized_errors.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/app_theme.dart';
import '../core/currency_formatter.dart';
import '../core/api_client.dart';
import '../models/pickup_model.dart';

class PickupPassScreen extends StatefulWidget {
  final String orderNumber;

  const PickupPassScreen({super.key, required this.orderNumber});

  @override
  State<PickupPassScreen> createState() => _PickupPassScreenState();
}

class _PickupPassScreenState extends State<PickupPassScreen> {
  PickupPass? _pass;
  bool _isLoading = true;
  Object? _error;

  final TextEditingController _rackCtrl = TextEditingController(
    text: 'Rak Display B-02 (Showroom Utama)',
  );
  final TextEditingController _staffCtrl = TextEditingController(
    text: 'Ahmad (Kasir Showroom)',
  );
  bool _isActionLoading = false;

  @override
  void initState() {
    super.initState();
    _loadPass();
  }

  @override
  void dispose() {
    _rackCtrl.dispose();
    _staffCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadPass() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final pass = await ApiClient().getPickupPass(widget.orderNumber);
      setState(() {
        _pass = pass;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e;
        _isLoading = false;
      });
    }
  }

  Future<void> _simulateStaging() async {
    setState(() => _isActionLoading = true);
    try {
      final updated = await ApiClient().stagePickup(
        orderNumber: widget.orderNumber,
        rackLocation: _rackCtrl.text.trim(),
        staffName: _staffCtrl.text.trim(),
      );
      setState(() {
        _pass = updated;
        _isActionLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppText.itemsStagedOnTheShowroomRack(context)),
            backgroundColor: Color(0xFF059669),
          ),
        );
      }
    } catch (e) {
      setState(() => _isActionLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppText.unableToStageItems(context, localError(context, e)),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _simulateHandover() async {
    if (_pass == null) return;
    setState(() => _isActionLoading = true);
    try {
      await ApiClient().verifyHandover(
        pickupPassCode: _pass!.pickupPassCode,
        staffName: _staffCtrl.text.trim(),
        recipientName: _pass!.recipientName,
      );
      setState(() {
        _pass = _pass!.copyWith(
          stagingStatus: 'COMPLETED',
          handedOverAt: DateTime.now(),
          handedOverByStaffName: _staffCtrl.text.trim(),
          remainingBalance: 0.0,
          fullyPaid: true,
        );
        _isActionLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppText.handoverVerifiedTheOrderIsNow(context)),
            backgroundColor: Color(0xFF059669),
          ),
        );
      }
    } catch (e) {
      setState(() => _isActionLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppText.unableToVerifyHandover(context, localError(context, e)),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final errorMsg = _error == null
        ? null
        : AppText.unableToLoadShowroomPickupTicket(
            context,
            localError(context, _error!),
          );
    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      appBar: AppBar(
        title: Text(
          AppText.showroomPickupTicket(context),
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadPass,
            tooltip: AppText.refresh(context),
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : errorMsg != null
          ? Center(
              child: Text(errorMsg, style: TextStyle(color: Colors.red)),
            )
          : _pass == null
          ? Center(child: Text(AppText.pickupTicketNotFound(context)))
          : SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildStagingStatusBanner(),
                  SizedBox(height: 16),
                  _buildQrPassCard(),
                  SizedBox(height: 16),
                  _buildShowroomInfoCard(),
                  SizedBox(height: 16),
                  _buildFinancialSummaryCard(),
                  SizedBox(height: 16),
                  _buildSimulationControlCard(),
                  SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildStagingStatusBanner() {
    final isCompleted = _pass!.stagingStatus == 'COMPLETED';
    final isReady = _pass!.stagingStatus == 'READY_FOR_PICKUP';

    final Color bgColor = isCompleted
        ? Color(0xFFF1F5F9)
        : isReady
        ? Color(0xFFECFDF5)
        : Color(0xFFFEF3C7);
    final Color textColor = isCompleted
        ? Color(0xFF475569)
        : isReady
        ? Color(0xFF065F46)
        : Color(0xFF92400E);
    final IconData icon = isCompleted
        ? Icons.verified
        : isReady
        ? Icons.check_circle
        : Icons.hourglass_top;

    return Container(
      padding: EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: textColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: textColor, size: 28),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isCompleted
                      ? AppText.orderPickupCompleted(context)
                      : isReady
                      ? AppText.readyForShowroomPickup(context)
                      : AppText.beingPreparedAtTheStore(context),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: textColor,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  isCompleted
                      ? AppText.handedOverBy(
                          context,
                          _pass!.handedOverByStaffName ??
                              (isEnglish(context)
                                  ? 'Store Staff'
                                  : 'Petugas Toko'),
                        )
                      : isReady
                      ? AppText.rackLocation(
                          context,
                          _pass!.stagingRackLocation,
                        )
                      : AppText.showroomStaffArePreparingYourItems(context),
                  style: TextStyle(
                    fontSize: 11,
                    color: textColor.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: textColor.withValues(alpha: 0.4)),
            ),
            child: Text(
              _pass!.stagingStatus,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 9,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQrPassCard() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            AppText.officialPickupTicket(context),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
              color: Colors.grey,
            ),
          ),
          SizedBox(height: 6),
          Text(
            _pass!.orderNumber,
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 16,
              color: AppTheme.primarySky,
            ),
          ),
          SizedBox(height: 16),

          // High Contrast QR Matrix Simulation Container
          Container(
            width: 180,
            height: 180,
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [_buildQrCorner(), _buildQrCorner()],
                ),
                Column(
                  children: [
                    Icon(Icons.qr_code_2, color: Colors.white, size: 48),
                    SizedBox(height: 4),
                    Text(
                      _pass!.pickupPassCode,
                      style: TextStyle(
                        color: Color(0xFF38BDF8),
                        fontSize: 9,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildQrCorner(),
                    Text(
                      'SMS-MART',
                      style: TextStyle(color: Colors.grey, fontSize: 8),
                    ),
                  ],
                ),
              ],
            ),
          ),
          SizedBox(height: 16),

          // Big Copyable Pass Code
          Container(
            padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _pass!.pickupPassCode,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                    letterSpacing: 1.5,
                    color: Color(0xFF0F172A),
                  ),
                ),
                SizedBox(width: 8),
                IconButton(
                  icon: Icon(Icons.copy, size: 16),
                  onPressed: () {
                    Clipboard.setData(
                      ClipboardData(text: _pass!.pickupPassCode),
                    );
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(AppText.pickupCodeCopied(context)),
                        duration: Duration(seconds: 1),
                      ),
                    );
                  },
                  tooltip: AppText.copyCode(context),
                  constraints: BoxConstraints(),
                  padding: EdgeInsets.zero,
                ),
              ],
            ),
          ),
          SizedBox(height: 8),
          Text(
            AppText.showThisQrCodeOrGive(context),
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildQrCorner() {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white, width: 2),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Center(child: Container(width: 8, height: 8, color: Colors.white)),
    );
  }

  Widget _buildShowroomInfoCard() {
    return Container(
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
            children: [
              Icon(Icons.storefront, color: AppTheme.primarySky, size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  _pass!.pickupStoreName,
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ],
          ),
          SizedBox(height: 6),
          Padding(
            padding: EdgeInsets.only(left: 28),
            child: Text(
              _pass!.pickupStoreAddress,
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ),
          Divider(height: 20),
          Row(
            children: [
              Icon(Icons.access_time, color: Colors.grey, size: 16),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  _pass!.operatingHours == 'Senin - Minggu: 09:00 - 21:00 WIB'
                      ? (isEnglish(context)
                            ? 'Monday - Sunday: 09:00 - 21:00 WIB'
                            : _pass!.operatingHours)
                      : _pass!.operatingHours,
                  style: TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ),
            ],
          ),
          SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.phone, color: Colors.grey, size: 16),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  AppText.phone(context, _pass!.contactPhone),
                  style: TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFinancialSummaryCard() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.cardBorder),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppText.totalOrderValue(context),
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              Text(
                CurrencyFormatter.format(_pass!.totalAmount, context),
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppText.depositPaid(context),
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              Text(
                _pass!.depositPaid
                    ? CurrencyFormatter.format(
                        _pass!.requiredDepositAmount,
                        context,
                      )
                    : 'Rp 0',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF059669),
                ),
              ),
            ],
          ),
          Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppText.balanceDueAtCheckout(context),
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
              ),
              Text(
                _pass!.remainingBalance > 0
                    ? CurrencyFormatter.format(_pass!.remainingBalance, context)
                    : AppText.paidInFullRp(context),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: _pass!.remainingBalance > 0
                      ? Color(0xFFD97706)
                      : Color(0xFF059669),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSimulationControlCard() {
    final isCompleted = _pass!.stagingStatus == 'COMPLETED';
    final isReady = _pass!.stagingStatus == 'READY_FOR_PICKUP';

    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color(0xFFF0F9FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFBAE6FD)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome, color: AppTheme.primarySky, size: 16),
              SizedBox(width: 6),
              Text(
                AppText.storeStaffOperationsSimulationDemo(context),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  color: Color(0xFF0369A1),
                ),
              ),
            ],
          ),
          SizedBox(height: 10),

          if (!isReady && !isCompleted) ...[
            TextField(
              controller: _rackCtrl,
              decoration: InputDecoration(
                labelText: AppText.showroomStagingRackLocation(context),
                labelStyle: TextStyle(fontSize: 11),
                filled: true,
                fillColor: Colors.white,
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
              style: TextStyle(fontSize: 12),
            ),
            SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isActionLoading ? null : _simulateStaging,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primarySky,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  _isActionLoading
                      ? AppText.processing(context)
                      : AppText.markReadyForPickupStagingComplete(context),
                ),
              ),
            ),
          ],

          if (isReady && !isCompleted) ...[
            TextField(
              controller: _staffCtrl,
              decoration: InputDecoration(
                labelText: AppText.cashierHandoverStaffName(context),
                labelStyle: TextStyle(fontSize: 11),
                filled: true,
                fillColor: Colors.white,
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
              style: TextStyle(fontSize: 12),
            ),
            SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isActionLoading ? null : _simulateHandover,
                icon: Icon(Icons.assignment_turned_in, size: 16),
                label: Text(
                  _isActionLoading
                      ? AppText.processing(context)
                      : AppText.verifyHandoverComplete(context),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF059669),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],

          if (isCompleted) ...[
            Row(
              children: [
                Icon(Icons.check_circle, color: Color(0xFF059669), size: 16),
                SizedBox(width: 6),
                Expanded(
                  child: Text(
                    AppText.itemsHaveBeenHandedOverTo(context),
                    style: TextStyle(fontSize: 11, color: Color(0xFF065F46)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
