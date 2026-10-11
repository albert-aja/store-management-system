import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Mock attendance history
  final List<Map<String, dynamic>> _attendanceLogs = [
    {
      'date': '2026-10-09',
      'checkIn': '08:15 AM',
      'checkOut': '05:05 PM',
      'status': 'PRESENT',
      'notes': 'Regular shift',
    },
    {
      'date': '2026-10-08',
      'checkIn': '08:42 AM',
      'checkOut': '05:00 PM',
      'status': 'LATE',
      'notes': 'Traffic jam on main bridge',
    },
    {
      'date': '2026-10-07',
      'checkIn': '08:05 AM',
      'checkOut': '05:10 PM',
      'status': 'PRESENT',
      'notes': 'Regular shift',
    },
    {
      'date': '2026-10-06',
      'checkIn': '-',
      'checkOut': '-',
      'status': 'ON_LEAVE',
      'notes': 'Approved annual leave',
    },
  ];

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

  void _submitLeave() {
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a reason for the leave request')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Leave request submitted to Store Manager for approval'),
        backgroundColor: AppColors.secondary,
      ),
    );
    _reasonController.clear();
    _tabController.animateTo(0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance & Leaves'),
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
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Attendance Log
          ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: _attendanceLogs.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final log = _attendanceLogs[index];
              final status = log['status'] as String;
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
                              log['date'] as String,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'In: ${log['checkIn']}  •  Out: ${log['checkOut']}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            if ((log['notes'] as String).isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                log['notes'] as String,
                                style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic),
                              ),
                            ],
                          ],
                        ),
                      ),
                      Chip(
                        label: Text(status),
                        labelStyle: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: _getStatusColor(status),
                        ),
                        backgroundColor: _getStatusColor(status).withValues(alpha: 0.12),
                        side: BorderSide.none,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // Tab 2: Apply Leave Request
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Request Time Off',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Approved leave counts toward eligible attendance in payroll calculation.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 20),

                    // Leave Type Dropdown
                    DropdownButtonFormField<String>(
                      initialValue: _leaveType,
                      decoration: const InputDecoration(labelText: 'Leave Category'),
                      items: const [
                        DropdownMenuItem(value: 'ANNUAL', child: Text('Annual Leave (Paid)')),
                        DropdownMenuItem(value: 'SICK', child: Text('Sick Leave')),
                        DropdownMenuItem(value: 'UNPAID', child: Text('Unpaid Leave')),
                        DropdownMenuItem(value: 'EMERGENCY', child: Text('Emergency Family Leave')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _leaveType = val);
                      },
                    ),
                    const SizedBox(height: 16),

                    // Date Selectors
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
                              if (picked != null) setState(() => _leaveStart = picked);
                            },
                            child: InputDecorator(
                              decoration: const InputDecoration(labelText: 'Start Date'),
                              child: Text(DateFormat('dd MMM yyyy').format(_leaveStart)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: InkWell(
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: _leaveEnd,
                                firstDate: _leaveStart,
                                lastDate: DateTime.now().add(const Duration(days: 90)),
                              );
                              if (picked != null) setState(() => _leaveEnd = picked);
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

                    // Reason Field
                    TextField(
                      controller: _reasonController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Reason / Explanation',
                        hintText: 'Provide details for managerial review',
                      ),
                    ),
                    const SizedBox(height: 24),

                    ElevatedButton(
                      onPressed: _submitLeave,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text(
                        'Submit Leave Request',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
