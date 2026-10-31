package com.sms.foundation.document;

public class TerbilangHelper {

    private static final String[] SATUAN = {
            "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
    };

    public static String toWords(long number) {
        if (number == 0) return "Nol Rupiah";
        return convert(number).trim() + " Rupiah";
    }

    private static String convert(long number) {
        if (number < 0) {
            return "Minus " + convert(-number);
        }
        if (number < 12) {
            return SATUAN[(int) number] + " ";
        }
        if (number < 20) {
            return convert(number - 10) + "Belas ";
        }
        if (number < 100) {
            return convert(number / 10) + "Puluh " + convert(number % 10);
        }
        if (number < 200) {
            return "Seratus " + convert(number - 100);
        }
        if (number < 1000) {
            return convert(number / 100) + "Ratus " + convert(number % 100);
        }
        if (number < 2000) {
            return "Seribu " + convert(number - 1000);
        }
        if (number < 1000000) {
            return convert(number / 1000) + "Ribu " + convert(number % 1000);
        }
        if (number < 1000000000L) {
            return convert(number / 1000000) + "Juta " + convert(number % 1000000);
        }
        if (number < 1000000000000L) {
            return convert(number / 1000000000L) + "Miliar " + convert(number % 1000000000L);
        }
        return convert(number / 1000000000000L) + "Triliun " + convert(number % 1000000000000L);
    }
}

