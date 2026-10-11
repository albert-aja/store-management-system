import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';

class MyWorkScreen extends StatefulWidget {
  const MyWorkScreen({super.key});

  @override
  State<MyWorkScreen> createState() => _MyWorkScreenState();
}

class _MyWorkScreenState extends State<MyWorkScreen> {
  String _selectedFilter = 'ALL';

  final List<Map<String, dynamic>> _tasks = [
    {
      'id': 'task-01',
      'title': 'Credit Survey: Bambang Pamungkas',
      'type': 'SURVEY',
      'ref': 'SO/JKT/10/2026/0014',
      'priority': 'HIGH',
      'status': 'PENDING',
      'route': '/survey/survey-101',
    },
    {
      'id': 'task-02',
      'title': 'Delivery Trip #TRIP-082 (3 Destinations Remaining)',
      'type': 'DELIVERY',
      'ref': 'TRIP-082',
      'priority': 'MEDIUM',
      'status': 'IN_PROGRESS',
      'route': '/delivery/trip-082',
    },
    {
      'id': 'task-03',
      'title': 'Field Collection Visit: Hendra Wijaya',
      'type': 'COLLECTION',
      'ref': 'REC/JKT/10/2026/0088',
      'priority': 'HIGH',
      'status': 'PENDING',
      'route': '/collection/visit-201',
    },
    {
      'id': 'task-04',
      'title': 'Helper Loading: Warehouse Truck Prep for Trip #082',
      'type': 'HELPER',
      'ref': 'WH-TASK-09',
      'priority': 'LOW',
      'status': 'COMPLETED',
      'route': null,
    },
  ];

  Color _getPriorityColor(String p) {
    switch (p) {
      case 'HIGH':
        return AppColors.error;
      case 'MEDIUM':
        return AppColors.accent;
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _tasks.where((t) {
      if (_selectedFilter == 'ALL') return true;
      return t['status'] == _selectedFilter;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Work & Tasks'),
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _buildFilterChip('ALL', 'All Tasks (${_tasks.length})'),
                const SizedBox(width: 8),
                _buildFilterChip('PENDING', 'Pending'),
                const SizedBox(width: 8),
                _buildFilterChip('IN_PROGRESS', 'In Progress'),
                const SizedBox(width: 8),
                _buildFilterChip('COMPLETED', 'Completed'),
              ],
            ),
          ),

          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: filtered.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final task = filtered[index];
                return Card(
                  child: InkWell(
                    onTap: () {
                      final route = task['route'] as String?;
                      if (route != null) {
                        context.push(route);
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Task already completed')),
                        );
                      }
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              _getTaskIcon(task['type'] as String),
                              color: AppColors.primary,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: _getPriorityColor(task['priority'] as String).withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        task['priority'] as String,
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w700,
                                          color: _getPriorityColor(task['priority'] as String),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      task['ref'] as String,
                                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  task['title'] as String,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Status: ${task['status']}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: task['status'] == 'COMPLETED'
                                        ? AppColors.secondary
                                        : AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  IconData _getTaskIcon(String type) {
    switch (type) {
      case 'SURVEY':
        return Icons.assignment_outlined;
      case 'DELIVERY':
        return Icons.local_shipping_outlined;
      case 'COLLECTION':
        return Icons.payments_outlined;
      case 'HELPER':
        return Icons.handyman_outlined;
      default:
        return Icons.task_alt_rounded;
    }
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _selectedFilter == key;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        color: isSelected ? Colors.white : AppColors.textPrimary,
      ),
      selectedColor: AppColors.primary,
      backgroundColor: Colors.white,
      side: BorderSide(color: isSelected ? AppColors.primary : AppColors.cardBorder),
      onSelected: (_) => setState(() => _selectedFilter = key),
    );
  }
}
