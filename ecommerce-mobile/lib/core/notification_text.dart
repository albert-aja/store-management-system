import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import 'app_text.dart';

bool _standardTitle(NotificationItem item) => switch (item.milestoneType) {
  'DEPOSIT_CONFIRMED' => const [
    'Pembayaran Terkonfirmasi! 🎉',
    'Payment Confirmed! 🎉',
  ].contains(item.title),
  'PO_PLACED' => const [
    'Pengadaan Dimulai (PO Pemasok) 📦',
    'Procurement Started (Supplier PO) 📦',
  ].contains(item.title),
  'DRIVER_EN_ROUTE' => const [
    'Armada Toko Sedang Menuju Lokasi 🚚',
    'Store Fleet Is on the Way 🚚',
  ].contains(item.title),
  'STORE_PICKUP_READY' => const [
    'Pesanan Siap Diambil di Cabang 🏬',
    'Order Ready for Branch Pickup 🏬',
  ].contains(item.title),
  _ => false,
};

String notificationTitle(BuildContext context, NotificationItem item) {
  if (!_standardTitle(item)) return item.title;
  final english = isEnglish(context);
  return switch (item.milestoneType) {
    'DEPOSIT_CONFIRMED' =>
      english ? 'Payment Confirmed! 🎉' : 'Pembayaran Terkonfirmasi! 🎉',
    'PO_PLACED' =>
      english
          ? 'Procurement Started (Supplier PO) 📦'
          : 'Pengadaan Dimulai (PO Pemasok) 📦',
    'DRIVER_EN_ROUTE' =>
      english
          ? 'Store Fleet Is on the Way 🚚'
          : 'Armada Toko Sedang Menuju Lokasi 🚚',
    'STORE_PICKUP_READY' =>
      english
          ? 'Order Ready for Branch Pickup 🏬'
          : 'Pesanan Siap Diambil di Cabang 🏬',
    _ => item.title,
  };
}

String notificationBody(BuildContext context, NotificationItem item) {
  if (!_standardTitle(item)) return item.body;
  final english = isEnglish(context);
  final number = item.orderNumber;
  String? store;
  if (item.payloadData != null) {
    try {
      final payload = jsonDecode(item.payloadData!);
      if (payload is Map && payload['pickupStoreName'] is String) {
        store = payload['pickupStoreName'] as String;
      }
    } on FormatException {
      // Unknown notification payloads are left untouched.
    }
  }
  return switch (item.milestoneType) {
    'DEPOSIT_CONFIRMED' =>
      english
          ? 'Payment for order #$number has been received. Procurement and warehouse preparation are authorized.'
          : 'Pembayaran pesanan #$number telah kami terima. Pengadaan dan persiapan gudang telah diotorisasi.',
    'PO_PLACED' =>
      english
          ? 'A supplier purchase order (PO) for the preordered items in order #$number has been issued.'
          : 'Surat Pemesanan (PO) untuk barang indent pesanan #$number telah diterbitkan ke distributor.',
    'DRIVER_EN_ROUTE' =>
      english
          ? 'Your SMS Mart driver is on the way with order #$number to your address.'
          : 'Driver SMS Mart sedang dalam perjalanan mengantarkan pesanan #$number ke alamat Anda.',
    'STORE_PICKUP_READY' =>
      english
          ? 'Order #$number is ready for pickup${store == null ? ' at the store' : ' at $store'}. Show your order number to the staff.'
          : 'Pesanan #$number sudah siap diambil${store == null ? ' di toko' : ' di $store'}. Tunjukkan nomor pesanan kepada petugas.',
    _ => item.body,
  };
}
