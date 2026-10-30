import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';

class PhotoProofItem {
  final String id;
  final String category;
  final String title;
  final String timestamp;
  final String? locationTag;

  const PhotoProofItem({
    required this.id,
    required this.category,
    required this.title,
    required this.timestamp,
    this.locationTag,
  });
}

class PhotoProofGridWidget extends StatefulWidget {
  final List<String> requiredCategories;
  final ValueChanged<List<PhotoProofItem>>? onPhotosChanged;

  const PhotoProofGridWidget({
    super.key,
    required this.requiredCategories,
    this.onPhotosChanged,
  });

  @override
  State<PhotoProofGridWidget> createState() => _PhotoProofGridWidgetState();
}

class _PhotoProofGridWidgetState extends State<PhotoProofGridWidget> {
  final List<PhotoProofItem> _attachedPhotos = [];

  void _capturePhoto(String category) {
    final nowStr = DateFormat('dd MMM yyyy, HH:mm:ss').format(DateTime.now());
    final photo = PhotoProofItem(
      id: 'photo-${DateTime.now().millisecondsSinceEpoch}',
      category: category,
      title: '$category Proof',
      timestamp: nowStr,
      locationTag: 'GPS: -6.2088, 106.8456 (Jakarta)',
    );

    setState(() {
      _attachedPhotos.removeWhere((p) => p.category == category);
      _attachedPhotos.add(photo);
    });

    widget.onPhotosChanged?.call(_attachedPhotos);
  }

  void _removePhoto(String id) {
    setState(() {
      _attachedPhotos.removeWhere((p) => p.id == id);
    });
    widget.onPhotosChanged?.call(_attachedPhotos);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Field Photo Evidence',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
            Text(
              '${_attachedPhotos.length} / ${widget.requiredCategories.length} Captured',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.secondary),
            ),
          ],
        ),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.25,
          ),
          itemCount: widget.requiredCategories.length,
          itemBuilder: (context, index) {
            final cat = widget.requiredCategories[index];
            final existing = _attachedPhotos.where((p) => p.category == cat).firstOrNull;

            if (existing != null) {
              return Container(
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.secondary, width: 1.5),
                ),
                padding: const EdgeInsets.all(8),
                child: Stack(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.check_circle_rounded, color: AppColors.secondary, size: 16),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                cat,
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                existing.timestamp,
                                style: const TextStyle(color: Colors.white, fontSize: 8),
                              ),
                              if (existing.locationTag != null)
                                Text(
                                  existing.locationTag!,
                                  style: const TextStyle(color: Colors.white70, fontSize: 7),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    Positioned(
                      top: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: () => _removePhoto(existing.id),
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: AppColors.error,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close_rounded, size: 12, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }

            return InkWell(
              onTap: () => _capturePhoto(cat),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border, style: BorderStyle.solid),
                ),
                padding: const EdgeInsets.all(8),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.camera_alt_outlined, color: AppColors.primary, size: 24),
                    const SizedBox(height: 6),
                    Text(
                      cat,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Tap to capture',
                      style: TextStyle(fontSize: 9, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

