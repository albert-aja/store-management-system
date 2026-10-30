import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class StocktakeReviewScreen extends ConsumerStatefulWidget {
  final String sessionId;

  const StocktakeReviewScreen({super.key, required this.sessionId});

  @override
  ConsumerState<StocktakeReviewScreen> createState() =>
      _StocktakeReviewScreenState();
}

class _StocktakeReviewScreenState extends ConsumerState<StocktakeReviewScreen> {
  Map<String, dynamic>? _session;
  String? _error;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get('/api/stocktakes/${widget.sessionId}');
      if (response.data is! Map<String, dynamic>) {
        throw const FormatException('Stocktake session returned invalid data.');
      }
      setState(() {
        _session = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = 'Stocktake session unavailable: $error';
      });
    }
  }

  Future<void> _review(bool approve) async {
    try {
      await ref
          .read(apiClientProvider)
          .dio
          .post(
            '/api/stocktakes/${widget.sessionId}/review',
            data: {
              'approve': approve,
              'comment': approve
                  ? 'Count reviewed'
                  : 'Count rejected for recount',
            },
          );
      await _loadSession();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              approve
                  ? 'Stocktake reviewed. Inventory unchanged.'
                  : 'Stocktake rejected for recount.',
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Review failed: $error')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lines =
        (_session?['lines'] as List<dynamic>?)
            ?.whereType<Map<String, dynamic>>()
            .toList() ??
        [];
    final status = _session?['status']?.toString();
    return Scaffold(
      appBar: AppBar(title: const Text('Review Stocktake')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(_error!, textAlign: TextAlign.center),
              ),
            )
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Status: $status • ${_session?['varianceCount'] ?? 0} variance(s)',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: lines.length,
                    itemBuilder: (context, index) {
                      final line = lines[index];
                      final variance =
                          line['variance']?.toString() ?? 'UNCOUNTED';
                      final isMatch = variance == 'MATCH';
                      return ListTile(
                        title: Text(
                          line['variantName']?.toString() ?? 'Unknown product',
                        ),
                        subtitle: Text(line['scanCode']?.toString() ?? ''),
                        trailing: Text(
                          variance,
                          style: TextStyle(
                            color: isMatch
                                ? AppColors.secondary
                                : AppColors.error,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                if (status == 'PENDING_REVIEW')
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _review(false),
                              child: const Text('Reject / Recount'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: FilledButton(
                              onPressed: () => _review(true),
                              child: const Text('Approve Review'),
                            ),
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
