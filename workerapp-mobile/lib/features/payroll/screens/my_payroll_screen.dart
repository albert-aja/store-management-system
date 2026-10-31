import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/payroll_provider.dart';
import '../../../core/localization/worker_format.dart';

class MyPayrollScreen extends ConsumerWidget {
  const MyPayrollScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payrollState = ref.watch(payrollProvider);
    final slip = payrollState.latestSlip;

    String formatRp(double amount) {
      return context.rupiah(amount.toInt());
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.message335),
        actions: [
          const WorkerLanguageSwitcher(),
          IconButton(
            tooltip: context.l10n.message44,
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(payrollProvider.notifier).loadMySlips(),
          ),
        ],
      ),
      body: payrollState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : slip == null
          ? Center(child: Text(context.l10n.message336))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Period Selector Banner
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                slip.payrollPeriodId,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.secondary.withValues(
                                    alpha: 0.15,
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  context.uiCode(slip.status),
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.secondary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            slip.periodName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            context.l10n.message337(
                              context.dateValue(slip.cutoffDate),
                              context.dateValue(slip.payoutDate),
                            ),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Net Payout Highlight Card
                  Card(
                    color: AppColors.primary,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Text(
                            context.l10n.message338,
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            formatRp(slip.netSalary),
                            style: const TextStyle(
                              color: AppColors.accent,
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            context.l10n.message339,
                            style: TextStyle(
                              color: Colors.white60,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Earnings Breakdown Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            context.l10n.message340,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 14),
                          _buildLineItem(
                            context.l10n.message341,
                            formatRp(slip.baseSalary),
                          ),
                          const SizedBox(height: 10),
                          _buildLineItem(
                            context.l10n.message342,
                            formatRp(slip.salesCommission),
                            isHighlight: true,
                          ),
                          const SizedBox(height: 10),
                          _buildLineItem(
                            context.l10n.message343,
                            formatRp(slip.collectionIncentive),
                            isHighlight: true,
                          ),
                          const SizedBox(height: 10),
                          _buildLineItem(
                            context.l10n.message344,
                            formatRp(slip.otherAllowances),
                          ),
                          const Divider(height: 24),
                          _buildLineItem(
                            context.l10n.message345,
                            formatRp(
                              slip.baseSalary +
                                  slip.salesCommission +
                                  slip.collectionIncentive +
                                  slip.otherAllowances,
                            ),
                            isBold: true,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Deductions Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            context.l10n.message346,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 14),
                          _buildLineItem(
                            context.l10n.message347,
                            '- ${formatRp(slip.attendanceDeductions)}',
                            isNegative: true,
                          ),
                          const Divider(height: 24),
                          _buildLineItem(
                            context.l10n.message348,
                            '- ${formatRp(slip.attendanceDeductions)}',
                            isNegative: true,
                            isBold: true,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }

  Widget _buildLineItem(
    String label,
    String value, {
    bool isHighlight = false,
    bool isNegative = false,
    bool isBold = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
            color: AppColors.textPrimary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: (isBold || isHighlight)
                ? FontWeight.w700
                : FontWeight.w600,
            color: isNegative
                ? AppColors.error
                : isHighlight
                ? AppColors.secondary
                : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
