import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class SignaturePadWidget extends StatefulWidget {
  final String signerName;
  final String documentTitle;
  final ValueChanged<String>? onSigned;

  const SignaturePadWidget({
    super.key,
    required this.signerName,
    required this.documentTitle,
    this.onSigned,
  });

  @override
  State<SignaturePadWidget> createState() => _SignaturePadWidgetState();
}

class _SignaturePadWidgetState extends State<SignaturePadWidget> {
  final List<List<Offset>> _strokes = [];
  List<Offset> _currentStroke = [];
  bool _hasSignature = false;

  void _clear() {
    setState(() {
      _strokes.clear();
      _currentStroke.clear();
      _hasSignature = false;
    });
  }

  void _confirm() {
    if (!_hasSignature) return;

    // Generate a lightweight vector representation of strokes
    final strokeData = _strokes.map((stroke) {
      return stroke.map((p) => [p.dx.round(), p.dy.round()]).toList();
    }).toList();

    final jsonString = jsonEncode({
      'signer': widget.signerName,
      'timestamp': DateTime.now().toIso8601String(),
      'strokes': strokeData,
    });

    final base64Sig = base64Encode(utf8.encode(jsonString));
    widget.onSigned?.call(base64Sig);
    Navigator.of(context).pop(base64Sig);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(20),
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.documentTitle,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        context.l10n.message36((widget.signerName).toString()),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: MaterialLocalizations.of(context).closeButtonTooltip,
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Canvas drawing area
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border, width: 1.5),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Stack(
                  children: [
                    // Watermark / signature baseline
                    Positioned(
                      left: 20,
                      right: 20,
                      bottom: 40,
                      child: Container(height: 1, color: Colors.black12),
                    ),
                    Positioned(
                      left: 20,
                      bottom: 22,
                      child: Text(
                        context.l10n.message37,
                        style: TextStyle(fontSize: 10, color: Colors.black26),
                      ),
                    ),

                    // Gesture drawing area
                    GestureDetector(
                      excludeFromSemantics: false,
                      onPanStart: (details) {
                        setState(() {
                          _currentStroke = [details.localPosition];
                          _strokes.add(_currentStroke);
                          _hasSignature = true;
                        });
                      },
                      onPanUpdate: (details) {
                        setState(() {
                          _currentStroke.add(details.localPosition);
                        });
                      },
                      onPanEnd: (_) {
                        setState(() {
                          _currentStroke = [];
                        });
                      },
                      child: Semantics(
                        label: context.l10n.signatureCanvas,
                        child: CustomPaint(
                          painter: _SignaturePainter(strokes: _strokes),
                          size: Size.infinite,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Action Buttons
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: _hasSignature ? _clear : null,
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: Text(context.l10n.message38),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _hasSignature ? _confirm : null,
                    icon: const Icon(Icons.check_rounded, size: 18),
                    label: Text(context.l10n.message39),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<List<Offset>> strokes;

  _SignaturePainter({required this.strokes});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF1E293B)
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2.8;

    for (final stroke in strokes) {
      for (int i = 0; i < stroke.length - 1; i++) {
        canvas.drawLine(stroke[i], stroke[i + 1], paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) => true;
}
