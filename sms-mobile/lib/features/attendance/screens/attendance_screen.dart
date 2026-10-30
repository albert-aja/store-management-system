import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/attendance_provider.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> with SingleTickerProviderStateMixin {
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a reason for the leave request')),
      );
      return;
    }

    final success = await ref.read(attendanceProvider.notifier).submitLeave(
          leaveType: _leaveType,
          startDate: _leaveStart,
          endDate: _leaveEnd,
          reason: _reasonController.text.trim(),
        );

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Leave request submitted to Store Manager for approval'),
            backgroundColor: AppColors.secondary,
          ),
        );
        _reasonController.clear();
        _tabController.animateTo(0);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to submit leave request'),
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
        title: const Text('Attendance & Leaves'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () => ref.read(attendanceProvider.notifier).refresh(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          indicatorColor: AppColors.secondary,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Attendance Log'),
            Tab(text: 'Apply Leave'),
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
                  onRefresh: () => ref.read(attendanceProvider.notifier).refresh(),
                  child: state.logs.isEmpty
                      ? const Center(child: Text('No attendance logs found.'))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: state.logs.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
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
                                        color: _getStatusColor(status).withValues(alpha: 0.15),
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
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            log.workDate,
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'In: ${log.checkInTime ?? '-'}  •  Out: ${log.checkOutTime ?? '-'}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textSecondary,
                                            ),
                                          ),
                                          if (log.notes != null && log.notes!.isNotEmpty) ...[
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
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(status).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        status,
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
                              const Text(
                                'Leave Request Form',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 16),
                              DropdownButtonFormField<String>(
                                initialValue: _leaveType,
                                decoration: const InputDecoration(labelText: 'Leave Category'),
                                items: const [
                                  DropdownMenuItem(value: 'ANNUAL', child: Text('Annual Leave (Paid)')),
                                  DropdownMenuItem(value: 'SICK', child: Text('Sick Leave (Surat Dokter)')),
                                  DropdownMenuItem(value: 'UNPAID', child: Text('Unpaid Leave / Izin')),
                                  DropdownMenuItem(value: 'MATERNITY', child: Text('Maternity / Paternity')),
                                  DropdownMenuItem(value: 'OTHER', child: Text('Special / Compassionate')),
                                ],
                                onChanged: (val) {
                                  if (val != null) setState(() => _leaveType = val);
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
                                          lastDate: DateTime.now().add(const Duration(days: 90)),
                                        );
                                        if (picked != null) {
                                          setState(() {
                                            _leaveStart = picked;
                                            if (_leaveEnd.isBefore(_leaveStart)) {
                                              _leaveEnd = _leaveStart;
                                            }
                                          });
                                        }
                                      },
                                      child: InputDecorator(
                                        decoration: const InputDecoration(labelText: 'Start Date'),
                                        child: Text(DateFormat('dd MMM yyyy').format(_leaveStart)),
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
                                          lastDate: DateTime.now().add(const Duration(days: 90)),
                                        );
                                        if (picked != null) {
                                          setState(() => _leaveEnd = picked);
                                        }
                                      },
                                      child: InputDecorator(
                                        decoration: const InputDecoration(labelText: 'End Date'),
                                        child: Text(DateFormat('dd MMM yyyy').format(_leaveEnd)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              TextField(
                                controller: _reasonController,
                                maxLines: 3,
                                decoration: const InputDecoration(
                                  labelText: 'Reason & Justification',
                                  hintText: 'Describe necessity and handover coverage...',
                                ),
                              ),
                              const SizedBox(height: 24),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _submitLeave,
                                  icon: const Icon(Icons.send_rounded),
                                  label: const Text('Submit Request for Approval'),
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
