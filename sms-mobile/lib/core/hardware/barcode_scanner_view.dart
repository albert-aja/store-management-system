import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class BarcodeScannerModal extends StatefulWidget {
  final String title;
  final String prompt;
  final List<String> mockPresets;

  const BarcodeScannerModal({
    super.key,
    this.title = 'Scan Barcode / QR Code',
    this.prompt = 'Align serial number barcode or QR within frame',
    this.mockPresets = const [
      'DO/JKT/10/2026/0042',
      'LG-WM-1148',
      'SHP-RF-9021',
      'SAM-TV-3310',
    ],
  });

  @override
  State<BarcodeScannerModal> createState() => _BarcodeScannerModalState();
}

class _BarcodeScannerModalState extends State<BarcodeScannerModal>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  bool _flashOn = false;
  final _manualInputController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animController.dispose();
    _manualInputController.dispose();
    super.dispose();
  }

  void _onCodeDetected(String code) {
    Navigator.of(context).pop(code);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.black,
      insetPadding: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: SizedBox(
          height: 480,
          child: Stack(
            children: [
              // Viewfinder Background
              Positioned.fill(
                child: Container(
                  color: const Color(0xFF0F172A),
                  child: Center(
                    child: Container(
                      width: 260,
                      height: 260,
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        border: Border.all(color: AppColors.secondary, width: 2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Stack(
                        children: [
                          // Laser Scanning Line
                          AnimatedBuilder(
                            animation: _animController,
                            builder: (context, child) {
                              return Positioned(
                                top: 20 + (_animController.value * 210),
                                left: 10,
                                right: 10,
                                child: Container(
                                  height: 2.5,
                                  decoration: BoxDecoration(
                                    color: AppColors.secondary,
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.secondary.withValues(alpha: 0.8),
                                        blurRadius: 8,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                          Center(
                            child: Icon(
                              Icons.qr_code_scanner_rounded,
                              size: 72,
                              color: Colors.white.withValues(alpha: 0.15),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // Top Bar Controls
              Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                    Text(
                      widget.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        _flashOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                        color: _flashOn ? Colors.amber : Colors.white,
                      ),
                      onPressed: () => setState(() => _flashOn = !_flashOn),
                    ),
                  ],
                ),
              ),

              // Prompt Instruction Text
              Positioned(
                top: 70,
                left: 24,
                right: 24,
                child: Text(
                  widget.prompt,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ),

              // Bottom Sheet: Presets & Manual Code Entry
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: Color(0xFF1E293B),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Quick Barcode Presets
                      Row(
                        children: [
                          const Icon(Icons.touch_app_rounded, color: AppColors.accent, size: 16),
                          const SizedBox(width: 6),
                          const Text(
                            'Quick Scan Detection (Simulated):',
                            style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: widget.mockPresets.map((code) {
                            return Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ActionChip(
                                label: Text(code),
                                labelStyle: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w600),
                                backgroundColor: AppColors.primary,
                                side: BorderSide.none,
                                onPressed: () => _onCodeDetected(code),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Manual Entry Input
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _manualInputController,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              decoration: InputDecoration(
                                hintText: 'Or type barcode manually...',
                                hintStyle: const TextStyle(color: Colors.white38),
                                fillColor: Colors.black26,
                                filled: true,
                                isDense: true,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.secondary,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                            onPressed: () {
                              final text = _manualInputController.text.trim();
                              if (text.isNotEmpty) _onCodeDetected(text);
                            },
                            child: const Text('Submit'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

