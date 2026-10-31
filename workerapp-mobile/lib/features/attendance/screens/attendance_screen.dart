import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import '../../../core/localization/worker_format.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/attendance_provider.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Leave Form
  String _leaveType = 'ANNUAL';
  DateTime _leaveStart = DateTime.now().add(const Duration(days: 3));
  DateTime _leaveEnd = DateTime.now().add(const Duration(days: 4));
  final _reasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PRESENT':
        return AppColors.secondary;
      case 'LATE':
        return AppColors.accent;
      case 'ON_LEAVE':
        return Colors.blue;
      case 'HALF_DAY':
        return Colors.purple;
      case 'ABSENT':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  Future<void> _submitLeave() async {
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.l10n.message40)));
      return;
    }

    final success = await ref
        .read(attendanceProvider.notifier)
        .submitLeave(
          leaveType: _leaveType,
          startDate: _leaveStart,
          endDate: _leaveEnd,
          reason: _reasonController.text.trim(),
        );

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message41),
            backgroundColor: AppColors.secondary,
          ),
        );
        _reasonController.clear();
        _tabController.animateTo(0);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message42),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(attendanceProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.message43),
        actions: [
          const WorkerLanguageSwitcher(),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: context.l10n.message44,
            onPressed: () => ref.read(attendanceProvider.notifier).refresh(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          indicatorColor: AppColors.secondary,
          indicatorWeight: 3,
          tabs: [
            Tab(text: context.l10n.message45),
            Tab(text: context.l10n.message46),
          ],
        ),
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                // Tab 1: Attendance Log
                RefreshIndicator(
                  onRefresh: () =>
                      ref.read(attendanceProvider.notifier).refresh(),
                  child: state.logs.isEmpty
                      ? Center(child: Text(context.l10n.message47))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: state.logs.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final log = state.logs[index];
                            final status = log.status;
                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(
                                          status,
                                        ).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Icon(
                                        Icons.calendar_today_rounded,
                                        color: _getStatusColor(status),
                                        size: 20,
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            context.dateValue(log.workDate),
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            context.l10n.message48(
                                              context.timeValue(
                                                log.checkInTime,
                                              ),
                                              context.timeValue(
                                                log.checkOutTime,
                                              ),
                                            ),
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textSecondary,
                                            ),
                                          ),
                                          if (log.notes != null &&
                                              log.notes!.isNotEmpty) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              log.notes!,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontStyle: FontStyle.italic,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(
                                          status,
                                        ).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        context.uiCode(status),
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: _getStatusColor(status),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),

                // Tab 2: Apply Leave
                SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                context.l10n.message49,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 16),
                              DropdownButtonFormField<String>(
                                initialValue: _leaveType,
                                decoration: InputDecoration(
                                  labelText: context.l10n.message50,
                                ),
                                items: [
                                  DropdownMenuItem(
                                    value: 'ANNUAL',
                                    child: Text(context.l10n.message51),
                                  ),
                                  DropdownMenuItem(
                                    value: 'SICK',
                                    child: Text(context.l10n.message52),
                                  ),
                                  DropdownMenuItem(
                                    value: 'UNPAID',
                                    child: Text(context.l10n.message53),
                                  ),
                                  DropdownMenuItem(
                                    value: 'MATERNITY',
                                    child: Text(context.l10n.message54),
                                  ),
                                  DropdownMenuItem(
                                    value: 'OTHER',
                                    child: Text(context.l10n.message55),
                                  ),
                                ],
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() => _leaveType = val);
                                  }
                                },
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: InkWell(
                                      onTap: () async {
                                        final picked = await showDatePicker(
                                          context: context,
                                          initialDate: _leaveStart,
                                          firstDate: DateTime.now(),
                                          lastDate: DateTime.now().add(
                                            const Duration(days: 90),
                                          ),
                                        );
                                        if (picked != null) {
                                          setState(() {
                                            _leaveStart = picked;
                                            if (_leaveEnd.isBefore(
                                              _leaveStart,
                                            )) {
                                              _leaveEnd = _leaveStart;
                                            }
                                          });
                                        }
                                      },
                                      child: InputDecorator(
                                        decoration: InputDecoration(
                                          labelText: context.l10n.message56,
                                        ),
                                        child: Text(context.date(_leaveStart)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: InkWell(
                                      onTap: () async {
                                        final picked = await showDatePicker(
                                          context: context,
                                          initialDate: _leaveEnd,
                                          firstDate: _leaveStart,
                                          lastDate: DateTime.now().add(
                                            const Duration(days: 90),
                                          ),
                                        );
                                        if (picked != null) {
                                          setState(() => _leaveEnd = picked);
                                        }
                                      },
                                      child: InputDecorator(
                                        decoration: InputDecoration(
                                          labelText: context.l10n.message57,
                                        ),
                                        child: Text(context.date(_leaveEnd)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              TextField(
                                controller: _reasonController,
                                maxLines: 3,
                                decoration: InputDecoration(
                                  labelText: context.l10n.message58,
                                  hintText: context.l10n.message59,
                                ),
                              ),
                              const SizedBox(height: 24),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _submitLeave,
                                  icon: const Icon(Icons.send_rounded),
                                  label: Text(context.l10n.message60),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
