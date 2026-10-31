import '../core/app_text.dart';
import 'dart:async';

import 'package:flutter/material.dart';

class FlashSaleBanner extends StatefulWidget {
  const FlashSaleBanner({
    super.key,
    required this.endsAt,
    required this.stockCount,
  });

  final DateTime? endsAt;
  final int stockCount;

  @override
  State<FlashSaleBanner> createState() => _FlashSaleBannerState();
}

class _FlashSaleBannerState extends State<FlashSaleBanner> {
  Timer? _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final end = widget.endsAt;
    if (end == null || !end.isAfter(_now)) return SizedBox.shrink();
    final left = end.difference(_now);
    final timerText = left.inDays > 0
        ? AppText.dH(
            context,
            left.inDays,
            left.inHours.remainder(24).toString().padLeft(2, '0'),
          )
        : '${left.inHours.toString().padLeft(2, '0')}:${left.inMinutes.remainder(60).toString().padLeft(2, '0')}:${left.inSeconds.remainder(60).toString().padLeft(2, '0')}';
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 9, vertical: 7),
      decoration: BoxDecoration(
        color: Color(0xFFFFF1F2),
        border: Border.all(color: Color(0xFFFECDD3)),
        borderRadius: BorderRadius.circular(9),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.local_fire_department,
                size: 15,
                color: Color(0xFFBE123C),
              ),
              SizedBox(width: 4),
              Expanded(
                child: Text(
                  AppText.flashSale(context),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                    color: Color(0xFF9F1239),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 5),
          Row(
            children: [
              Icon(Icons.schedule, size: 13, color: Color(0xFF9F1239)),
              SizedBox(width: 3),
              Expanded(
                child: Text(
                  timerText,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                    color: Color(0xFF9F1239),
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 5),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (widget.stockCount / 10).clamp(0.04, 1.0),
              minHeight: 4,
              backgroundColor: Color(0xFFFECDD3),
              color: Color(0xFFE11D48),
            ),
          ),
          SizedBox(height: 3),
          Text(
            AppText.unitsLeft(context, widget.stockCount),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Color(0xFF9F1239),
            ),
          ),
        ],
      ),
    );
  }
}
