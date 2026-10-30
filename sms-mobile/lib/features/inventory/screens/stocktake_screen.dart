import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/hardware/barcode_scanner_view.dart';
import '../../../core/models/user_profile.dart';
import '../../auth/providers/auth_provider.dart';

class StocktakeScreen extends ConsumerStatefulWidget {
  const StocktakeScreen({super.key});

  @override
  ConsumerState<StocktakeScreen> createState() => _StocktakeScreenState();
}

class _StocktakeScreenState extends ConsumerState<StocktakeScreen> {
  static const _sessionKey = 'sms_mobile_stocktake_session';
  final List<String> _scannedSerials = [];
  bool _isLoading = true;
  String? _error;
  String? _sessionId;
  String? _sessionStatus;

  UserProfile? get _user => ref.read(authProvider).user;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_sessionKey);
      final storeId = _user?.storeId;
      if (saved != null) {
        final data = jsonDecode(saved) as Map<String, dynamic>;
        if (data['storeId'] == storeId) {
          _sessionId = data['sessionId'] as String?;
          _sessionStatus = data['sessionStatus'] as String?;
          _scannedSerials.addAll(
            (data['scannedSerials'] as List? ?? []).cast<String>(),
          );
        } else {
          await prefs.remove(_sessionKey);
        }
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = 'Saved stocktake session could not be read: $error';
      });
      return;
    }
    if (!mounted) return;
    if (_sessionId == null) {
      await _loadBookBalance();
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadBookBalance() async {
    final storeId = _user?.storeId;
    if (storeId == null) {
      setState(() {
        _isLoading = false;
        _error = 'Your profile has no store assignment.';
      });
      return;
    }
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .post('/api/stocktakes', data: {'storeId': storeId});
      if (response.data is! Map<String, dynamic> ||
          response.data['id'] == null) {
        throw const FormatException('Stocktake session returned invalid data.');
      }
      final session = response.data as Map<String, dynamic>;
      _sessionId = session['id'] as String?;
      _sessionStatus = session['status'] as String?;
      await _persist();
      setState(() {
        _isLoading = false;
        _error = null;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = 'Could not load book balance: $error';
      });
    }
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _sessionKey,
      jsonEncode({
        'storeId': _user?.storeId,
        'sessionId': _sessionId,
        'sessionStatus': _sessionStatus,
        'scannedSerials': _scannedSerials,
      }),
    );
  }

  Future<void> _submitForReview() async {
    final sessionId = _sessionId;
    if (sessionId == null) {
      setState(
        () => _error =
            'No server session exists. Connect and start a session before submitting.',
      );
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .post(
            '/api/stocktakes/$sessionId/submit',
            data: {'countedSerials': _scannedSerials},
          );
      if (response.data is! Map<String, dynamic>) {
        throw const FormatException(
          'Stocktake submission returned invalid data.',
        );
      }
      setState(() {
        _sessionStatus = response.data['status']?.toString();
        _isLoading = false;
      });
      await _persist();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Count submitted for supervisor review. Inventory unchanged.',
            ),
          ),
        );
      }
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = 'Count not submitted; local scans retained: $error';
      });
    }
  }

  Future<void> _scan() async {
    final serial = await showDialog<String>(
      context: context,
      builder: (_) => BarcodeScannerModal(
        title: 'Stocktake Scan',
        prompt: 'Scan stock unit serial. Manual entry available.',
      ),
    );
    if (!mounted) return;
    if (serial == null || serial.trim().isEmpty) return;
    final normalized = serial.trim();
    if (_scannedSerials.contains(normalized)) {
      setState(() => _error = 'Duplicate scan ignored: $normalized');
      return;
    }
    setState(() {
      _scannedSerials.add(normalized);
      _error = null;
    });
    await _persist();
  }

  Future<void> _resetSession() async {
    setState(() {
      _scannedSerials.clear();
      _sessionId = null;
      _sessionStatus = null;
      _error = null;
      _isLoading = true;
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
    if (!mounted) return;
    await _loadBookBalance();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mobile Stocktake')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isLoading || _sessionId == null || _sessionStatus != 'OPEN'
            ? null
            : _scan,
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('Scan Unit'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              children: [
                Card(
                  color: AppColors.primary.withValues(alpha: 0.06),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Blind count',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_scannedSerials.length} scanned • ${_sessionStatus ?? 'NO SESSION'}',
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Expected inventory stays hidden. Scans save on this device while offline. Submissions go to supervisor review and never adjust inventory.',
                          style: TextStyle(fontSize: 12),
                        ),
                        if (_sessionId != null && _sessionStatus == 'OPEN') ...[
                          const SizedBox(height: 8),
                          FilledButton.icon(
                            onPressed: _isLoading ? null : _submitForReview,
                            icon: const Icon(Icons.send),
                            label: const Text('Submit for supervisor review'),
                          ),
                        ],
                        TextButton.icon(
                          onPressed: _resetSession,
                          icon: const Icon(Icons.restart_alt),
                          label: const Text('Start new session'),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_error != null)
                  Card(
                    color: AppColors.error.withValues(alpha: 0.08),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        _error!,
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ),
                  ),
                if (_scannedSerials.isNotEmpty)
                  Card(
                    child: ExpansionTile(
                      title: Text(
                        'Scanned serials (${_scannedSerials.length})',
                      ),
                      children: _scannedSerials
                          .map(
                            (serial) => ListTile(
                              dense: true,
                              leading: const Icon(Icons.qr_code_2),
                              title: Text(serial),
                            ),
                          )
                          .toList(),
                    ),
                  ),
              ],
            ),
    );
  }
}
