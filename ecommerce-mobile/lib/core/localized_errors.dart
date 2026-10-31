import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_text.dart';

String localError(BuildContext? context, Object error) {
  Object detail = error;
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['message'] is String) {
      detail = data['message'];
    } else {
      return isEnglish(context)
          ? 'Unable to contact the server. Please try again.'
          : 'Tidak dapat menghubungi server. Silakan coba lagi.';
    }
  } else if (error is AuthException) {
    detail = error.message;
  } else if (error is StateError) {
    detail = error.message;
  } else if (error is FormatException) {
    detail = error.message;
  }
  final text = detail.toString();
  final pair = _knownErrors[text];
  if (pair != null) return pair[isEnglish(context) ? 1 : 0];
  for (final entry in _knownErrorPrefixes.entries) {
    if (text.startsWith(entry.key)) {
      return '${entry.value[isEnglish(context) ? 1 : 0]}${text.substring(entry.key.length)}';
    }
  }
  return text;
}

// Only recognized business-message prefixes are localized; identifiers/details
// following them are retained verbatim.
const _knownErrorPrefixes = <String, List<String>>{
  'Variant not found: ': ['Varian tidak ditemukan: ', 'Variant not found: '],
  'Cart item not found: ': [
    'Item keranjang tidak ditemukan: ',
    'Cart item not found: ',
  ],
  'Order not found: ': ['Pesanan tidak ditemukan: ', 'Order not found: '],
  'Order not found with number: ': [
    'Pesanan tidak ditemukan dengan nomor: ',
    'Order not found with number: ',
  ],
  'Flash sale stock is limited to currently available units for ': [
    'Stok flash sale dibatasi jumlah unit yang tersedia untuk ',
    'Flash sale stock is limited to currently available units for ',
  ],
  'Pesanan tidak ditemukan dengan nomor: ': [
    'Pesanan tidak ditemukan dengan nomor: ',
    'Order not found with number: ',
  ],
  'Pesanan tidak ditemukan: ': [
    'Pesanan tidak ditemukan: ',
    'Order not found: ',
  ],
  'Tidak ada alokasi pengiriman ditemukan untuk pesanan: ': [
    'Tidak ada alokasi pengiriman ditemukan untuk pesanan: ',
    'No fulfillment allocation found for order: ',
  ],
  'Kode verifikasi atau tiket pengambilan tidak valid: ': [
    'Kode verifikasi atau tiket pengambilan tidak valid: ',
    'Invalid verification or pickup ticket code: ',
  ],
  'Fulfillment group tidak ditemukan: ': [
    'Kelompok pemenuhan tidak ditemukan: ',
    'Fulfillment group not found: ',
  ],
};

const _knownErrors = <String, List<String>>{
  'Cannot share an empty wishlist': [
    'Wishlist kosong tidak dapat dibagikan.',
    'Cannot share an empty wishlist',
  ],
  'Wishlist share not found': [
    'Tautan tidak valid, dicabut, atau kedaluwarsa; atau kunci pembatalan tidak valid.',
    'Link is invalid, revoked, or expired; or the cancellation key is invalid.',
  ],
  'This item has already been reserved': [
    'Niat hadiah untuk barang ini sudah diklaim. Muat ulang status.',
    'Gift intent for this item has already been claimed. Refresh its status.',
  ],
  'Sign in or provide a guest session to manage wishlist shares': [
    'Masuk atau gunakan sesi tamu untuk mengelola snapshot wishlist.',
    'Sign in or provide a guest session to manage wishlist shares',
  ],
  'Cart item does not belong to this session': [
    'Item keranjang bukan milik sesi ini.',
    'Cart item does not belong to this session',
  ],
  'Identitas fulfillment group atau nomor pesanan harus disertakan': [
    'Identitas kelompok pemenuhan atau nomor pesanan harus disertakan.',
    'A fulfillment group identifier or order number is required.',
  ],
  'A reschedule request is already awaiting dispatcher review': [
    'Permintaan perubahan jadwal masih menunggu persetujuan dispatcher.',
    'A reschedule request is already awaiting dispatcher review',
  ],
  'Requested date and delivery window are required': [
    'Tanggal dan waktu pengiriman yang diminta wajib diisi.',
    'Requested date and delivery window are required',
  ],
  'Requested delivery window must start at least 24 hours from now': [
    'Waktu pengiriman yang diminta harus dimulai paling cepat 24 jam dari sekarang.',
    'Requested delivery window must start at least 24 hours from now',
  ],
  'Only pending deliveries can be rescheduled': [
    'Hanya pengiriman yang masih menunggu dapat diubah jadwalnya.',
    'Only pending deliveries can be rescheduled',
  ],
  'Dispatch has not set a planned departure time': [
    'Dispatcher belum menetapkan rencana waktu berangkat.',
    'Dispatch has not set a planned departure time',
  ],
  'Trip has already dispatched or is no longer planned': [
    'Armada sudah berangkat atau perjalanan tidak lagi dalam tahap perencanaan.',
    'Trip has already dispatched or is no longer planned',
  ],
  'Reschedule requests close 24 hours before planned dispatch': [
    'Permintaan perubahan jadwal ditutup 24 jam sebelum rencana berangkat.',
    'Reschedule requests close 24 hours before planned dispatch',
  ],
  'Customer account not found': [
    'Akun pelanggan tidak ditemukan.',
    'Customer account not found',
  ],
  "Cannot reschedule another customer's delivery": [
    'Anda tidak dapat mengubah jadwal pengiriman pelanggan lain.',
    "Cannot reschedule another customer's delivery",
  ],
  'Self-service rescheduling is only available for storefront delivery orders': [
    'Perubahan jadwal mandiri hanya tersedia untuk pesanan pengiriman toko online.',
    'Self-service rescheduling is only available for storefront delivery orders',
  ],
  'Delivery schedule request failed': [
    'Permintaan perubahan jadwal gagal.',
    'Delivery schedule request failed',
  ],
  'Wishlist gagal dimuat. Silakan coba lagi.': [
    'Wishlist gagal dimuat. Silakan coba lagi.',
    'Unable to load wishlist. Please try again.',
  ],
  'Login belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY.': [
    'Login belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY.',
    'Sign-in is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.',
  ],
  'Invalid login credentials': [
    'Kredensial login tidak valid.',
    'Invalid login credentials.',
  ],
  'Email not confirmed': [
    'Email belum dikonfirmasi.',
    'Email is not confirmed.',
  ],
  'Token has expired or is invalid': [
    'Kode kedaluwarsa atau tidak valid. Kirim ulang kode.',
    'Code expired or invalid. Request a new code.',
  ],
  'otp_expired': [
    'Kode kedaluwarsa. Kirim ulang kode.',
    'Code expired. Request a new code.',
  ],
  'For security purposes, you can only request this after 60 seconds.': [
    'Untuk keamanan, tunggu 60 detik sebelum meminta kode lagi.',
    'For security, wait 60 seconds before requesting another code.',
  ],
  'Masuk untuk mengatur pengiriman milik Anda.': [
    'Masuk untuk mengatur pengiriman milik Anda.',
    'Sign in to manage your deliveries.',
  ],
  'Tidak dapat membuka login Google.': [
    'Tidak dapat membuka login Google.',
    'Unable to open Google sign-in.',
  ],
  'Pesanan tidak ditemukan': ['Pesanan tidak ditemukan', 'Order not found'],
  'Item not found': ['Item tidak ditemukan', 'Item not found'],
  'Order not found': ['Pesanan tidak ditemukan', 'Order not found'],
  'Delivery order not found': [
    'Pengiriman tidak ditemukan.',
    'Delivery order not found.',
  ],
  'Reschedule request not found': [
    'Permintaan perubahan jadwal tidak ditemukan.',
    'Reschedule request not found.',
  ],
  'Reschedule request is already pending': [
    'Permintaan perubahan jadwal masih menunggu persetujuan.',
    'A reschedule request is already pending.',
  ],
  'Delivery reschedule requires at least 24 hours before planned dispatch': [
    'Perubahan jadwal harus diajukan paling lambat 24 jam sebelum rencana berangkat.',
    'Rescheduling requires at least 24 hours before planned dispatch.',
  ],
  'Requested delivery date cannot be in the past': [
    'Tanggal pengiriman tidak boleh di masa lalu.',
    'Requested delivery date cannot be in the past.',
  ],
  'Unauthorized': ['Silakan masuk kembali.', 'Please sign in again.'],
  'Forbidden': [
    'Anda tidak memiliki izin untuk tindakan ini.',
    'You do not have permission for this action.',
  ],
};

String businessLabel(
  BuildContext? context,
  String code, {
  bool approval = false,
}) {
  if (approval && code == 'PENDING') {
    return isEnglish(context) ? 'Pending approval' : 'Menunggu persetujuan';
  }
  final labels = <String, List<String>>{
    'DELIVERY': ['Pengiriman', 'Delivery'],
    'PICKUP': ['Pengambilan', 'Pickup'],
    'PARTIAL': ['Kirim Bertahap', 'Partial Delivery'],
    'COMPLETE': ['Kirim Sekaligus', 'Complete Delivery'],
    'CONFIRMED': ['Dikonfirmasi', 'Confirmed'],
    'PENDING': ['Menunggu', 'Pending'],
    'APPROVED': ['Disetujui', 'Approved'],
    'REJECTED': ['Ditolak', 'Rejected'],
    'COMPLETED': ['Selesai', 'Completed'],
    'CANCELLED': ['Dibatalkan', 'Cancelled'],
    'READY': ['Siap', 'Ready'],
    'READY_FOR_PACKING': ['Siap Dikemas', 'Ready for Packing'],
    'READY_FOR_PICKUP': ['Siap Diambil', 'Ready for Pickup'],
    'WAITING_FOR_DEPOSIT': ['Menunggu DP', 'Awaiting Deposit'],
    'WAITING_DEPOSIT': ['Menunggu DP', 'Awaiting Deposit'],
    'PENDING_PROCUREMENT': ['Menunggu Pengadaan', 'Awaiting Procurement'],
    'AWAITING_PROCUREMENT': ['Menunggu Pengadaan', 'Awaiting Procurement'],
    'AWAITING_STAGING': ['Menunggu Penyiapan', 'Awaiting Staging'],
    'AWAITING_DEPOSIT': ['Menunggu DP', 'Awaiting Deposit'],
    'PO_DRAFTED': ['Draf PO Dibuat', 'PO Drafted'],
    'RECEIVED': ['Diterima', 'Received'],
    'NONE': ['Tidak Diperlukan', 'Not Required'],
    'READY_IN_STOCK': ['Stok Siap', 'In Stock'],
    'PACKED': ['Dikemas', 'Packed'],
    'DISPATCHED': ['Diberangkatkan', 'Dispatched'],
    'PO_PLACED': ['PO Diterbitkan', 'PO Placed'],
    'IN_TRANSIT': ['Dalam Perjalanan', 'In Transit'],
    'DELIVERED': ['Terkirim', 'Delivered'],
    'DEPOSIT_CONFIRMED': ['Pembayaran Diterima', 'Payment Received'],
    'DRIVER_EN_ROUTE': ['Dalam Pengantaran', 'Out for Delivery'],
    'STORE_PICKUP_READY': ['Siap Diambil', 'Ready for Pickup'],
    'INFO': ['Info Pesanan', 'Order Info'],
    'BANK_TRANSFER_VA': ['Transfer Bank (VA)', 'Bank Transfer (VA)'],
    'COD_DRIVER': ['Bayar Tunai ke Driver', 'Cash on Delivery'],
    'CASH_STORE': ['Bayar di Kasir Toko', 'Pay at Store'],
    'IN_HOUSE_CREDIT': ['Cicilan Toko', 'Store Installments'],
    'THIRD_PARTY_FINANCING': [
      'Pembiayaan Pihak Ketiga',
      'Third-party Financing',
    ],
  };
  return labels[code]?[isEnglish(context) ? 1 : 0] ?? code;
}

String paymentDescription(BuildContext context, String code, String fallback) {
  final descriptions = <String, List<String>>{
    'QRIS': [
      'Scan cepat semua e-wallet & mobile banking',
      'Quick scan with any e-wallet or mobile banking app',
    ],
    'BANK_TRANSFER_VA': [
      'BCA, Mandiri, BRI, BNI verifikasi otomatis',
      'Automatic verification with BCA, Mandiri, BRI, BNI',
    ],
    'COD_DRIVER': [
      'Bayar tunai kepada driver toko kami saat barang tiba',
      'Pay our store driver in cash when your items arrive',
    ],
    'CASH_STORE': [
      'Bayar langsung saat mengambil pesanan di cabang',
      'Pay directly when collecting your order at the branch',
    ],
    'IN_HOUSE_CREDIT': [
      'Skema kredit internal bersahabat (perlu survei)',
      'Friendly in-house credit plan (survey required)',
    ],
    'THIRD_PARTY_FINANCING': [
      'Cicilan instan hingga 12 bulan',
      'Instant installments for up to 12 months',
    ],
  };
  return descriptions[code]?[isEnglish(context) ? 1 : 0] ?? fallback;
}

String paymentName(BuildContext context, String code, String fallback) {
  final names = <String, List<String>>{
    'QRIS': ['QRIS Standar Nasional', 'National Standard QRIS'],
    'BANK_TRANSFER_VA': ['Virtual Account Bank', 'Bank Virtual Account'],
    'COD_DRIVER': [
      'Cash on Delivery (Kurir Toko)',
      'Cash on Delivery (Store Driver)',
    ],
    'CASH_STORE': ['Bayar di Kasir Toko Showroom', 'Pay at Showroom Checkout'],
    'IN_HOUSE_CREDIT': ['Cicilan In-House Toko', 'In-house Store Installments'],
    'THIRD_PARTY_FINANCING': [
      'Kredivo / Akulaku Financing',
      'Kredivo / Akulaku Financing',
    ],
  };
  return names[code]?[isEnglish(context) ? 1 : 0] ?? fallback;
}
