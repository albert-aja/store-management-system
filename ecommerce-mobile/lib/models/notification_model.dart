import 'package:flutter/material.dart';

class NotificationItem {
  final String id;
  final String orderNumber;
  final String
  milestoneType; // DEPOSIT_CONFIRMED, PO_PLACED, DRIVER_EN_ROUTE, STORE_PICKUP_READY
  final String title;
  final String body;
  final String? payloadData;
  final String status;
  bool isRead;
  final DateTime sentAt;

  NotificationItem({
    required this.id,
    required this.orderNumber,
    required this.milestoneType,
    required this.title,
    required this.body,
    this.payloadData,
    required this.status,
    required this.isRead,
    required this.sentAt,
  });

  IconData get iconData {
    switch (milestoneType) {
      case 'DEPOSIT_CONFIRMED':
        return Icons.verified_outlined;
      case 'PO_PLACED':
        return Icons.inventory_2_outlined;
      case 'DRIVER_EN_ROUTE':
        return Icons.local_shipping_outlined;
      case 'STORE_PICKUP_READY':
        return Icons.storefront_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color get badgeColor {
    switch (milestoneType) {
      case 'DEPOSIT_CONFIRMED':
        return const Color(0xFF10B981); // Emerald
      case 'PO_PLACED':
        return const Color(0xFF0284C7); // Sky Blue
      case 'DRIVER_EN_ROUTE':
        return const Color(0xFFF59E0B); // Amber
      case 'STORE_PICKUP_READY':
        return const Color(0xFF8B5CF6); // Purple
      default:
        return const Color(0xFF64748B); // Slate
    }
  }

  String get milestoneLabel {
    switch (milestoneType) {
      case 'DEPOSIT_CONFIRMED':
        return 'Pembayaran Diterima';
      case 'PO_PLACED':
        return 'Pengadaan PO';
      case 'DRIVER_EN_ROUTE':
        return 'Dalam Pengantaran';
      case 'STORE_PICKUP_READY':
        return 'Siap Diambil';
      default:
        return 'Info Pesanan';
    }
  }

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      milestoneType: json['milestoneType'] ?? 'INFO',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      payloadData: json['payloadData'],
      status: json['status'] ?? 'SENT',
      isRead: json['isRead'] ?? false,
      sentAt: json['sentAt'] != null
          ? DateTime.tryParse(json['sentAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
