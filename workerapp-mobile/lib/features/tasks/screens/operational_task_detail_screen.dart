import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../models/operational_task_model.dart';
import '../services/operational_task_service.dart';

class OperationalTaskDetailScreen extends ConsumerStatefulWidget {
  final String taskId;

  const OperationalTaskDetailScreen({super.key, required this.taskId});

  @override
  ConsumerState<OperationalTaskDetailScreen> createState() =>
      _OperationalTaskDetailScreenState();
}

class _OperationalTaskDetailScreenState
    extends ConsumerState<OperationalTaskDetailScreen> {
  OperationalTaskModel? _task;
  bool _loading = true;
  final TextEditingController _commentController = TextEditingController();
  final TextEditingController _completionNotesController =
      TextEditingController();
  bool _submittingComment = false;

  @override
  void initState() {
    super.initState();
    _loadTask();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _completionNotesController.dispose();
    super.dispose();
  }

  Future<void> _loadTask() async {
    setState(() => _loading = true);
    final service = ref.read(operationalTaskServiceProvider);
    final task = await service.getTaskDetail(widget.taskId);
    if (mounted) {
      setState(() {
        _task = task;
        _loading = false;
      });
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return AppColors.error;
      case 'MEDIUM':
        return Colors.orange;
      default:
        return AppColors.secondary;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return AppColors.secondary;
      case 'IN_PROGRESS':
        return AppColors.primary;
      case 'PENDING':
        return Colors.orange;
      default:
        return AppColors.textSecondary;
    }
  }

  String _formatCategory(String cat) {
    switch (cat) {
      case 'SHOWROOM_DISPLAY':
        return 'Display Showroom';
      case 'STOCK_AUDIT':
        return 'Audit Stok';
      case 'CUSTOMER_SERVICE':
        return 'Layanan Pelanggan';
      case 'DOCUMENTATION':
        return 'Dokumentasi';
      case 'MAINTENANCE':
        return 'Pemeliharaan';
      default:
        return 'Tugas Umum';
    }
  }

  Future<void> _handleUpdateStatus(String newStatus, {String? notes}) async {
    final service = ref.read(operationalTaskServiceProvider);
    try {
      final updated = await service.updateStatus(widget.taskId, newStatus,
          completionNotes: notes);
      setState(() => _task = updated);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newStatus == 'COMPLETED'
                  ? 'Tugas berhasil ditandai selesai!'
                  : 'Status tugas diperbarui.',
            ),
            backgroundColor: AppColors.secondary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal memperbarui status: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showCompleteDialog() {
    _completionNotesController.clear();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tandai Selesai'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Masukkan catatan hasil penyelesaian tugas (opsional):',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _completionNotesController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Contoh: Display unit telah dirapikan di bay depan.',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.secondary,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _handleUpdateStatus(
                'COMPLETED',
                notes: _completionNotesController.text.trim(),
              );
            },
            child: const Text('Konfirmasi Selesai'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleAddComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    setState(() => _submittingComment = true);
    final service = ref.read(operationalTaskServiceProvider);
    try {
      final comment = await service.addComment(widget.taskId, text);
      _commentController.clear();
      setState(() {
        if (_task != null) {
          _task = _task!.copyWith(
            comments: [..._task!.comments, comment],
            commentCount: _task!.commentCount + 1,
          );
        }
        _submittingComment = false;
      });
    } catch (e) {
      setState(() => _submittingComment = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengirim komentar: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Detail Tugas')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_task == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Detail Tugas')),
        body: const Center(child: Text('Tugas tidak ditemukan.')),
      );
    }

    final task = _task!;

    return Scaffold(
      appBar: AppBar(
        title: Text(task.taskNumber),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTask,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title & Status Row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          task.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getStatusColor(task.status).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _getStatusColor(task.status),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          task.status,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: _getStatusColor(task.status),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Category & Priority Chips
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      Chip(
                        avatar: const Icon(Icons.category, size: 16),
                        label: Text(_formatCategory(task.category)),
                        backgroundColor: Colors.grey.shade100,
                      ),
                      Chip(
                        avatar: const Icon(Icons.flag, size: 16),
                        label: Text(task.priority),
                        backgroundColor:
                            _getPriorityColor(task.priority).withValues(alpha: 0.1),
                        labelStyle: TextStyle(
                          color: _getPriorityColor(task.priority),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (task.dueDate != null)
                        Chip(
                          avatar: Icon(
                            task.isOverdue
                                ? Icons.warning_amber
                                : Icons.calendar_today,
                            size: 16,
                            color:
                                task.isOverdue ? AppColors.error : Colors.black87,
                          ),
                          label: Text(
                            'Due: ${task.dueDate!.day}/${task.dueDate!.month}/${task.dueDate!.year}${task.isOverdue ? ' (Terlambat)' : ''}',
                          ),
                          backgroundColor: task.isOverdue
                              ? AppColors.error.withValues(alpha: 0.1)
                              : Colors.grey.shade100,
                          labelStyle: TextStyle(
                            color: task.isOverdue ? AppColors.error : Colors.black87,
                            fontWeight: task.isOverdue
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Assignment Card
                  Card(
                    elevation: 0,
                    color: Colors.grey.shade50,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.person,
                                  size: 18, color: Colors.blueGrey),
                              const SizedBox(width: 8),
                              const Text('Penerima: ',
                                  style: TextStyle(
                                      fontSize: 13, color: Colors.black54)),
                              Text(task.assigneeName,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.supervisor_account,
                                  size: 18, color: Colors.blueGrey),
                              const SizedBox(width: 8),
                              const Text('Pemberi Tugas: ',
                                  style: TextStyle(
                                      fontSize: 13, color: Colors.black54)),
                              Text(task.assignerName,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Description
                  if (task.description != null && task.description!.isNotEmpty) ...[
                    const Text(
                      'Deskripsi & Arahan:',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Text(
                        task.description!,
                        style: const TextStyle(fontSize: 13, height: 1.4),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Completion Notes
                  if (task.completionNotes != null &&
                      task.completionNotes!.isNotEmpty) ...[
                    const Text(
                      'Catatan Penyelesaian:',
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: AppColors.secondary),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green.shade200),
                      ),
                      child: Text(
                        task.completionNotes!,
                        style: TextStyle(
                            fontSize: 13, color: Colors.green.shade900),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Status Action Buttons
                  if (task.status != 'COMPLETED' && task.status != 'CANCELLED') ...[
                    Row(
                      children: [
                        if (task.status == 'PENDING')
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.play_arrow),
                              label: const Text('Mulai Kerjakan'),
                              onPressed: () => _handleUpdateStatus('IN_PROGRESS'),
                            ),
                          ),
                        if (task.status == 'PENDING') const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.secondary,
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.check_circle_outline),
                            label: const Text('Tandai Selesai'),
                            onPressed: _showCompleteDialog,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],

                  const Divider(),
                  const SizedBox(height: 8),

                  // Collaboration Comments Feed
                  Row(
                    children: [
                      const Icon(Icons.chat_bubble_outline,
                          size: 18, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        'Pusat Kolaborasi & Diskusi (${task.comments.length})',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (task.comments.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          'Belum ada komentar atau pembaruan.',
                          style: TextStyle(
                              color: Colors.grey.shade500, fontSize: 13),
                        ),
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: task.comments.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final c = task.comments[index];
                        return Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    c.authorName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                  if (c.createdAt != null)
                                    Text(
                                      '${c.createdAt!.hour.toString().padLeft(2, '0')}:${c.createdAt!.minute.toString().padLeft(2, '0')}',
                                      style: TextStyle(
                                        color: Colors.grey.shade500,
                                        fontSize: 11,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(c.message,
                                  style: const TextStyle(fontSize: 13)),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ),

          // Comment Input Box at bottom
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  offset: const Offset(0, -1),
                  blurRadius: 4,
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      decoration: const InputDecoration(
                        hintText: 'Kirim pembaruan / komentar tim...',
                        isDense: true,
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(20)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: _submittingComment
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send, color: AppColors.primary),
                    onPressed: _submittingComment ? null : _handleAddComment,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
