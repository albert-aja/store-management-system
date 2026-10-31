import 'package:flutter/material.dart';
import '../../../core/localization/worker_locale.dart';
import '../../../core/localization/worker_format.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/hardware/geo_location_service.dart';
import '../../../core/offline/offline_sync_queue.dart';
import '../../../core/security/biometric_service.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../collection/providers/collection_provider.dart';
import '../../delivery/providers/delivery_provider.dart';
import '../../surveys/providers/survey_provider.dart';

class WorkerHomeScreen extends ConsumerStatefulWidget {
  const WorkerHomeScreen({super.key});

  @override
  ConsumerState<WorkerHomeScreen> createState() => _WorkerHomeScreenState();
}

class _WorkerHomeScreenState extends ConsumerState<WorkerHomeScreen> {
  Future<void> _toggleClockIn(bool isClockedIn) async {
    final attNotifier = ref.read(attendanceProvider.notifier);

    if (isClockedIn) {
      final success = await attNotifier.clockOut();
      if (mounted && success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message228),
            backgroundColor: AppColors.secondary,
          ),
        );
      }
    } else {
      // 1. Verify GPS location & Store Geofence
      final location = await GeoLocationService.getCurrentLocation(
        simulateAtStore: true,
      );
      final isInsideGeofence = GeoLocationService.verifyStoreGeofence(
        workerLocation: location,
      );

      if (!isInsideGeofence) {
        if (!mounted) return;
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text(context.l10n.message229),
            content: Text(context.l10n.message230((location).toString())),
            actions: [
              const WorkerLanguageSwitcher(),
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(context.l10n.message231),
              ),
            ],
          ),
        );
        return;
      }

      // 2. Clock-in with verified GPS tag
      final success = await attNotifier.clockIn(
        notes:
            'GPS Verified: [${location.latitude}, ${location.longitude}] (Accuracy: ${location.accuracyMeters}m)',
      );

      // 3. Queue offline sync backup
      ref
          .read(offlineSyncProvider.notifier)
          .enqueueAction(
            actionType: 'CLOCK_IN',
            endpoint: '/api/v1/payroll/attendance/clock-in',
            payload: {
              'workDate': DateFormat('yyyy-MM-dd').format(DateTime.now()),
              'status': 'PRESENT',
              'latitude': location.latitude,
              'longitude': location.longitude,
            },
          );

      if (mounted && success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message233),
            backgroundColor: AppColors.secondary,
          ),
        );
      }
    }
  }

  void _triggerBiometricPrompt() async {
    final authenticated = await BiometricService.authenticate();
    if (mounted && authenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.message234),
          backgroundColor: AppColors.secondary,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final attState = ref.watch(attendanceProvider);
    final isClockedIn = attState.isClockedIn;
    final todayRec = attState.todayRecord;

    final surveyCount = ref.watch(surveyListProvider).mySurveys.length;
    final deliveryOrders = ref.watch(deliveryProvider).orders;
    final pendingDeliveries = deliveryOrders
        .where((d) => d.status != 'DELIVERED')
        .length;
    final activeTripNumber =
        ref.watch(deliveryProvider).activeTrip?.tripNumber ?? 'TRIP-082';

    final collectionTasks = ref.watch(collectionProvider).tasks;
    final heldCash = ref.watch(collectionProvider).totalHeldCash;

    final offlineState = ref.watch(offlineSyncProvider);

    final todayStr = context.wibDate(
      DateTime.now(),
      pattern: 'EEEE, dd MMMM yyyy',
    );

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              user?.fullName ?? context.l10n.message235,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            Text(
              '${user?.employeeNumber ?? ''} • ${user?.storeName ?? 'Pusat Jaya Store'}',
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            tooltip: context.l10n.message236,
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.fingerprint_rounded),
            tooltip: context.l10n.message237,
            onPressed: _triggerBiometricPrompt,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: context.l10n.message238,
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            ref.read(attendanceProvider.notifier).refresh(),
            ref.read(surveyListProvider.notifier).loadMySurveys(),
            ref.read(deliveryProvider.notifier).loadDriverTrips(),
            ref.read(collectionProvider.notifier).loadCollectionData(),
            ref.read(offlineSyncProvider.notifier).syncAll(),
          ]);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Offline Sync Status Banner (Active whenever offline items exist)
              if (offlineState.hasPending) ...[
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.accent, width: 1.2),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.cloud_upload_outlined,
                        color: AppColors.accent,
                        size: 22,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.l10n.message239(
                                (offlineState.pendingCount).toString(),
                              ),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              context.l10n.message240,
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          visualDensity: VisualDensity.compact,
                        ),
                        onPressed: offlineState.isSyncing
                            ? null
                            : () => ref
                                  .read(offlineSyncProvider.notifier)
                                  .syncAll(),
                        child: offlineState.isSyncing
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                context.l10n.message241,
                                style: TextStyle(fontSize: 11),
                              ),
                      ),
                    ],
                  ),
                ),
              ],

              // Role Badge & Welcome banner
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    todayStr,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  Wrap(
                    spacing: 4,
                    children: (user?.roles ?? ['WORKER']).map((role) {
                      return Chip(
                        label: Text(context.uiCode(role)),
                        labelStyle: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                        backgroundColor: AppColors.primary.withValues(
                          alpha: 0.1,
                        ),
                        side: BorderSide.none,
                        padding: EdgeInsets.zero,
                        visualDensity: VisualDensity.compact,
                      );
                    }).toList(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Attendance Card with GPS Geofencing verification
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isClockedIn
                              ? AppColors.secondary.withValues(alpha: 0.15)
                              : AppColors.accent.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isClockedIn
                              ? Icons.check_circle_rounded
                              : Icons.access_time_rounded,
                          color: isClockedIn
                              ? AppColors.secondary
                              : AppColors.accent,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isClockedIn
                                  ? context.l10n.message242
                                  : context.l10n.message243,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isClockedIn
                                  ? context.l10n.message244(
                                      todayRec?.checkInTime == null
                                          ? context.l10n.morning
                                          : context.timeValue(
                                              todayRec!.checkInTime,
                                            ),
                                    )
                                  : context.l10n.message245,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => _toggleClockIn(isClockedIn),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isClockedIn
                              ? AppColors.error
                              : AppColors.secondary,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                        ),
                        child: Text(
                          isClockedIn
                              ? context.l10n.message246
                              : context.l10n.message247,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Operational Work Queues (Role-specific)
              Text(
                context.l10n.message248,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),

              // Show cards matching worker roles
              if (user?.isSurveyor ?? true) ...[
                _buildWorkCard(
                  icon: Icons.assignment_outlined,
                  color: Colors.indigo,
                  title: context.l10n.message249,
                  subtitle: context.l10n.message250((surveyCount).toString()),
                  badgeText: context.l10n.message251((surveyCount).toString()),
                  badgeColor: AppColors.accent,
                  onTap: () => context.push('/survey/survey-101'),
                ),
                const SizedBox(height: 10),
              ],

              if (user?.isDriver ?? true) ...[
                _buildWorkCard(
                  icon: Icons.local_shipping_outlined,
                  color: Colors.blue,
                  title: context.l10n.message252,
                  subtitle: context.l10n.message253(
                    (activeTripNumber).toString(),
                    (pendingDeliveries).toString(),
                  ),
                  badgeText: 'DISPATCHED',
                  badgeColor: AppColors.secondary,
                  onTap: () => context.push('/delivery/trip-082'),
                ),
                const SizedBox(height: 10),
              ],

              if (user?.isCollector ?? true) ...[
                _buildWorkCard(
                  icon: Icons.payments_outlined,
                  color: Colors.teal,
                  title: context.l10n.message254,
                  subtitle: context.l10n.message255(
                    context.number(collectionTasks.length),
                    context.number(heldCash.toInt()),
                  ),
                  badgeText: context.l10n.message256(
                    (collectionTasks.length).toString(),
                  ),
                  badgeColor: AppColors.error,
                  onTap: () => context.push('/collection/visit-201'),
                ),
                const SizedBox(height: 10),
              ],

              if (user?.isSalesperson ?? false) ...[
                _buildWorkCard(
                  icon: Icons.point_of_sale_rounded,
                  color: Colors.purple,
                  title: context.l10n.message257,
                  subtitle: context.l10n.message258,
                  badgeText: 'ACTIVE',
                  badgeColor: AppColors.primaryLight,
                  onTap: () => context.push('/sales-work-center'),
                ),
                const SizedBox(height: 10),
              ],

              if (user?.isHelper ?? false) ...[
                _buildWorkCard(
                  icon: Icons.handyman_outlined,
                  color: Colors.orange,
                  title: context.l10n.message259,
                  subtitle: context.l10n.message260,
                  badgeText: 'ASSIGNED',
                  badgeColor: Colors.orange,
                  onTap: () => context.push('/my-work'),
                ),
                const SizedBox(height: 10),
              ],

              const SizedBox(height: 14),

              // Personal Portal & Self-Service Section
              Text(
                context.l10n.message261,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),

              Row(
                children: [
                  Expanded(
                    child: _buildShortcutTile(
                      icon: Icons.calendar_today_rounded,
                      title: context.l10n.message43,
                      subtitle: context.l10n.message262,
                      onTap: () => context.push('/attendance'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildShortcutTile(
                      icon: Icons.receipt_long_rounded,
                      title: context.l10n.message263,
                      subtitle: context.l10n.message264,
                      onTap: () => context.push('/payroll'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _buildShortcutTile(
                      icon: Icons.menu_book_rounded,
                      title: context.l10n.message265,
                      subtitle: context.l10n.message266,
                      onTap: () => context.push('/bulletin'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildShortcutTile(
                      icon: Icons.checklist_rtl_rounded,
                      title: context.l10n.message267,
                      subtitle: context.l10n.message268,
                      onTap: () => context.push('/my-work'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _buildShortcutTile(
                      icon: Icons.inventory_2_outlined,
                      title: context.l10n.message269,
                      subtitle: context.l10n.message270,
                      onTap: () => context.push('/stocktake'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildShortcutTile(
                      icon: Icons.qr_code_scanner_rounded,
                      title: context.l10n.message271,
                      subtitle: context.l10n.message272,
                      onTap: () => context.push('/warehouse-picking'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWorkCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String badgeText,
    required Color badgeColor,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: badgeColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            badgeText,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: badgeColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildShortcutTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: AppColors.primary, size: 26),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
