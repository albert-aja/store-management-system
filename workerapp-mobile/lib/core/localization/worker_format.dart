import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'worker_locale.dart';

extension WorkerFormats on BuildContext {
  String rupiah(num value) => NumberFormat.currency(
    locale: languageTag,
    symbol: 'Rp ',
    decimalDigits: 0,
  ).format(value);
  String number(num value, {int? decimals}) {
    final formatter = NumberFormat.decimalPattern(languageTag);
    if (decimals != null) {
      formatter.minimumFractionDigits = decimals;
      formatter.maximumFractionDigits = decimals;
    }
    return formatter.format(value);
  }

  String date(DateTime value, {String pattern = 'dd MMM yyyy'}) =>
      DateFormat(pattern, languageTag).format(value);
  String wibDate(DateTime value, {String pattern = 'dd MMM yyyy, HH:mm'}) =>
      '${date(value.toUtc().add(const Duration(hours: 7)), pattern: pattern)} WIB';
  String dateValue(String value) {
    final parsed = DateTime.tryParse(value);
    return parsed == null ? value : date(parsed);
  }

  String timeValue(String? value) {
    if (value == null || value.isEmpty) return '-';
    final timestamp = DateTime.tryParse(value);
    if (timestamp != null) {
      return wibDate(
        timestamp,
        pattern: languageTag == 'id' ? 'HH:mm' : 'h:mm a',
      );
    }
    DateTime? time;
    for (final pattern in ['hh:mm a', 'HH:mm:ss', 'HH:mm']) {
      try {
        time = DateFormat(pattern, 'en').parseStrict(value);
        break;
      } on FormatException {
        continue;
      }
    }
    return time == null
        ? value
        : '${DateFormat.jm(languageTag).format(time)} WIB';
  }

  String deliveryWindow(String value) => switch (value) {
    'MORNING' => l10n.morningWindow,
    'AFTERNOON' => l10n.afternoonWindow,
    _ => value,
  };
  String photoCategory(String code) => switch (code) {
    'Goods Handover' => l10n.message184,
    'Signed Paper SJ' => l10n.message185,
    'Delivery Failure Proof' => l10n.message197,
    'Location Evidence' => l10n.message116,
    'Receipt Voucher' => l10n.message117,
    'KTP Customer' => l10n.message473,
    'Kartu Keluarga' => l10n.message474,
    'Bukti Listrik / Air' => l10n.message475,
    'Rumah & Pintu Depan' => l10n.message476,
    _ => code,
  };

  /// Labels only: callers must continue submitting the original code.
  String uiCode(String code) => switch (code) {
    'PRESENT' => l10n.present,
    'LATE' => l10n.late,
    'ON_LEAVE' => l10n.onLeave,
    'HALF_DAY' => l10n.halfDay,
    'ABSENT' => l10n.absent,
    'PENDING' || 'PENDING_REVIEW' => l10n.pending,
    'APPROVED' || 'REVIEWED' => l10n.approved,
    'REJECTED' => l10n.rejected,
    'COMPLETED' || 'DONE' => l10n.completed,
    'PLANNED' => l10n.planned,
    'DISPATCHED' => l10n.dispatched,
    'DELIVERED' => l10n.delivered,
    'FAILED' => l10n.failed,
    'ASSIGNED' => l10n.assigned,
    'PAID' || 'PAID_CASH' => l10n.paid,
    'UNPAID' => l10n.unpaid,
    'IN_PROGRESS' => l10n.inProgress,
    'DRAFT' => l10n.draft,
    'CONFIRMED' => l10n.confirmed,
    'SURVEY_REJECTED' => l10n.surveyRejected,
    'HANDED_OVER' => l10n.handedOver,
    'CASH_VERIFIED' => l10n.cashVerified,
    'VIP_CASH' => l10n.vipCash,
    'STAR_CREDIT' => l10n.starCredit,
    'HIGH_DELINQUENCY_RISK' => l10n.highRisk,
    'GENERAL' => l10n.general,
    'STANDARD' => l10n.general,
    'DRIVER' => l10n.message68,
    'SURVEYOR' => l10n.message69,
    'COLLECTOR' => l10n.message70,
    'SALESPERSON' => l10n.message71,
    'MANAGER' => l10n.message72,
    'HELPER' => l10n.message73,
    'SPV' => l10n.supervisor,
    'WORKER' => l10n.worker,
    'COMPENSATION' => l10n.compensation,
    'LOGISTICS' => l10n.logistics,
    'FINANCE' => l10n.finance,
    'SURVEY' => l10n.message494,
    'DELIVERY' => l10n.message493,
    'COLLECTION' => l10n.message495,
    'SALES_ORDER' => l10n.message402,
    'STOCKTAKE' => l10n.message269,
    'APPROVAL' => l10n.approved,
    'ANNUAL' => l10n.annual,
    'SICK' => l10n.sick,
    'MATERNITY' => l10n.maternity,
    'OTHER' => l10n.other,
    'IN_PERSON' => l10n.message132,
    'PHONE_CALL' => l10n.message133,
    'WHATSAPP' => l10n.message134,
    'REACHED' => l10n.message136,
    'PROMISED_PAYMENT' => l10n.message137,
    'NO_ANSWER' => l10n.message138,
    'REFUSED' => l10n.message139,
    'Unknown' => l10n.unknown,
    'OPEN' => l10n.open,
    'SUBMITTED' => l10n.submitted,
    'RECOUNT_REQUIRED' => l10n.recount,
    'MATCH' => l10n.matched,
    'UNCOUNTED' => l10n.uncounted,
    'MISSING' => l10n.missing,
    'UNEXPECTED' => l10n.unexpected,
    'KEPT' => l10n.kept,
    'BROKEN' => l10n.broken,
    'IN_TRANSIT' => l10n.inTransit,
    'APPROVE' => l10n.approved,
    'REJECT' => l10n.rejected,
    'PAID_TRANSFER' => l10n.message107,
    'PROMISED_TO_PAY' => l10n.message108,
    'NOT_HOME' => l10n.message109,
    _ => code,
  };
}
