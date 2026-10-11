import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class WorkerHomeScreen extends ConsumerStatefulWidget {
  const WorkerHomeScreen({super.key});

  @override
  ConsumerState<WorkerHomeScreen> createState() => _WorkerHomeScreenState();
}

class _WorkerHomeScreenState extends ConsumerState<WorkerHomeScreen> {
  bool _isClockedIn = false;
  DateTime? _clockInTime;

  void _toggleClockIn() {
    setState(() {
      if (_isClockedIn) {
        _isClockedIn = false;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Clocked out successfully for today'),
            backgroundColor: AppColors.secondary,
          ),
        );
      } else {
        _isClockedIn = true;
        _clockInTime = DateTime.now();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Clock-in recorded: PRESENT at store'),
            backgroundColor: AppColors.secondary,
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final todayStr = DateFormat('EEEE, dd MMMM yyyy').format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              user?.fullName ?? 'Worker App',
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
            tooltip: 'Notifications',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('No unread operational notifications')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Sign Out',
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
          await Future.delayed(const Duration(milliseconds: 500));
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
                        label: Text(role),
                        labelStyle: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                        backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                        side: BorderSide.none,
                        padding: EdgeInsets.zero,
                        visualDensity: VisualDensity.compact,
                      );
                    }).toList(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Attendance Card (Quick clock in/out)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _isClockedIn
                              ? AppColors.secondary.withValues(alpha: 0.15)
                              : AppColors.accent.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _isClockedIn ? Icons.check_circle_rounded : Icons.access_time_rounded,
                          color: _isClockedIn ? AppColors.secondary : AppColors.accent,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isClockedIn ? 'Clocked In (Present)' : 'Daily Attendance',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _isClockedIn
                                  ? 'Started at ${DateFormat('hh:mm a').format(_clockInTime!)}'
                                  : 'Not yet recorded today',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: _toggleClockIn,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isClockedIn ? AppColors.error : AppColors.secondary,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        ),
                        child: Text(
                          _isClockedIn ? 'Clock Out' : 'Clock In',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Operational Work Queues (Role-specific)
              const Text(
                'My Active Work',
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
                  title: 'Credit Surveys Queue',
                  subtitle: '3 surveys awaiting field assessment & photo evidence',
                  badgeText: '3 PENDING',
                  badgeColor: AppColors.accent,
                  onTap: () => context.push('/survey/survey-101'),
                ),
                const SizedBox(height: 10),
              ],

              if (user?.isDriver ?? true) ...[
                _buildWorkCard(
                  icon: Icons.local_shipping_outlined,
                  color: Colors.blue,
                  title: 'Active Delivery Trip',
                  subtitle: 'Trip #TRIP-082 • 4 Destinations • COD custody Rp 3.2M',
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
                  title: 'Field Collection Visits',
                  subtitle: '5 overdue customer visits scheduled today',
                  badgeText: '5 DUE',
                  badgeColor: AppColors.error,
                  onTap: () => context.push('/collection/visit-201'),
                ),
                const SizedBox(height: 10),
              ],

              if (user?.isSalesperson ?? false) ...[
                _buildWorkCard(
                  icon: Icons.point_of_sale_rounded,
                  color: Colors.purple,
                  title: 'Sales & Customer Follow-Ups',
                  subtitle: '8 active leads • 2 orders pending price approval',
                  badgeText: '8 LEADS',
                  badgeColor: AppColors.primaryLight,
                  onTap: () => context.push('/my-work'),
                ),
                const SizedBox(height: 10),
              ],

              if (user?.isHelper ?? false) ...[
                _buildWorkCard(
                  icon: Icons.handyman_outlined,
                  color: Colors.orange,
                  title: 'Assigned Helper Tasks',
                  subtitle: 'Loading delivery trip #TRIP-082 • Showroom setup',
                  badgeText: '2 TASKS',
                  badgeColor: Colors.orange,
                  onTap: () => context.push('/my-work'),
                ),
                const SizedBox(height: 10),
              ],

              const SizedBox(height: 14),

              // Personal Portal & Self-Service Section
              const Text(
                'Personal Records & Company',
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
                      title: 'Attendance & Leaves',
                      subtitle: 'History & requests',
                      onTap: () => context.push('/attendance'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildShortcutTile(
                      icon: Icons.receipt_long_rounded,
                      title: 'My Payroll Slips',
                      subtitle: 'Salary & commissions',
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
                      title: 'Office Bulletin',
                      subtitle: 'Rules, SOPs & targets',
                      onTap: () => context.push('/bulletin'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildShortcutTile(
                      icon: Icons.checklist_rtl_rounded,
                      title: 'My Task Center',
                      subtitle: 'All assigned tasks',
                      onTap: () => context.push('/my-work'),
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
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
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
              const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
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
