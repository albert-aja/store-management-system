import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import '../../../core/localization/worker_format.dart';
import '../../../core/localization/worker_message.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../models/customer_crm_model.dart';
import '../providers/customer_crm_provider.dart';

class Customer360Screen extends ConsumerStatefulWidget {
  final String customerId;

  const Customer360Screen({super.key, required this.customerId});

  @override
  ConsumerState<Customer360Screen> createState() => _Customer360ScreenState();
}

class _Customer360ScreenState extends ConsumerState<Customer360Screen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(customer360Provider.notifier).loadCustomer(widget.customerId);
    });
  }

  String _formatCurrency(double amount) {
    final formatter = NumberFormat.currency(
      locale: context.languageTag,
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    return formatter.format(amount);
  }

  Color _getSegmentColor(String segment) {
    switch (segment.toUpperCase()) {
      case 'VIP_CASH':
        return Colors.purple;
      case 'STAR_CREDIT':
        return Colors.green;
      case 'HIGH_DELINQUENCY_RISK':
        return Colors.red;
      default:
        return AppColors.primary;
    }
  }

  Color _getCreditGradeColor(String grade) {
    switch (grade.toUpperCase()) {
      case 'A':
        return Colors.green;
      case 'B':
        return Colors.blue;
      case 'C':
        return Colors.orange;
      case 'D':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _showRecordPtpDialog(BuildContext context) {
    final amountController = TextEditingController();
    final notesController = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 3));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        context.l10n.message121,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      IconButton(
                        tooltip: MaterialLocalizations.of(
                          context,
                        ).closeButtonTooltip,
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: context.l10n.message122,
                      prefixText: 'Rp ',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(
                      Icons.calendar_today,
                      color: AppColors.primary,
                    ),
                    title: Text(context.l10n.message123),
                    subtitle: Text(
                      context.date(selectedDate, pattern: 'EEEE, dd MMMM yyyy'),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    trailing: TextButton(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: selectedDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(
                            const Duration(days: 90),
                          ),
                        );
                        if (picked != null) {
                          setModalState(() => selectedDate = picked);
                        }
                      },
                      child: Text(context.l10n.message124),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: notesController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      labelText: context.l10n.message125,
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.check_circle_outline),
                      label: Text(context.l10n.message126),
                      onPressed: () async {
                        final amt =
                            double.tryParse(
                              amountController.text.replaceAll('.', ''),
                            ) ??
                            0.0;
                        if (amt <= 0) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(context.l10n.message127)),
                          );
                          return;
                        }

                        Navigator.pop(ctx);
                        await ref
                            .read(customer360Provider.notifier)
                            .recordPromiseToPay(
                              customerId: widget.customerId,
                              promisedAmount: amt,
                              promisedDate: selectedDate,
                              notes: notesController.text,
                            );

                        if (mounted) {
                          ScaffoldMessenger.of(this.context).showSnackBar(
                            SnackBar(
                              content: WorkerErrorText(
                                WorkerMessage((l10n) => l10n.message128),
                              ),
                              backgroundColor: Colors.green,
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showRecordInteractionDialog(BuildContext context) {
    String selectedChannel = 'IN_PERSON';
    String selectedOutcome = 'REACHED';
    final subjectController = TextEditingController(
      text: context.l10n.message129,
    );
    final notesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        context.l10n.message130,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      IconButton(
                        tooltip: MaterialLocalizations.of(
                          context,
                        ).closeButtonTooltip,
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedChannel,
                    decoration: InputDecoration(
                      labelText: context.l10n.message131,
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      DropdownMenuItem(
                        value: 'IN_PERSON',
                        child: Text(context.l10n.message132),
                      ),
                      DropdownMenuItem(
                        value: 'PHONE_CALL',
                        child: Text(context.l10n.message133),
                      ),
                      DropdownMenuItem(
                        value: 'WHATSAPP',
                        child: Text(context.l10n.message134),
                      ),
                      DropdownMenuItem(value: 'SMS', child: Text('SMS')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setModalState(() => selectedChannel = val);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedOutcome,
                    decoration: InputDecoration(
                      labelText: context.l10n.message135,
                      border: OutlineInputBorder(),
                    ),
                    items: [
                      DropdownMenuItem(
                        value: 'REACHED',
                        child: Text(context.l10n.message136),
                      ),
                      DropdownMenuItem(
                        value: 'PROMISED_PAYMENT',
                        child: Text(context.l10n.message137),
                      ),
                      DropdownMenuItem(
                        value: 'NO_ANSWER',
                        child: Text(context.l10n.message138),
                      ),
                      DropdownMenuItem(
                        value: 'REFUSED',
                        child: Text(context.l10n.message139),
                      ),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setModalState(() => selectedOutcome = val);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: subjectController,
                    decoration: InputDecoration(
                      labelText: context.l10n.message140,
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      labelText: context.l10n.message141,
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        foregroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.save_outlined),
                      label: Text(context.l10n.message142),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await ref
                            .read(customer360Provider.notifier)
                            .recordInteraction(
                              customerId: widget.customerId,
                              channel: selectedChannel,
                              direction: 'OUTBOUND',
                              subject: subjectController.text,
                              outcome: selectedOutcome,
                              notes: notesController.text,
                            );

                        if (mounted) {
                          ScaffoldMessenger.of(this.context).showSnackBar(
                            SnackBar(
                              content: WorkerErrorText(
                                WorkerMessage((l10n) => l10n.message143),
                              ),
                              backgroundColor: Colors.green,
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(customer360Provider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.message144),
        actions: [
          const WorkerLanguageSwitcher(),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: context.l10n.message145,
            onPressed: () => ref
                .read(customer360Provider.notifier)
                .loadCustomer(widget.customerId),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.customer == null
          ? Center(child: Text(context.l10n.message146))
          : _buildContent(context, state.customer!),
    );
  }

  Widget _buildContent(BuildContext context, Customer360SummaryModel cust) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Profile Card
          Card(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: _getSegmentColor(
                          cust.segment,
                        ).withValues(alpha: 0.2),
                        child: Text(
                          cust.fullName.isNotEmpty
                              ? cust.fullName.substring(0, 1).toUpperCase()
                              : 'C',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: _getSegmentColor(cust.segment),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              cust.fullName.isEmpty
                                  ? context.l10n.message403
                                  : cust.fullName,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              context.l10n.message147(
                                (cust.nik).toString(),
                                (cust.phone).toString(),
                              ),
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 6,
                              children: [
                                Chip(
                                  label: Text(
                                    context.uiCode(cust.segment),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  backgroundColor: _getSegmentColor(
                                    cust.segment,
                                  ),
                                  visualDensity: VisualDensity.compact,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                                Chip(
                                  avatar: CircleAvatar(
                                    backgroundColor: Colors.white,
                                    child: Text(
                                      cust.creditScoreGrade,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: _getCreditGradeColor(
                                          cust.creditScoreGrade,
                                        ),
                                      ),
                                    ),
                                  ),
                                  label: Text(
                                    context.l10n.message148(
                                      (cust.creditScorePoints).toString(),
                                    ),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  backgroundColor: _getCreditGradeColor(
                                    cust.creditScoreGrade,
                                  ),
                                  visualDensity: VisualDensity.compact,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          cust.address,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // KPI Stats Grid
          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  icon: Icons.monetization_on_outlined,
                  color: Colors.purple,
                  label: context.l10n.message149,
                  value: _formatCurrency(cust.clvAmount),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  icon: Icons.account_balance_wallet_outlined,
                  color: Colors.teal,
                  label: context.l10n.message150,
                  value: _formatCurrency(cust.storeCreditBalance),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  icon: Icons.schedule_outlined,
                  color: Colors.orange,
                  label: context.l10n.message151,
                  value: context.l10n.message152(
                    (cust.pendingPtpCount).toString(),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  icon: Icons.shopping_bag_outlined,
                  color: Colors.blue,
                  label: context.l10n.message153,
                  value: context.l10n.message154(
                    (cust.totalOrdersCount).toString(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Quick Action Bar
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.event_note, size: 18),
                  label: Text(context.l10n.message155),
                  onPressed: () => _showRecordPtpDialog(context),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  icon: const Icon(Icons.chat_bubble_outline, size: 18),
                  label: Text(context.l10n.message156),
                  onPressed: () => _showRecordInteractionDialog(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Tags section
          if (cust.tags.isNotEmpty) ...[
            Text(
              context.l10n.message157,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: cust.tags.map((tag) {
                return Chip(
                  label: Text(tag, style: const TextStyle(fontSize: 11)),
                  backgroundColor: AppColors.surface,
                  visualDensity: VisualDensity.compact,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
          ],

          // Active PTP List
          Text(
            context.l10n.message158,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          if (cust.activePtps.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  context.l10n.message159,
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ),
            )
          else
            ...cust.activePtps.map((ptp) {
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: ptp.status == 'KEPT'
                        ? Colors.green.withValues(alpha: 0.2)
                        : ptp.status == 'BROKEN'
                        ? Colors.red.withValues(alpha: 0.2)
                        : Colors.orange.withValues(alpha: 0.2),
                    child: Icon(
                      ptp.status == 'KEPT'
                          ? Icons.check
                          : ptp.status == 'BROKEN'
                          ? Icons.close
                          : Icons.access_time,
                      color: ptp.status == 'KEPT'
                          ? Colors.green
                          : ptp.status == 'BROKEN'
                          ? Colors.red
                          : Colors.orange,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    _formatCurrency(ptp.promisedAmount),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    context.l10n.message160(
                      context.date(ptp.promisedDate),
                      (ptp.notes ?? context.l10n.noNotes).toString(),
                    ),
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: Chip(
                    label: Text(
                      context.uiCode(ptp.status),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    visualDensity: VisualDensity.compact,
                  ),
                  isThreeLine: true,
                ),
              );
            }),

          const SizedBox(height: 20),

          // Recent Interactions Log
          Text(
            context.l10n.message161,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          if (cust.recentInteractions.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  context.l10n.message162,
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ),
            )
          else
            ...cust.recentInteractions.map((inter) {
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: Icon(
                      inter.channel == 'IN_PERSON'
                          ? Icons.person_pin_circle
                          : inter.channel == 'WHATSAPP'
                          ? Icons.chat
                          : Icons.phone,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    inter.subject.isEmpty
                        ? context.l10n.message129
                        : inter.subject,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  subtitle: Text(
                    context.l10n.message163(
                      context.uiCode(inter.outcome),
                      (inter.notes ?? '').toString(),
                    ),
                    style: const TextStyle(fontSize: 11),
                  ),
                  trailing: Text(
                    inter.createdAt != null
                        ? context.wibDate(inter.createdAt!, pattern: 'dd/MM')
                        : '',
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  isThreeLine: true,
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildMetricTile({
    required IconData icon,
    required Color color,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textSecondary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
