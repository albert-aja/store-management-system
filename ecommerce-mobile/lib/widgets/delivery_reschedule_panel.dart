import '../core/app_text.dart';
import '../core/localized_errors.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../models/delivery_schedule_model.dart';
import '../providers/auth_provider.dart';
import '../providers/catalog_provider.dart';
import '../screens/auth_screen.dart';

final deliverySchedulesProvider = FutureProvider.autoDispose
    .family<List<DeliverySchedule>, String>((ref, orderId) async {
      final customer = await ref.watch(authProvider.future);
      if (customer == null) {
        throw StateError('Masuk untuk mengatur pengiriman milik Anda.');
      }
      return ref.watch(apiClientProvider).getDeliverySchedules(orderId);
    });

String scheduleError(Object error, {BuildContext? context}) =>
    localError(context, error);

String windowLabel(String? window, {BuildContext? context}) => switch (window) {
  'MORNING' => '09:00–12:00 WIB',
  'AFTERNOON' => '12:00–17:00 WIB',
  _ => AppText.timeNotSet(context),
};

class DeliveryReschedulePanel extends ConsumerWidget {
  const DeliveryReschedulePanel({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppText.rescheduleDelivery(context),
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(AppText.submitAtLeastHoursBeforePlanned(context)),
            SizedBox(height: 12),
            auth.when(
              loading: () => Text(AppText.checkingAccount(context)),
              error: (error, _) => Text(scheduleError(error, context: context)),
              data: (customer) => customer == null
                  ? TextButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute<void>(builder: (_) => AuthScreen()),
                      ),
                      child: Text(
                        AppText.signInToManageYourDeliveries232(context),
                      ),
                    )
                  : ref
                        .watch(deliverySchedulesProvider(orderId))
                        .when(
                          loading: () =>
                              Text(AppText.loadingSchedules(context)),
                          error: (error, _) => Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                scheduleError(error, context: context),
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                              TextButton(
                                onPressed: () => ref.invalidate(
                                  deliverySchedulesProvider(orderId),
                                ),
                                child: Text(AppText.tryAgain(context)),
                              ),
                            ],
                          ),
                          data: (stops) => Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (stops.isEmpty)
                                Text(
                                  AppText.noDeliveriesHaveBeenScheduledBy(
                                    context,
                                  ),
                                ),
                              for (final stop in stops)
                                _ScheduleRequest(
                                  key: ValueKey(
                                    '${customer.customerId}:${stop.deliveryOrderId}',
                                  ),
                                  stop: stop,
                                  orderId: orderId,
                                ),
                            ],
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScheduleRequest extends ConsumerStatefulWidget {
  const _ScheduleRequest({
    super.key,
    required this.stop,
    required this.orderId,
  });
  final DeliverySchedule stop;
  final String orderId;

  @override
  ConsumerState<_ScheduleRequest> createState() => _ScheduleRequestState();
}

class _ScheduleRequestState extends ConsumerState<_ScheduleRequest> {
  final _reason = TextEditingController();
  DateTime? _date;
  String _window = 'MORNING';
  bool _busy = false;
  Object? _error;

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_date == null || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(apiClientProvider)
          .requestDeliveryReschedule(
            widget.stop.deliveryOrderId,
            requestedDate: DateFormat('yyyy-MM-dd').format(_date!),
            requestedWindow: _window,
            reason: _reason.text.trim().isEmpty ? null : _reason.text.trim(),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppText.requestSentTheScheduleRemainsUnchanged(context),
          ),
        ),
      );
      ref.invalidate(deliverySchedulesProvider(widget.orderId));
    } on DioException catch (error) {
      if (mounted) setState(() => _error = error);
    } on FormatException catch (error) {
      if (mounted) setState(() => _error = error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final stop = widget.stop;
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            stop.deliveryOrderNumber,
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          Text(
            '${isEnglish(context) ? 'Schedule' : 'Jadwal'}: ${stop.deliveryDate == null ? (isEnglish(context) ? 'Not set' : 'Belum ditentukan') : _displayDate(context, stop.deliveryDate!)} · ${windowLabel(stop.deliveryWindow, context: context)}',
          ),
          if (stop.plannedDispatchAt != null)
            Text(
              '${isEnglish(context) ? 'Planned dispatch' : 'Rencana berangkat'}: ${DateFormat.yMMMd(localeName(context)).add_Hm().format(DateTime.parse(stop.plannedDispatchAt!).toUtc().add(const Duration(hours: 7)))} WIB',
            ),
          for (final request in stop.requests)
            Text(
              '${_displayDate(context, request.requestedDate)} · ${windowLabel(request.requestedWindow, context: context)}: '
              '${businessLabel(context, request.status, approval: true)}${request.decisionNotes == null ? '' : ' — ${request.decisionNotes}'}',
            ),
          if (!stop.eligible)
            Text(
              stop.unavailableReason == null
                  ? AppText.reschedulingIsUnavailable(context)
                  : localError(context, stop.unavailableReason!),
            ),
          if (_error != null)
            Text(
              scheduleError(_error!, context: context),
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          if (stop.eligible) ...[
            SizedBox(height: 8),
            OutlinedButton(
              onPressed: _busy
                  ? null
                  : () async {
                      final jakartaNow = DateTime.now().toUtc().add(
                        Duration(hours: 7),
                      );
                      final tomorrow = DateTime(
                        jakartaNow.year,
                        jakartaNow.month,
                        jakartaNow.day + 1,
                      );
                      final selected = await showDatePicker(
                        context: context,
                        initialDate: _date ?? tomorrow,
                        firstDate: tomorrow,
                        lastDate: DateTime(9999, 12, 31),
                      );
                      if (mounted && selected != null) {
                        setState(() => _date = selected);
                      }
                    },
              child: Text(
                _date == null
                    ? AppText.chooseANewDeliveryDate(context)
                    : DateFormat.yMMMd(localeName(context)).format(_date!),
              ),
            ),
            DropdownButtonFormField<String>(
              isExpanded: true,
              initialValue: _window,
              decoration: InputDecoration(
                labelText: AppText.deliveryWindowWib(context),
              ),
              items: [
                DropdownMenuItem(
                  value: 'MORNING',
                  child: Text(AppText.morning(context)),
                ),
                DropdownMenuItem(
                  value: 'AFTERNOON',
                  child: Text(AppText.afternoon(context)),
                ),
              ],
              onChanged: _busy
                  ? null
                  : (value) {
                      if (value != null) setState(() => _window = value);
                    },
            ),
            TextField(
              controller: _reason,
              maxLength: 300,
              decoration: InputDecoration(
                labelText: AppText.reasonOptional(context),
              ),
            ),
            SizedBox(height: 8),
            FilledButton(
              onPressed: _busy || _date == null ? null : _submit,
              child: Text(
                _busy
                    ? AppText.sending(context)
                    : AppText.requestReschedule(context),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _displayDate(BuildContext context, String value) {
    final date = DateTime.tryParse(value);
    return date == null
        ? value
        : DateFormat.yMMMd(localeName(context)).format(date);
  }
}
