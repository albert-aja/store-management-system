import 'package:sms_mobile/core/localization/worker_format.dart';
import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_colors.dart';
import 'fleet_tracking_service.dart';

class ActiveTrackingBanner extends ConsumerWidget {
  const ActiveTrackingBanner({super.key});

  void _showPauseDialog(BuildContext context, WidgetRef ref) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.message1),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              context.l10n.message2,
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              decoration: InputDecoration(
                labelText: context.l10n.message3,
                hintText: context.l10n.message4,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(context.l10n.message5),
          ),
          ElevatedButton(
            onPressed: () {
              final reason = reasonController.text.trim();
              if (reason.isNotEmpty) {
                ref.read(fleetTrackingProvider.notifier).pauseManual(reason);
                Navigator.pop(ctx);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
            child: Text(context.l10n.message6),
          ),
        ],
      ),
    );
  }

  Widget _buildProximityCard(
    BuildContext context,
    WidgetRef ref,
    GeofenceProximityAlert alert,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFF10B981), width: 1.2),
      ),
      child: Row(
        children: [
          const Icon(Icons.near_me, size: 22, color: Color(0xFF059669)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      context.l10n.message7,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF065F46),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        context.l10n.message8(
                          (context.number(
                            alert.distanceMeters,
                            decimals: 0,
                          )).toString(),
                        ),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '${alert.title} • ${alert.address}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF047857),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => ref
                .read(fleetTrackingProvider.notifier)
                .dismissProximityAlert(),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              minimumSize: const Size(40, 24),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              context.l10n.message9,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: Color(0xFF059669),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tracking = ref.watch(fleetTrackingProvider);

    if (tracking.sessionState == TrackingSessionState.notStarted) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        color: Colors.grey.shade100,
        child: Row(
          children: [
            Icon(
              Icons.location_off_outlined,
              size: 18,
              color: Colors.grey.shade600,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                context.l10n.message10,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (tracking.sessionState == TrackingSessionState.completed) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        color: AppColors.secondary.withValues(alpha: 0.12),
        child: Row(
          children: [
            Icon(
              Icons.check_circle_outline,
              size: 18,
              color: AppColors.secondary,
            ),
            SizedBox(width: 8),
            Text(
              context.l10n.message11,
              style: TextStyle(
                fontSize: 12,
                color: AppColors.secondary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      );
    }

    if (tracking.isThermalCutoffActive) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        color: const Color(0xFFFEF2F2),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (tracking.activeProximityAlert != null)
              _buildProximityCard(context, ref, tracking.activeProximityAlert!),
            Row(
              children: [
                const Icon(Icons.whatshot, size: 22, color: Color(0xFFDC2626)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        context.l10n.message12(
                          (context.number(
                            tracking.batteryTemperatureCelsius,
                            decimals: 1,
                          )).toString(),
                        ),
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFDC2626),
                        ),
                      ),
                      Text(
                        context.l10n.message13,
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.red.shade900,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            _buildNotificationBarSimulation(context, ref, tracking),
          ],
        ),
      );
    }

    if (tracking.sessionState == TrackingSessionState.pausedBreak) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        color: AppColors.accent.withValues(alpha: 0.15),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (tracking.activeProximityAlert != null)
              _buildProximityCard(context, ref, tracking.activeProximityAlert!),
            Row(
              children: [
                const Icon(
                  Icons.pause_circle_filled,
                  size: 22,
                  color: AppColors.accent,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        context.l10n.message14,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFB45309),
                        ),
                      ),
                      Text(
                        context.l10n.message15,
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.brown.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    if (tracking.sessionState == TrackingSessionState.pausedManual) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        color: Colors.amber.shade100,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (tracking.activeProximityAlert != null)
              _buildProximityCard(context, ref, tracking.activeProximityAlert!),
            Row(
              children: [
                Icon(
                  Icons.pause_circle_outline,
                  size: 20,
                  color: Colors.amber.shade900,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    context.l10n.message16(
                      tracking.pauseExplanation?.resolve(context.l10n) ??
                          tracking.pauseReason ??
                          context.l10n.trackingManual,
                    ),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.amber.shade900,
                    ),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => ref
                      .read(fleetTrackingProvider.notifier)
                      .quickNotificationResume(),
                  icon: const Icon(Icons.play_arrow, size: 14),
                  label: Text(
                    context.l10n.message17,
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade700,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    minimumSize: const Size(60, 28),
                  ),
                ),
              ],
            ),
            _buildNotificationBarSimulation(context, ref, tracking),
          ],
        ),
      );
    }

    // ACTIVE TRACKING
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      color: AppColors.secondary.withValues(alpha: 0.12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (tracking.activeProximityAlert != null)
            _buildProximityCard(context, ref, tracking.activeProximityAlert!),
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: AppColors.secondary,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            context.l10n.message18,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.secondary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            '• ${tracking.taskCode ?? context.l10n.taskLabel}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      tracking.isLowBatteryThrottled
                          ? context.l10n.message19(
                              (tracking.batteryLevelPct).toString(),
                              (context.number(
                                tracking.batteryTemperatureCelsius,
                                decimals: 0,
                              )).toString(),
                            )
                          : context.l10n.message20(
                              (context.number(
                                (tracking.lastSpeedKmh ?? 0),
                                decimals: 0,
                              )).toString(),
                              (context.number(
                                tracking.batteryTemperatureCelsius,
                                decimals: 0,
                              )).toString(),
                              (tracking.pointsRecordedCount).toString(),
                            ),
                      style: TextStyle(
                        fontSize: 11,
                        color: tracking.isLowBatteryThrottled
                            ? const Color(0xFFB45309)
                            : AppColors.textSecondary,
                        fontWeight: tracking.isLowBatteryThrottled
                            ? FontWeight.w600
                            : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () => ref
                    .read(fleetTrackingProvider.notifier)
                    .quickNotificationPause(),
                icon: const Icon(Icons.flash_on, size: 13),
                label: Text(
                  context.l10n.message21,
                  style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber.shade800,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  minimumSize: const Size(60, 28),
                ),
              ),
              const SizedBox(width: 6),
              OutlinedButton(
                onPressed: () => _showPauseDialog(context, ref),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  minimumSize: const Size(48, 28),
                  side: BorderSide(
                    color: AppColors.secondary.withValues(alpha: 0.5),
                  ),
                ),
                child: Text(
                  context.l10n.message22,
                  style: TextStyle(fontSize: 10.5, color: AppColors.secondary),
                ),
              ),
            ],
          ),
          _buildNotificationBarSimulation(context, ref, tracking),
        ],
      ),
    );
  }

  Widget _buildNotificationBarSimulation(
    BuildContext context,
    WidgetRef ref,
    FleetTrackingState tracking,
  ) {
    final actions = tracking.ongoingNotificationActions;
    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.notifications_active,
            size: 13,
            color: Colors.amberAccent,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              context.l10n.message23(
                tracking.isThermalCutoffActive
                    ? context.l10n.trackingThermal
                    : tracking.isBreakActive
                    ? context.l10n.trackingBreak
                    : tracking.sessionState == TrackingSessionState.pausedManual
                    ? context.l10n.trackingManual
                    : tracking.hasProximityAlert
                    ? context.l10n.message7
                    : context.l10n.trackingTitle,
              ),
              style: const TextStyle(
                fontSize: 10,
                color: Colors.white70,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 6),
          if (actions.contains('DISMISS_PROXIMITY_ALERT'))
            GestureDetector(
              onTap: () => ref
                  .read(fleetTrackingProvider.notifier)
                  .handleSystemNotificationAction('DISMISS_PROXIMITY_ALERT'),
              child: Container(
                margin: const EdgeInsets.only(right: 4),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF059669),
                  borderRadius: BorderRadius.circular(3),
                ),
                child: Text(
                  context.l10n.message24,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          if (actions.contains('QUICK_PAUSE'))
            GestureDetector(
              onTap: () => ref
                  .read(fleetTrackingProvider.notifier)
                  .handleSystemNotificationAction('QUICK_PAUSE'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.amber.shade900,
                  borderRadius: BorderRadius.circular(3),
                ),
                child: Text(
                  context.l10n.message25,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          if (actions.contains('QUICK_RESUME'))
            GestureDetector(
              onTap: () => ref
                  .read(fleetTrackingProvider.notifier)
                  .handleSystemNotificationAction('QUICK_RESUME'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green.shade700,
                  borderRadius: BorderRadius.circular(3),
                ),
                child: Text(
                  context.l10n.message26,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
