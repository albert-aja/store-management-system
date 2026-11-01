import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../core/app_text.dart';
import '../core/app_theme.dart';
import '../models/product_model.dart';

class ArFurniturePreviewScreen extends StatefulWidget {
  final ProductSummary product;
  final ArModelInfo? arModel;

  const ArFurniturePreviewScreen({
    super.key,
    required this.product,
    this.arModel,
  });

  @override
  State<ArFurniturePreviewScreen> createState() => _ArFurniturePreviewScreenState();
}

class _ArFurniturePreviewScreenState extends State<ArFurniturePreviewScreen> {
  late ArModelInfo _arModel;
  late ArColorVariantInfo _selectedColor;

  // 3D Canvas Orbit Angles
  double _rotX = 25.0;
  double _rotY = 45.0;
  double _zoom = 1.0;
  bool _partOpen = false;

  // AR Mode: '3d' or 'camera'
  bool _isCameraMode = false;
  final double _cameraArScale = 1.0;
  Offset _cameraArPos = const Offset(0.5, 0.6);

  // Room Clearance State
  int _roomLengthCm = 300;
  int _roomWidthCm = 250;

  @override
  void initState() {
    super.initState();
    _arModel = widget.arModel ?? ArModelInfo.forProduct(widget.product);
    _selectedColor = _arModel.colorVariants.isNotEmpty
        ? _arModel.colorVariants.first
        : ArColorVariantInfo(name: 'Default', hexCode: '#374151', materialFinish: 'Fabric');
  }

  Color _parseHex(String hex) {
    final buffer = StringBuffer();
    if (hex.length == 6 || hex.length == 7) buffer.write('ff');
    buffer.write(hex.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }

  void _shareArPreview() {
    final text = 'Pratinjau 3D & AR Mebel SMS Mart: ${widget.product.name} '
        '(${_arModel.widthCm}x${_arModel.depthCm}x${_arModel.heightCm} cm). '
        'Warna: ${_selectedColor.name}. Cek kesesuaian ruangan Anda sekarang!';
    SharePlus.instance.share(ShareParams(text: text));
  }

  void _showRoomClearanceDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final clearanceL = _roomLengthCm - _arModel.widthCm;
            final clearanceW = _roomWidthCm - _arModel.depthCm;
            final minClearance = math.min(clearanceL, clearanceW);

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppText.checkRoomClearance(context),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Dimensi mebel: ${_arModel.widthCm} × ${_arModel.depthCm} × ${_arModel.heightCm} cm',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(AppText.roomLengthCm(context), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            TextField(
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                hintText: '300',
                                suffixText: 'cm',
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              onChanged: (val) {
                                final n = int.tryParse(val);
                                if (n != null && n > 0) {
                                  setSheetState(() => _roomLengthCm = n);
                                  setState(() => _roomLengthCm = n);
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(AppText.roomWidthCm(context), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            TextField(
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                hintText: '250',
                                suffixText: 'cm',
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              onChanged: (val) {
                                final n = int.tryParse(val);
                                if (n != null && n > 0) {
                                  setSheetState(() => _roomWidthCm = n);
                                  setState(() => _roomWidthCm = n);
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: clearanceL < 0 || clearanceW < 0
                          ? const Color(0xFFFFF1F2)
                          : minClearance >= 80
                              ? const Color(0xFFECFDF5)
                              : const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: clearanceL < 0 || clearanceW < 0
                            ? const Color(0xFFFECDD3)
                            : minClearance >= 80
                                ? const Color(0xFFA7F3D0)
                                : const Color(0xFFFDE68A),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          clearanceL < 0 || clearanceW < 0
                              ? Icons.warning_amber_rounded
                              : Icons.check_circle_rounded,
                          color: clearanceL < 0 || clearanceW < 0
                              ? const Color(0xFFE11D48)
                              : minClearance >= 80
                                  ? const Color(0xFF059669)
                                  : const Color(0xFFD97706),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                clearanceL < 0 || clearanceW < 0
                                    ? AppText.roomTooTight(context)
                                    : AppText.fitsRoom(context),
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: clearanceL < 0 || clearanceW < 0
                                      ? const Color(0xFF9F1239)
                                      : minClearance >= 80
                                          ? const Color(0xFF065F46)
                                          : const Color(0xFF92400E),
                                ),
                              ),
                              Text(
                                'Sisa panjang: ${clearanceL >= 0 ? "+$clearanceL" : clearanceL} cm • Sisa lebar: ${clearanceW >= 0 ? "+$clearanceW" : clearanceW} cm',
                                style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                              ),
                            ],
                          ),
                        ),
                      ],
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
    final baseColor = _parseHex(_selectedColor.hexCode);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(AppText.arRoomPreview(context)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Bagikan AR',
            onPressed: _shareArPreview,
          ),
          IconButton(
            icon: const Icon(Icons.straighten_outlined),
            tooltip: AppText.checkRoomClearance(context),
            onPressed: _showRoomClearanceDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // 3D Canvas / Camera AR Viewport
          Expanded(
            flex: 6,
            child: GestureDetector(
              onPanUpdate: (details) {
                if (_isCameraMode) {
                  setState(() {
                    _cameraArPos += Offset(
                      details.delta.dx / 300,
                      details.delta.dy / 300,
                    );
                  });
                } else {
                  setState(() {
                    _rotY = (_rotY + details.delta.dx * 0.8) % 360;
                    _rotX = (_rotX + details.delta.dy * 0.5).clamp(-10.0, 60.0);
                  });
                }
              },
              child: Stack(
                children: [
                  // Camera Simulation or 3D Canvas
                  Positioned.fill(
                    child: _isCameraMode
                        ? Container(
                            color: const Color(0xFF1E293B),
                            child: Stack(
                              children: [
                                // Camera floor reticle
                                Center(
                                  child: Container(
                                    width: 220,
                                    height: 120,
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.white30, width: 2),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: const Center(
                                      child: Text(
                                        'Arahkan ke Lantai Ruangan',
                                        style: TextStyle(color: Colors.white70, fontSize: 11),
                                      ),
                                    ),
                                  ),
                                ),
                                // Furniture placement overlay
                                Positioned(
                                  left: MediaQuery.of(context).size.width * _cameraArPos.dx - 60,
                                  top: MediaQuery.of(context).size.height * 0.5 * _cameraArPos.dy - 40,
                                  child: Transform.scale(
                                    scale: _cameraArScale,
                                    child: Container(
                                      width: 140,
                                      height: 90,
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: baseColor,
                                        borderRadius: BorderRadius.circular(16),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withValues(alpha: 0.5),
                                            blurRadius: 16,
                                            offset: const Offset(0, 10),
                                          )
                                        ],
                                        border: Border.all(color: Colors.white60, width: 2),
                                      ),
                                      child: Center(
                                        child: Text(
                                          widget.product.name.split(' ').first,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : CustomPaint(
                            painter: Furniture3dPainter(
                              rotX: _rotX,
                              rotY: _rotY,
                              zoom: _zoom,
                              furnitureType: _arModel.furnitureType,
                              baseColor: baseColor,
                              partOpen: _partOpen,
                              widthCm: _arModel.widthCm,
                              heightCm: _arModel.heightCm,
                            ),
                          ),
                  ),

                  // Floating dimension tags
                  Positioned(
                    top: 16,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.black12),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.straighten, size: 14, color: AppTheme.primarySky),
                          const SizedBox(width: 6),
                          Text(
                            '${_arModel.widthCm} × ${_arModel.depthCm} × ${_arModel.heightCm} cm',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Floating Action Controls
                  Positioned(
                    top: 16,
                    right: 16,
                    child: Column(
                      children: [
                        FloatingActionButton.small(
                          heroTag: 'zoom_in',
                          backgroundColor: Colors.white,
                          onPressed: () => setState(() => _zoom = (_zoom + 0.15).clamp(0.6, 2.0)),
                          child: const Icon(Icons.zoom_in, color: Colors.black87),
                        ),
                        const SizedBox(height: 8),
                        FloatingActionButton.small(
                          heroTag: 'zoom_out',
                          backgroundColor: Colors.white,
                          onPressed: () => setState(() => _zoom = (_zoom - 0.15).clamp(0.6, 2.0)),
                          child: const Icon(Icons.zoom_out, color: Colors.black87),
                        ),
                        const SizedBox(height: 8),
                        FloatingActionButton.small(
                          heroTag: 'toggle_parts',
                          backgroundColor: Colors.white,
                          onPressed: () => setState(() => _partOpen = !_partOpen),
                          child: Icon(
                            _partOpen ? Icons.door_front_door : Icons.meeting_room_outlined,
                            color: AppTheme.primarySky,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Camera Toggle Button
                  Positioned(
                    bottom: 16,
                    left: 16,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isCameraMode ? Colors.red.shade600 : AppTheme.primarySky,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      icon: Icon(_isCameraMode ? Icons.videocam_off : Icons.camera_alt),
                      label: Text(_isCameraMode ? 'Kembali ke 3D' : 'Lihat Kamera AR'),
                      onPressed: () {
                        setState(() => _isCameraMode = !_isCameraMode);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Controls: Colors, Hotspots, Fit Action
          Expanded(
            flex: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -2)),
                ],
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Swatch Selector
                    Text(
                      'Pilihan Warna & Bahan:',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 40,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _arModel.colorVariants.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 8),
                        itemBuilder: (context, idx) {
                          final col = _arModel.colorVariants[idx];
                          final isSelected = col.name == _selectedColor.name;
                          return InkWell(
                            onTap: () => setState(() => _selectedColor = col),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFF0F9FF) : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? AppTheme.primarySky : Colors.grey.shade300,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 16,
                                    height: 16,
                                    decoration: BoxDecoration(
                                      color: _parseHex(col.hexCode),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.black12),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    col.name,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      color: isSelected ? AppTheme.primarySky : Colors.black87,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Hotspots Highlights
                    if (_arModel.hotspots.isNotEmpty) ...[
                      Text(
                        'Keunggulan Konstruksi:',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade800),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: _arModel.hotspots.map((h) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.check_circle, size: 12, color: AppTheme.primarySky),
                                const SizedBox(width: 4),
                                Text(h.title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class Furniture3dPainter extends CustomPainter {
  final double rotX;
  final double rotY;
  final double zoom;
  final String furnitureType;
  final Color baseColor;
  final bool partOpen;
  final int widthCm;
  final int heightCm;

  Furniture3dPainter({
    required this.rotX,
    required this.rotY,
    required this.zoom,
    required this.furnitureType,
    required this.baseColor,
    required this.partOpen,
    required this.widthCm,
    required this.heightCm,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2 + 30;

    // Background gradient
    final bgPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFFF8FAFC), Color(0xFFE2E8F0)],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bgPaint);

    // Floor shadow ellipse
    final shadowPaint = Paint()..color = const Color(0x330F172A);
    canvas.drawOval(
      Rect.fromCenter(center: Offset(centerX, centerY + 30), width: 180 * zoom, height: 60 * zoom),
      shadowPaint,
    );

    // Grid Floor
    final gridPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.08)
      ..strokeWidth = 1.0;
    for (double i = -160; i <= 160; i += 40) {
      canvas.drawLine(Offset(centerX - 160, centerY + i * 0.3), Offset(centerX + 160, centerY + i * 0.3), gridPaint);
    }

    final radY = (rotY * math.pi) / 180;
    final cosY = math.cos(radY);
    final sinY = math.sin(radY);

    void drawBox(double bx, double by, double bz, double bw, double bh, double bd, Color col) {
      final p = Paint()
        ..color = col
        ..style = PaintingStyle.fill;
      final border = Paint()
        ..color = Colors.black12
        ..style = PaintingStyle.stroke;

      final rect = Rect.fromCenter(
        center: Offset(centerX + (bx * cosY - bz * sinY) * zoom, centerY + (by - rotX * 0.3) * zoom),
        width: bw * zoom,
        height: bh * zoom,
      );
      canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(8)), p);
      canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(8)), border);
    }

    if (furnitureType == 'SOFA') {
      // Seat
      drawBox(0, 10, 0, 150, 30, 60, baseColor);
      // Backrest
      drawBox(0, -25, -20, 150, 45, 20, baseColor.withValues(alpha: 0.9));
      // Armrests
      drawBox(-70, -5, 0, 20, 40, 60, baseColor.withValues(alpha: 0.8));
      drawBox(70, -5, 0, 20, 40, 60, baseColor.withValues(alpha: 0.8));
    } else if (furnitureType == 'WARDROBE') {
      // Main wardrobe frame
      drawBox(0, -30, 0, 100, 140, 50, baseColor);
      final shift = partOpen ? 20.0 : 0.0;
      drawBox(-25 - shift, -30, 25, 48, 136, 6, baseColor.withValues(alpha: 0.95));
      drawBox(25, -30, 25, 48, 136, 6, baseColor.withValues(alpha: 0.85));
    } else if (furnitureType == 'DINING_SET') {
      // Table
      drawBox(0, -10, 0, 130, 12, 70, baseColor);
      drawBox(-50, 20, 0, 10, 45, 10, Colors.black87);
      drawBox(50, 20, 0, 10, 45, 10, Colors.black87);
    } else {
      drawBox(0, 0, 0, 110, 60, 50, baseColor);
    }
  }

  @override
  bool shouldRepaint(covariant Furniture3dPainter oldDelegate) {
    return oldDelegate.rotX != rotX ||
        oldDelegate.rotY != rotY ||
        oldDelegate.zoom != zoom ||
        oldDelegate.baseColor != baseColor ||
        oldDelegate.partOpen != partOpen;
  }
}
