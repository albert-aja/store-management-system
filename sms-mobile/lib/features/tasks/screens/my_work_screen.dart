import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../collection/providers/collection_provider.dart';
import '../../delivery/providers/delivery_provider.dart';
import '../../surveys/providers/survey_provider.dart';

class MyWorkScreen extends ConsumerStatefulWidget {
  const MyWorkScreen({super.key});

  @override
  ConsumerState<MyWorkScreen> createState() => _MyWorkScreenState();
}

class _MyWorkScreenState extends ConsumerState<MyWorkScreen> {
  String _selectedFilter = 'ALL';

  Color _getPriorityColor(String p) {
    switch (p) {
      case 'HIGH':
        return AppColors.error;
      case 'MEDIUM':
        return AppColors.accent;
      default:
        return AppColors.secondary;
    }
  }

  Color _getStatusColor(String s) {
    switch (s) {
      case 'COMPLETED':
      case 'DELIVERED':
        return AppColors.secondary;
      case 'IN_PROGRESS':
      case 'DISPATCHED':
        return AppColors.accent;
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final surveys = ref.watch(surveyListProvider).mySurveys;
    final deliveryOrders = ref.watch(deliveryProvider).orders;
    final collectionTasks = ref.watch(collectionProvider).tasks;

    final List<Map<String, dynamic>> allTasks = [];

    // Add Surveys
    for (var s in surveys) {
      allTasks.add({
        'id': s.id,
        'title': 'Credit Survey: Customer #${s.salesOrderId.substring(0, 8)}',
        'type': 'SURVEY',
        'ref': 'SO-${s.salesOrderId.substring(0, 8)}',
        'priority': 'HIGH',
        'status': s.status,
        'route': '/survey/${s.id}',
      });
    }

    // Add Delivery Stops
    for (var d in deliveryOrders) {
      allTasks.add({
        'id': d.id,
        'title': 'Delivery: ${d.recipientName} (${d.itemName ?? 'Goods'})',
        'type': 'DELIVERY',
        'ref': d.deliveryOrderNumber,
        'priority': d.codAmount > 0 ? 'HIGH' : 'MEDIUM',
        'status': d.status,
        'route': '/delivery/${d.tripId ?? 'active-trip'}',
      });
    }

    // Add Collection Visits
    for (var c in collectionTasks) {
      allTasks.add({
        'id': c.id,
        'title': 'Field Collection: ${c.customerName}',
        'type': 'COLLECTION',
        'ref': c.receivableNumber,
        'priority': c.daysOverdue > 10 ? 'HIGH' : 'MEDIUM',
        'status': 'PENDING',
        'route': '/collection/${c.id}',
      });
    }

    // Fallback if empty
    if (allTasks.isEmpty) {
      allTasks.add({
        'id': 'task-default',
        'title': 'Warehouse Truck Prep & Helper Inspection',
        'type': 'HELPER',
        'ref': 'WH-TASK-01',
        'priority': 'LOW',
        'status': 'COMPLETED',
        'route': null,
      });
    }

    final filteredTasks = _selectedFilter == 'ALL'
        ? allTasks
        : allTasks.where((t) => t['type'] == _selectedFilter).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Work & Task Queue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () {
              ref.read(surveyListProvider.notifier).loadMySurveys();
              ref.read(deliveryProvider.notifier).loadDriverTrips();
              ref.read(collectionProvider.notifier).loadCollectionData();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _buildFilterChip('ALL', 'All Tasks'),
                const SizedBox(width: 8),
                _buildFilterChip('DELIVERY', 'Deliveries'),
                const SizedBox(width: 8),
                _buildFilterChip('SURVEY', 'Surveys'),
                const SizedBox(width: 8),
                _buildFilterChip('COLLECTION', 'Collections'),
                const SizedBox(width: 8),
                _buildFilterChip('HELPER', 'Helper / Floor'),
              ],
            ),
          ),

          // Tasks List
          Expanded(
            child: filteredTasks.isEmpty
                ? const Center(child: Text('No operational tasks for this filter.'))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: filteredTasks.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final task = filteredTasks[index];
                      final pColor = _getPriorityColor(task['priority'] as String);
                      final sColor = _getStatusColor(task['status'] as String);

                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: task['route'] != null
                              ? () => context.push(task['route'] as String)
                              : null,
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              children: [
                                // Priority indicator strip
                                Container(
                                  width: 4,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: pColor,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppColors.primary.withValues(alpha: 0.1),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              task['type'] as String,
                                              style: const TextStyle(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w700,
                                                color: AppColors.primary,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            task['ref'] as String,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: AppColors.textSecondary,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        task['title'] as String,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: sColor.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        task['status'] as String,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: sColor,
                                        ),
                                      ),
                                    ),
                                    if (task['route'] != null) ...[
                                      const SizedBox(height: 6),
                                      const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textSecondary),
                                    ],
                                  ],
                                ),
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

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedFilter == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) setState(() => _selectedFilter = value);
      },
      selectedColor: AppColors.primary,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: isSelected ? Colors.white : AppColors.textPrimary,
      ),
    );
  }
}
