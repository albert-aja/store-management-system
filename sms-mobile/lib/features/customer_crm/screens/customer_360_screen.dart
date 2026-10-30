import 'package:flutter/material.dart';
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
      locale: 'id_ID',
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
                      const Text(
                        'Catat Janji Bayar (PTP)',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Nominal Janji Bayar (Rp)',
                      prefixText: 'Rp ',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today, color: AppColors.primary),
                    title: const Text('Tanggal Janji Bayar'),
                    subtitle: Text(
                      DateFormat('EEEE, dd MMMM yyyy', 'id_ID').format(selectedDate),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    trailing: TextButton(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: selectedDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 90)),
                        );
                        if (picked != null) {
                          setModalState(() => selectedDate = picked);
                        }
                      },
                      child: const Text('Ubah'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: notesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Catatan / Alasan Nasabah',
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
                      label: const Text('Simpan Janji Bayar'),
                      onPressed: () async {
                        final amt = double.tryParse(
                                amountController.text.replaceAll('.', '')) ??
                            0.0;
                        if (amt <= 0) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Masukkan nominal janji bayar yang valid'),
                            ),
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
                            const SnackBar(
                              content: Text(
                                  'Janji bayar berhasil dicatat & masuk antrean sinkronisasi'),
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
    final subjectController =
        TextEditingController(text: 'Kunjungan Lapangan / Follow-up');
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
                      const Text(
                        'Log Interaksi / Kunjungan',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedChannel,
                    decoration: const InputDecoration(
                      labelText: 'Kanal Komunikasi',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(
                          value: 'IN_PERSON', child: Text('Kunjungan Langsung')),
                      DropdownMenuItem(
                          value: 'PHONE_CALL', child: Text('Panggilan Telepon')),
                      DropdownMenuItem(
                          value: 'WHATSAPP', child: Text('Chat WhatsApp')),
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
                    decoration: const InputDecoration(
                      labelText: 'Hasil Interaksi',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(
                          value: 'REACHED', child: Text('Terhubung / Ditemui')),
                      DropdownMenuItem(
                          value: 'PROMISED_PAYMENT',
                          child: Text('Menyepakati Janji Bayar')),
                      DropdownMenuItem(
                          value: 'NO_ANSWER',
                          child: Text('Tidak Ada Jawaban / Rumah Kosong')),
                      DropdownMenuItem(
                          value: 'REFUSED', child: Text('Menolak / Komplain')),
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
                    decoration: const InputDecoration(
                      labelText: 'Perihal',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Catatan Lengkap Pembicaraan',
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
                      label: const Text('Simpan Log Interaksi'),
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
                            const SnackBar(
                              content: Text('Interaksi CRM berhasil disimpan'),
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
        title: const Text('Customer 360 CRM'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Perbarui Data',
            onPressed: () => ref
                .read(customer360Provider.notifier)
                .loadCustomer(widget.customerId),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.customer == null
              ? const Center(child: Text('Data nasabah tidak ditemukan'))
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
                        backgroundColor:
                            _getSegmentColor(cust.segment).withValues(alpha: 0.2),
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
                              cust.fullName,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'NIK: ${cust.nik} • ${cust.phone}',
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
                                    cust.segment.replaceAll('_', ' '),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  backgroundColor:
                                      _getSegmentColor(cust.segment),
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
                                            cust.creditScoreGrade),
                                      ),
                                    ),
                                  ),
                                  label: Text(
                                    'Score ${cust.creditScorePoints}/100',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  backgroundColor: _getCreditGradeColor(
                                      cust.creditScoreGrade),
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
                      const Icon(Icons.location_on_outlined,
                          size: 16, color: AppColors.textSecondary),
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
                  label: 'Customer Lifetime Value',
                  value: _formatCurrency(cust.clvAmount),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  icon: Icons.account_balance_wallet_outlined,
                  color: Colors.teal,
                  label: 'Store Credit Balance',
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
                  label: 'Janji Bayar Aktif',
                  value: '${cust.pendingPtpCount} PTP',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildMetricTile(
                  icon: Icons.shopping_bag_outlined,
                  color: Colors.blue,
                  label: 'Total Pesanan Selesai',
                  value: '${cust.totalOrdersCount} Order',
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
                  label: const Text('Catat Janji Bayar'),
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
                  label: const Text('Log Interaksi'),
                  onPressed: () => _showRecordInteractionDialog(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Tags section
          if (cust.tags.isNotEmpty) ...[
            const Text(
              'Tag Demografis & Karakteristik',
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
                  label: Text(
                    tag,
                    style: const TextStyle(fontSize: 11),
                  ),
                  backgroundColor: AppColors.surface,
                  visualDensity: VisualDensity.compact,
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
          ],

          // Active PTP List
          const Text(
            'Daftar Janji Bayar (PTP)',
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
              child: const Center(
                child: Text(
                  'Belum ada janji bayar tercatat',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
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
                    'Jatuh Tempo: ${DateFormat('dd MMM yyyy').format(ptp.promisedDate)}\n${ptp.notes ?? 'Tanpa catatan'}',
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: Chip(
                    label: Text(
                      ptp.status,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                    visualDensity: VisualDensity.compact,
                  ),
                  isThreeLine: true,
                ),
              );
            }),

          const SizedBox(height: 20),

          // Recent Interactions Log
          const Text(
            'Riwayat Interaksi CRM Terakhir',
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
              child: const Center(
                child: Text(
                  'Belum ada log interaksi',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
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
                    inter.subject,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    'Hasil: ${inter.outcome}\n${inter.notes ?? ''}',
                    style: const TextStyle(fontSize: 11),
                  ),
                  trailing: Text(
                    inter.createdAt != null
                        ? DateFormat('dd/MM').format(inter.createdAt!)
                        : '',
                    style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
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
