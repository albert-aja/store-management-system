import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'app_text.dart';

class CurrencyFormatter {
  static String format(double amount, [BuildContext? context]) {
    return NumberFormat.currency(
      locale: localeName(context),
      symbol: 'Rp ',
      decimalDigits: 0,
    ).format(amount);
  }
}
