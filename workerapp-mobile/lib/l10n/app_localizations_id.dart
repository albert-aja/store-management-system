// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Indonesian (`id`).
class AppLocalizationsId extends AppLocalizations {
  AppLocalizationsId([String locale = 'id']) : super(locale);

  @override
  String get perMonth => '/ bulan';

  @override
  String get morning => 'Pagi';

  @override
  String get goods => 'Barang';

  @override
  String get none => 'Tidak Ada';

  @override
  String get notification => 'Notifikasi';

  @override
  String get open => 'Terbuka';

  @override
  String get submitted => 'Dikirim';

  @override
  String get recount => 'Perlu Hitung Ulang';

  @override
  String get matched => 'Sesuai';

  @override
  String get uncounted => 'Belum Dihitung';

  @override
  String get missing => 'Kurang';

  @override
  String get unexpected => 'Tidak Sesuai';

  @override
  String get kept => 'Ditepati';

  @override
  String get broken => 'Tidak Ditepati';

  @override
  String get inTransit => 'Dalam Perjalanan';

  @override
  String get unknown => 'Tidak Diketahui';

  @override
  String get recipient => 'Penerima';

  @override
  String get compensation => 'Kompensasi';

  @override
  String get logistics => 'Logistik';

  @override
  String get finance => 'Keuangan';

  @override
  String get worker => 'Pekerja';

  @override
  String get supervisor => 'Supervisor';

  @override
  String get annual => 'Cuti Tahunan';

  @override
  String get sick => 'Cuti Sakit';

  @override
  String get maternity => 'Cuti Melahirkan / Ayah';

  @override
  String get other => 'Lainnya';

  @override
  String get incomeDefault => 'Layak untuk kredit angsuran 12 bulan.';

  @override
  String get morningWindow => 'Pagi (09:00–12:00 WIB)';

  @override
  String get afternoonWindow => 'Siang (12:00–17:00 WIB)';

  @override
  String deliveryWindowValue(String window) {
    return 'Rentang pengiriman: $window';
  }

  @override
  String get noNotes => 'Tanpa catatan';

  @override
  String get notAssigned => 'Belum ditugaskan';

  @override
  String get productItem => 'Barang Produk';

  @override
  String get noSession => 'TANPA SESI';

  @override
  String get noDp => 'Tanpa DP untuk HD < Rp 5jt';

  @override
  String get priceBracket => 'Sesuai tingkat harga';

  @override
  String get taskLabel => 'TUGAS';

  @override
  String get formulaPrincipal => '(HD - DP) + Rp 30.000';

  @override
  String get formulaRounding => 'Round(h4 / 5.000) × 5.000 + 5.000';

  @override
  String get removePhoto => 'Hapus foto';

  @override
  String capturePhoto(String category) {
    return 'Ambil foto $category';
  }

  @override
  String get signatureCanvas => 'Area menggambar tanda tangan';

  @override
  String get navigationPreferenceInvalid =>
      'Pilihan aplikasi navigasi tersimpan tidak valid. Pilih aplikasi navigasi lagi.';

  @override
  String get navigationGpsInvalid =>
      'GPS tujuan tidak valid. Minta petugas pengiriman memperbaiki titik ini.';

  @override
  String navigationUnsupported(String app) {
    return '$app tidak didukung pada platform ini.';
  }

  @override
  String get navigationStopRequired =>
      'Perjalanan dan titik pengiriman wajib diisi.';

  @override
  String navigationAppUnavailable(String app) {
    return '$app tidak tersedia. Pasang atau pilih aplikasi navigasi lain.';
  }

  @override
  String navigationOpenFailed(String app) {
    return '$app gagal dibuka. Coba lagi.';
  }

  @override
  String get navigationPreferenceSaveFailed =>
      'Navigasi terbuka, tetapi pilihan aplikasi gagal disimpan.';

  @override
  String get gpsEnable => 'Aktifkan layanan lokasi perangkat dan coba lagi.';

  @override
  String get gpsDenied => 'Izin lokasi ditolak.';

  @override
  String get gpsBlocked =>
      'Izin lokasi diblokir. Aktifkan di pengaturan sistem.';

  @override
  String get requestFailed =>
      'Tindakan gagal diselesaikan. Periksa koneksi dan coba lagi.';

  @override
  String get deliverySignIn => 'Masuk untuk memuat perjalanan pengiriman Anda.';

  @override
  String get deliveryNotAssigned =>
      'Perjalanan yang diminta tidak ditugaskan ke pengemudi ini.';

  @override
  String get deliveryTripInvalid =>
      'Respons perjalanan pengiriman tidak valid.';

  @override
  String get deliveryStopInvalid => 'Respons titik pengiriman tidak valid.';

  @override
  String get deliveryTripsFailed =>
      'Perjalanan pengiriman gagal dimuat. Periksa akses atau koneksi.';

  @override
  String get deliveryStopsFailed =>
      'Titik pengiriman gagal dimuat. Periksa akses atau koneksi.';

  @override
  String get showPassword => 'Tampilkan kata sandi';

  @override
  String get hidePassword => 'Sembunyikan kata sandi';

  @override
  String photoCaptured(String count, String total) {
    return '$count / $total Terekam';
  }

  @override
  String photoProofTitle(String category) {
    return 'Bukti $category';
  }

  @override
  String get navigate => 'Navigasi';

  @override
  String navigateWithApp(String app) {
    return 'Navigasi - $app';
  }

  @override
  String get present => 'Hadir';

  @override
  String get late => 'Terlambat';

  @override
  String get onLeave => 'Cuti';

  @override
  String get halfDay => 'Setengah Hari';

  @override
  String get absent => 'Tidak Hadir';

  @override
  String get pending => 'Menunggu';

  @override
  String get approved => 'Disetujui';

  @override
  String get rejected => 'Ditolak';

  @override
  String get completed => 'Selesai';

  @override
  String get planned => 'Direncanakan';

  @override
  String get dispatched => 'Diberangkatkan';

  @override
  String get delivered => 'Terkirim';

  @override
  String get failed => 'Gagal';

  @override
  String get assigned => 'Ditugaskan';

  @override
  String get paid => 'Dibayar';

  @override
  String get unpaid => 'Belum Dibayar';

  @override
  String get inProgress => 'Dalam Proses';

  @override
  String get draft => 'Draf';

  @override
  String get confirmed => 'Dikonfirmasi';

  @override
  String get surveyRejected => 'Survei Ditolak';

  @override
  String get handedOver => 'Diserahkan';

  @override
  String get cashVerified => 'Uang Terverifikasi';

  @override
  String get vipCash => 'VIP Tunai';

  @override
  String get starCredit => 'Kredit Unggulan';

  @override
  String get highRisk => 'Risiko Tunggakan Tinggi';

  @override
  String get general => 'Umum';

  @override
  String get notificationPause => 'Perlu dilanjutkan secara manual';

  @override
  String get trackingTitle => 'Telematika Lapangan SMS Aktif';

  @override
  String get trackingBounded =>
      'Pelacakan terbatas pada tugas operasional yang ditugaskan';

  @override
  String get trackingNotStarted => 'Tugas belum dimulai';

  @override
  String get trackingComplete => 'Tugas selesai';

  @override
  String get trackingBreak => 'Istirahat terjadwal';

  @override
  String get trackingManual => 'Pelacakan dijeda';

  @override
  String get trackingThermal => 'Penghentian untuk keamanan suhu';

  @override
  String get trackingLowBattery => 'Baterai lemah; frekuensi GPS dikurangi';

  @override
  String get trackingActive => 'Pelacakan GPS aktif';

  @override
  String get trackingSystemPause =>
      'Jeda cepat melalui tindakan notifikasi sistem';

  @override
  String get trackingLunch => 'Jeda otomatis istirahat makan siang';

  @override
  String get trackingResume => 'Dilanjutkan secara manual oleh pegawai';

  @override
  String get simulationTitle => '📋 *SIMULASI KREDIT TOKO SMS*';

  @override
  String simulationProduct(String product) {
    return 'Produk: *$product*';
  }

  @override
  String simulationPrice(String price) {
    return 'Harga Dasar: *$price*';
  }

  @override
  String simulationDp(String amount, String percentage) {
    return 'Uang Muka (DP): *$amount* ($percentage%)';
  }

  @override
  String get simulationOptions => 'PILIHAN ANGSURAN BULANAN:';

  @override
  String simulationTerm(String months, String amount) {
    return '• *$months Bulan*: $amount / bln';
  }

  @override
  String simulationTotal(String total, String saved) {
    return '   (Total: $total, Hemat Diskon: $saved/bln)';
  }

  @override
  String get simulationDiscount =>
      '💡 *Diskon 15% insentif pembayaran lancar sudah termasuk dalam angsuran.*';

  @override
  String get language => 'Bahasa';

  @override
  String get appTitle => 'Portal Pekerja SMS';

  @override
  String get languagePersistenceFailed =>
      'Pilihan bahasa gagal dimuat atau disimpan. Pilih ID/EN untuk mencoba lagi.';

  @override
  String get message1 => 'Jeda Pelacakan Manual';

  @override
  String get message2 =>
      'Masukkan alasan khusus untuk menjeda pelacakan GPS (mis. perbaikan kendaraan, ban kempes, keadaan darurat):';

  @override
  String get message3 => 'Alasan Jeda';

  @override
  String get message4 => 'mis. Ban kempes, sedang ganti ban';

  @override
  String get message5 => 'Batal';

  @override
  String get message6 => 'Jeda Pelacakan';

  @override
  String get message7 => '🎯 Peringatan Kedekatan';

  @override
  String message8(String arg0) {
    return 'Berjarak $arg0 m';
  }

  @override
  String get message9 => 'Tutup';

  @override
  String get message10 =>
      'Pelacakan GPS Siaga • Aktif hanya saat tugas dimulai';

  @override
  String get message11 => 'Tugas Operasional & Pelacakan GPS Selesai';

  @override
  String message12(String arg0) {
    return 'Penghentian Akibat Panas Aktif ($arg0°C > 45°C)';
  }

  @override
  String get message13 =>
      'Pengiriman GPS berkala dihentikan agar baterai tidak terlalu panas di bawah sinar matahari. Otomatis dilanjutkan setelah suhu <=40°C.';

  @override
  String get message14 => 'GPS Dijeda — Waktu Istirahat Terjadwal';

  @override
  String get message15 =>
      'Tidak ada koordinat yang dikumpulkan selama istirahat (UU PDP No. 27/2022).';

  @override
  String message16(String arg0) {
    return 'Pelacakan Dijeda: $arg0';
  }

  @override
  String get message17 => 'Lanjutkan';

  @override
  String get message18 => 'Pelacakan GPS Aktif';

  @override
  String message19(String arg0, String arg1) {
    return 'Terbatas pada tugas • Baterai Lemah ($arg0%) • $arg1°C • Interval 60 dtk';
  }

  @override
  String message20(String arg0, String arg1, String arg2) {
    return 'Terbatas pada tugas • $arg0 km/jam • $arg1°C • $arg2 pengiriman';
  }

  @override
  String get message21 => 'Jeda Cepat';

  @override
  String get message22 => 'Alasan...';

  @override
  String message23(String arg0) {
    return 'Panel Notifikasi: $arg0';
  }

  @override
  String get message24 => 'TUTUP PERINGATAN';

  @override
  String get message25 => 'JEDA DARI NOTIFIKASI';

  @override
  String get message26 => 'LANJUTKAN DARI NOTIFIKASI';

  @override
  String get message27 => 'Pindai Kode Batang / QR';

  @override
  String get message28 =>
      'Arahkan kode batang nomor seri atau QR ke dalam bingkai';

  @override
  String message29(String arg0) {
    return 'Kamera tidak tersedia: $arg0';
  }

  @override
  String message30(String arg0) {
    return 'Gagal mengubah lampu kilat: $arg0';
  }

  @override
  String get message31 => 'Nyalakan/matikan lampu kilat';

  @override
  String get message32 => 'Masukkan kode secara manual';

  @override
  String get message33 => 'Masukkan';

  @override
  String get message34 => 'Bukti Foto Lapangan';

  @override
  String get message35 => 'Ketuk untuk memotret';

  @override
  String message36(String arg0) {
    return 'Penanda tangan: $arg0';
  }

  @override
  String get message37 => 'Tanda tangani di atas garis dengan jari atau stylus';

  @override
  String get message38 => 'Hapus';

  @override
  String get message39 => 'Terapkan Tanda Tangan';

  @override
  String get message40 => 'Masukkan alasan pengajuan cuti';

  @override
  String get message41 =>
      'Pengajuan cuti dikirim ke Manajer Toko untuk persetujuan';

  @override
  String get message42 => 'Gagal mengajukan cuti';

  @override
  String get message43 => 'Kehadiran & Cuti';

  @override
  String get message44 => 'Perbarui';

  @override
  String get message45 => 'Riwayat Kehadiran';

  @override
  String get message46 => 'Ajukan Cuti';

  @override
  String get message47 => 'Tidak ada riwayat kehadiran.';

  @override
  String message48(String arg0, String arg1) {
    return 'Masuk: $arg0  •  Pulang: $arg1';
  }

  @override
  String get message49 => 'Formulir Pengajuan Cuti';

  @override
  String get message50 => 'Kategori Cuti';

  @override
  String get message51 => 'Cuti Tahunan (Berbayar)';

  @override
  String get message52 => 'Cuti Sakit (Surat Dokter)';

  @override
  String get message53 => 'Cuti Tidak Berbayar / Izin';

  @override
  String get message54 => 'Cuti Melahirkan / Ayah';

  @override
  String get message55 => 'Cuti Khusus / Kedukaan';

  @override
  String get message56 => 'Tanggal Mulai';

  @override
  String get message57 => 'Tanggal Selesai';

  @override
  String get message58 => 'Alasan & Keterangan';

  @override
  String get message59 => 'Jelaskan keperluan dan pengalihan tugas...';

  @override
  String get message60 => 'Kirim Pengajuan untuk Persetujuan';

  @override
  String get message61 => 'Masukkan email dan kata sandi';

  @override
  String get message62 => 'Aplikasi Pekerja SMS';

  @override
  String get message63 =>
      'Operasional lapangan, tugas, kehadiran & data pribadi';

  @override
  String get message64 => 'Email Kerja';

  @override
  String get message65 => 'Kata Sandi';

  @override
  String get message66 => 'Masuk ke Ruang Kerja Pekerja';

  @override
  String get message67 => 'Peran Demo Cepat:';

  @override
  String get message68 => 'Pengemudi';

  @override
  String get message69 => 'Petugas Survei';

  @override
  String get message70 => 'Penagih';

  @override
  String get message71 => 'Pramuniaga';

  @override
  String get message72 => 'Manajer';

  @override
  String get message73 => 'Pembantu';

  @override
  String get message74 => 'Kebijakan Tingkat Komisi & Target Penjualan (2026)';

  @override
  String get message75 =>
      'Komisi penjualan berdasarkan tingkat, dihitung dari pesanan terkonfirmasi. Konfirmasi mencakup persetujuan pelanggan dan DP bila berlaku. Tarif tingkat yang tercapai berlaku pada seluruh nilai yang memenuhi syarat.';

  @override
  String get message76 =>
      'SOP Pemeriksaan Kendaraan & Barang Sebelum Pengiriman';

  @override
  String get message77 =>
      'Pengemudi dan pembantu wajib melengkapi daftar pemeriksaan sebelum berangkat: ban, rem, bahan bakar, tali pengikat, serta kecocokan nomor seri unit dengan Surat Jalan.';

  @override
  String get message78 =>
      'Kebijakan Penyimpanan & Serah Terima Uang Pekerja Lapangan';

  @override
  String get message79 =>
      'Semua uang dari pengiriman COD dan kunjungan lapangan disimpan penagih hingga diverifikasi secara fisik oleh kasir toko. Selisih kurang/lebih wajib didokumentasikan.';

  @override
  String get message80 => 'Standar Survei Kredit & Wewenang Keputusan';

  @override
  String get message81 =>
      'Petugas survei berwenang menentukan kelayakan kredit pelanggan. Verifikasi kepemilikan tempat tinggal, tagihan listrik, dan dokumen identitas asli.';

  @override
  String get message82 => 'Pedoman Batas Akhir Periode Penjualan Nonkalender';

  @override
  String get message83 => 'SDM / GAJI';

  @override
  String get message84 =>
      'Periode kompensasi berakhir pada hari Minggu yang mencakup tanggal terakhir bulan target. Pembayaran diproses pada hari Senin setelah batas akhir.';

  @override
  String get message85 => 'Pengumuman & SOP Kantor';

  @override
  String get message86 => 'Cari aturan, pedoman, tingkat komisi...';

  @override
  String message87(String arg0) {
    return 'Penagihan belum tercatat; GPS tidak tersedia: $arg0';
  }

  @override
  String get message88 => 'Kunjungan Penagihan Lapangan';

  @override
  String message89(String arg0) {
    return 'Hasil penagihan lapangan tercatat: $arg0 dengan verifikasi GPS';
  }

  @override
  String get message90 => 'Gagal mencatat upaya penagihan';

  @override
  String get message91 => 'Serahkan Uang ke Kasir';

  @override
  String message92(String arg0) {
    return 'Konfirmasi penyerahan Rp $arg0 kepada kasir toko? Status menjadi Diserahkan sambil menunggu verifikasi kasir.';
  }

  @override
  String get message93 =>
      'Uang yang disimpan berhasil diserahkan kepada kasir!';

  @override
  String get message94 => 'Konfirmasi Serah Terima';

  @override
  String get message95 => 'Kunjungan Penagihan Lapangan';

  @override
  String get message96 => 'Uang yang Disimpan:';

  @override
  String get message97 => 'Serahkan Uang';

  @override
  String get message98 => 'Akun: REC/JKT/10/2026/0088';

  @override
  String get message99 => 'TERLAMBAT 14 HARI';

  @override
  String get message100 => 'Telepon: 0811-2233-4455  •  Angsuran #3 dari 12';

  @override
  String get message101 => 'Alamat: Jl. Pancoran Barat III No. 22, RT 04/RW 02';

  @override
  String get message102 => 'Jumlah Angsuran Tertunggak:';

  @override
  String get message103 => 'Buka Profil Pelanggan 360 & Riwayat CRM';

  @override
  String get message104 => 'Catat Hasil Kunjungan';

  @override
  String get message105 => 'Klasifikasi Hasil';

  @override
  String get message106 => 'Lunas (Penyerahan Tunai)';

  @override
  String get message107 => 'Dibayar melalui Transfer Bank';

  @override
  String get message108 => 'Janji Bayar (Tanggal PTP)';

  @override
  String get message109 => 'Pelanggan Tidak di Rumah';

  @override
  String get message110 => 'Menolak Pembayaran / Sengketa';

  @override
  String get message111 => 'Jumlah Diterima (Rp)';

  @override
  String get message112 => 'Tanda Terima Pembayaran Angsuran';

  @override
  String get message113 => 'Tanda Tangan Pembayar Terekam';

  @override
  String get message114 => 'Tanda Tangan Pembayaran Pelanggan';

  @override
  String get message115 => 'Tanggal Janji Bayar';

  @override
  String get message116 => 'Bukti Lokasi';

  @override
  String get message117 => 'Bukti Pembayaran';

  @override
  String get message118 => 'Catatan Penagih & Bukti Lapangan';

  @override
  String get message119 =>
      'Jelaskan hasil percakapan, kendala, pernyataan pelanggan...';

  @override
  String get message120 => 'Simpan Catatan Kunjungan Lapangan';

  @override
  String get message121 => 'Catat Janji Bayar (PTP)';

  @override
  String get message122 => 'Nominal Janji Bayar (Rp)';

  @override
  String get message123 => 'Tanggal Janji Bayar';

  @override
  String get message124 => 'Ubah';

  @override
  String get message125 => 'Catatan / Alasan Nasabah';

  @override
  String get message126 => 'Simpan Janji Bayar';

  @override
  String get message127 => 'Masukkan nominal janji bayar yang valid';

  @override
  String get message128 =>
      'Janji bayar berhasil dicatat & masuk antrean sinkronisasi';

  @override
  String get message129 => 'Kunjungan Lapangan / Tindak Lanjut';

  @override
  String get message130 => 'Riwayat Interaksi / Kunjungan';

  @override
  String get message131 => 'Kanal Komunikasi';

  @override
  String get message132 => 'Kunjungan Langsung';

  @override
  String get message133 => 'Panggilan Telepon';

  @override
  String get message134 => 'Chat WhatsApp';

  @override
  String get message135 => 'Hasil Interaksi';

  @override
  String get message136 => 'Terhubung / Ditemui';

  @override
  String get message137 => 'Menyepakati Janji Bayar';

  @override
  String get message138 => 'Tidak Ada Jawaban / Rumah Kosong';

  @override
  String get message139 => 'Menolak / Komplain';

  @override
  String get message140 => 'Perihal';

  @override
  String get message141 => 'Catatan Lengkap Pembicaraan';

  @override
  String get message142 => 'Simpan Riwayat Interaksi';

  @override
  String get message143 => 'Interaksi CRM berhasil disimpan';

  @override
  String get message144 => 'CRM Pelanggan 360';

  @override
  String get message145 => 'Perbarui Data';

  @override
  String get message146 => 'Data nasabah tidak ditemukan';

  @override
  String message147(String arg0, String arg1) {
    return 'NIK: $arg0 • $arg1';
  }

  @override
  String message148(String arg0) {
    return 'Skor $arg0/100';
  }

  @override
  String get message149 => 'Nilai Pelanggan Sepanjang Masa';

  @override
  String get message150 => 'Saldo Kredit Toko';

  @override
  String get message151 => 'Janji Bayar Aktif';

  @override
  String message152(String arg0) {
    return '$arg0 PTP';
  }

  @override
  String get message153 => 'Total Pesanan Selesai';

  @override
  String message154(String arg0) {
    return '$arg0 Pesanan';
  }

  @override
  String get message155 => 'Catat Janji Bayar';

  @override
  String get message156 => 'Riwayat Interaksi';

  @override
  String get message157 => 'Tag Demografis & Karakteristik';

  @override
  String get message158 => 'Daftar Janji Bayar (PTP)';

  @override
  String get message159 => 'Belum ada janji bayar tercatat';

  @override
  String message160(String arg0, String arg1) {
    return 'Jatuh Tempo: $arg0\n$arg1';
  }

  @override
  String get message161 => 'Riwayat Interaksi CRM Terakhir';

  @override
  String get message162 => 'Belum ada riwayat interaksi';

  @override
  String message163(String arg0, String arg1) {
    return 'Hasil: $arg0\n$arg1';
  }

  @override
  String get message164 => 'Pesanan pengiriman mengembalikan data tidak valid.';

  @override
  String message165(String arg0) {
    return 'Pesanan pengiriman tidak tersedia: $arg0';
  }

  @override
  String get message166 => 'Pesanan Pengiriman';

  @override
  String message167(String arg0, String arg1) {
    return '$arg0\nStatus: $arg1';
  }

  @override
  String get message168 => 'Alasan kegagalan';

  @override
  String get message169 => 'Daftar barang kemasan';

  @override
  String get message170 => 'Produk';

  @override
  String message171(String arg0) {
    return 'Nomor seri: $arg0';
  }

  @override
  String get message172 =>
      'Kembali ke daftar perjalanan. Navigasi tidak mengonfirmasi kedatangan atau pengiriman.';

  @override
  String get message173 => 'Pindai Kode Batang Pengiriman';

  @override
  String get message174 => 'Pindai QR Surat Jalan atau Nomor Seri Unit Stok';

  @override
  String message175(String arg0) {
    return 'Kode batang terverifikasi: $arg0';
  }

  @override
  String get message176 => 'Konfirmasi Serah Terima Pengiriman';

  @override
  String message177(String arg0) {
    return 'Surat Jalan: $arg0';
  }

  @override
  String get message178 => 'Nama Lengkap Penerima';

  @override
  String get message179 => 'Telepon Penerima';

  @override
  String get message180 => 'Uang COD Diterima (Rp)';

  @override
  String message181(String arg0) {
    return 'Serah Terima Surat Jalan $arg0';
  }

  @override
  String get message182 => 'Tanda Tangan Terekam';

  @override
  String get message183 => 'Tanda Tangan Digital Pelanggan';

  @override
  String get message184 => 'Serah Terima Barang';

  @override
  String get message185 => 'Surat Jalan Ditandatangani';

  @override
  String message186(String arg0) {
    return 'Pengiriman belum dikonfirmasi; GPS tidak tersedia: $arg0';
  }

  @override
  String message187(String arg0, String arg1, String arg2, String arg3) {
    return 'Serah terima terverifikasi melalui GPS [$arg0, $arg1]. Tanda tangan terekam: $arg2. Foto: $arg3';
  }

  @override
  String get message188 => 'Pengiriman dikonfirmasi.';

  @override
  String get message189 =>
      'Pengiriman belum dikonfirmasi server. Periksa koneksi dan coba lagi.';

  @override
  String get message190 => 'Laporkan Kegagalan Pengiriman';

  @override
  String get message191 => 'Alasan Kegagalan';

  @override
  String get message192 => 'Pelanggan Tidak Dapat Dihubungi / Tidak di Rumah';

  @override
  String get message193 => 'Alamat Salah / Tidak Lengkap';

  @override
  String get message194 => 'Pelanggan Menolak Barang';

  @override
  String get message195 => 'Barang Rusak dalam Perjalanan';

  @override
  String get message196 => 'Catatan Operasional';

  @override
  String get message197 => 'Bukti Kegagalan Pengiriman';

  @override
  String message198(String arg0) {
    return 'Kegagalan belum dilaporkan; GPS tidak tersedia: $arg0';
  }

  @override
  String message199(String arg0, String arg1, String arg2, String arg3) {
    return '$arg0 GPS: $arg1, $arg2. Foto bukti kegagalan: $arg3.';
  }

  @override
  String get message200 =>
      'Laporan kegagalan dikirim. Petugas pengiriman harus menjadwalkan ulang.';

  @override
  String message201(String arg0) {
    return 'Laporan belum disimpan: $arg0';
  }

  @override
  String get message202 => 'Kirim Laporan Kegagalan';

  @override
  String get message203 => 'Pelaksanaan Perjalanan Pengemudi';

  @override
  String message204(String arg0) {
    return 'Perjalanan: $arg0';
  }

  @override
  String get message205 => 'Pemindai Kode Batang';

  @override
  String get message206 => 'Kendaraan belum ditugaskan';

  @override
  String get message207 => 'Tidak ada perjalanan dimuat';

  @override
  String message208(String arg0, String arg1) {
    return '$arg0 / $arg1 Titik Pengiriman';
  }

  @override
  String get message209 => 'Saldo Uang COD yang Disimpan:';

  @override
  String get message210 =>
      'Tidak ada titik pengiriman aktif untuk perjalanan ini.';

  @override
  String message211(String arg0, String arg1) {
    return 'Titik #$arg0  •  $arg1';
  }

  @override
  String message212(String arg0) {
    return 'Telepon: $arg0';
  }

  @override
  String message213(String arg0) {
    return 'Alamat: $arg0';
  }

  @override
  String message214(String arg0) {
    return 'Rentang pengiriman: $arg0 WIB';
  }

  @override
  String message215(String arg0, String arg1) {
    return '$arg0 (NS: $arg1)';
  }

  @override
  String get message216 => 'Verifikasi Kode Batang Nomor Seri';

  @override
  String message217(String arg0) {
    return 'Penagihan COD Diperlukan: Rp $arg0';
  }

  @override
  String get message218 => 'Gagal / Ditolak';

  @override
  String get message219 => 'Serah Terima Selesai';

  @override
  String message220(String arg0) {
    return 'Pilihan navigasi gagal dimuat: $arg0';
  }

  @override
  String get message221 => 'Navigasi tidak tersedia dalam versi aplikasi ini.';

  @override
  String get message222 =>
      'Hanya GPS tujuan dibagikan ke aplikasi navigasi pilihan Anda. Pilihan disimpan untuk navigasi sekali ketuk. Kembali melalui callback Maps atau tombol Kembali/pengalih aplikasi sistem.';

  @override
  String message223(String arg0) {
    return 'Navigasi gagal dibuka: $arg0';
  }

  @override
  String get message224 =>
      'Navigasi tidak tersedia: GPS tujuan kosong atau tidak valid. Minta petugas pengiriman memberikan koordinat terverifikasi.';

  @override
  String get message225 => 'Navigasi eksternal memerlukan Android atau iOS.';

  @override
  String get message226 => 'Membuka navigasi...';

  @override
  String get message227 => 'Pilih aplikasi navigasi';

  @override
  String get message228 => 'Berhasil mencatat pulang hari ini';

  @override
  String get message229 => 'Di Luar Batas GPS Toko';

  @override
  String message230(String arg0) {
    return 'Posisi GPS Anda ($arg0) di luar batas toko yang diizinkan (200 m). Catat masuk di dalam bangunan toko.';
  }

  @override
  String get message231 => 'OK';

  @override
  String message232(String arg0, String arg1, String arg2) {
    return 'GPS Terverifikasi: [$arg0, $arg1] (Akurasi: $arg2 m)';
  }

  @override
  String get message233 =>
      'Batas GPS Terverifikasi: Masuk tercatat (Hadir di toko)';

  @override
  String get message234 =>
      'Identitas biometrik dikonfirmasi (Sidik Jari / Face ID terverifikasi)';

  @override
  String get message235 => 'Aplikasi Pekerja';

  @override
  String get message236 => 'Notifikasi Tindak Lanjut';

  @override
  String get message237 => 'Verifikasi Biometrik';

  @override
  String get message238 => 'Keluar';

  @override
  String message239(String arg0) {
    return '$arg0 Tindakan Luring dalam Antrean';
  }

  @override
  String get message240 =>
      'Sinkronisasi otomatis di latar belakang saat terhubung';

  @override
  String get message241 => 'Sinkronkan Sekarang';

  @override
  String get message242 => 'Sudah Masuk (Hadir)';

  @override
  String get message243 => 'Kehadiran Harian';

  @override
  String message244(String arg0) {
    return 'Terverifikasi: $arg0';
  }

  @override
  String get message245 => 'Memerlukan Pemeriksaan Batas GPS';

  @override
  String get message246 => 'Catat Pulang';

  @override
  String get message247 => 'Catat Masuk';

  @override
  String get message248 => 'Pekerjaan Aktif Saya';

  @override
  String get message249 => 'Antrean Survei Kredit';

  @override
  String message250(String arg0) {
    return '$arg0 survei • Bukti Foto KTP/KK/GPS';
  }

  @override
  String message251(String arg0) {
    return '$arg0 MENUNGGU';
  }

  @override
  String get message252 => 'Perjalanan Pengiriman Aktif';

  @override
  String message253(String arg0, String arg1) {
    return '$arg0 • $arg1 Titik Pengiriman • Kode Batang & Tanda Tangan';
  }

  @override
  String get message254 => 'Kunjungan Penagihan Lapangan';

  @override
  String message255(String arg0, String arg1) {
    return '$arg0 akun • Tunai: Rp $arg1';
  }

  @override
  String message256(String arg0) {
    return '$arg0 JATUH TEMPO';
  }

  @override
  String get message257 => 'Penjualan & Tindak Lanjut Pelanggan';

  @override
  String get message258 =>
      'Pesanan terkonfirmasi memenuhi syarat pengakuan komisi';

  @override
  String get message259 => 'Tugas Pembantu yang Ditugaskan';

  @override
  String get message260 => 'Memuat truk pengiriman • Persiapan ruang pamer';

  @override
  String get message261 => 'Data Pribadi & Perusahaan';

  @override
  String get message262 => 'Riwayat Batas GPS';

  @override
  String get message263 => 'Slip Gaji Saya';

  @override
  String get message264 => 'Gaji & komisi';

  @override
  String get message265 => 'Pengumuman Kantor';

  @override
  String get message266 => 'Aturan, SOP & target';

  @override
  String get message267 => 'Pusat Tugas Saya';

  @override
  String get message268 => 'Semua tugas yang ditugaskan';

  @override
  String get message269 => 'Stock Opname Seluler';

  @override
  String get message270 => 'Pindai dan bandingkan saldo pembukuan';

  @override
  String get message271 => 'Pengambilan Barang Gudang';

  @override
  String get message272 => 'Verifikasi nomor seri daftar barang';

  @override
  String get message273 => 'Sesi stock opname mengembalikan data tidak valid.';

  @override
  String message274(String arg0) {
    return 'Sesi stock opname tidak tersedia: $arg0';
  }

  @override
  String get message275 => 'Hitungan ditinjau';

  @override
  String get message276 => 'Hitungan ditolak untuk dihitung ulang';

  @override
  String get message277 => 'Stock opname ditinjau. Persediaan tidak berubah.';

  @override
  String get message278 => 'Stock opname ditolak untuk dihitung ulang.';

  @override
  String message279(String arg0) {
    return 'Peninjauan gagal: $arg0';
  }

  @override
  String get message280 => 'Tinjau Stock Opname';

  @override
  String message281(String arg0, String arg1) {
    return 'Status: $arg0 • $arg1 selisih';
  }

  @override
  String get message282 => 'Produk tidak diketahui';

  @override
  String get message283 => 'Tolak / Hitung Ulang';

  @override
  String get message284 => 'Setujui Peninjauan';

  @override
  String message285(String arg0) {
    return 'Sesi stock opname tersimpan gagal dibaca: $arg0';
  }

  @override
  String get message286 => 'Profil Anda belum ditugaskan ke toko.';

  @override
  String message287(String arg0) {
    return 'Saldo pembukuan gagal dimuat: $arg0';
  }

  @override
  String get message288 =>
      'Tidak ada sesi server. Hubungkan dan mulai sesi sebelum mengirim.';

  @override
  String get message289 =>
      'Pengajuan stock opname mengembalikan data tidak valid.';

  @override
  String get message290 =>
      'Hitungan dikirim untuk ditinjau supervisor. Persediaan tidak berubah.';

  @override
  String message291(String arg0) {
    return 'Hitungan belum dikirim; hasil pindai lokal disimpan: $arg0';
  }

  @override
  String get message292 => 'Pindai Stock Opname';

  @override
  String get message293 =>
      'Pindai nomor seri unit stok. Input manual tersedia.';

  @override
  String message294(String arg0) {
    return 'Pindaian duplikat diabaikan: $arg0';
  }

  @override
  String get message295 => 'Pindai Unit';

  @override
  String get message296 => 'Hitung tanpa melihat saldo';

  @override
  String message297(String arg0, String arg1) {
    return '$arg0 dipindai • $arg1';
  }

  @override
  String get message298 =>
      'Persediaan seharusnya tetap tersembunyi. Hasil pindai disimpan di perangkat saat luring. Pengajuan ditinjau supervisor dan tidak pernah menyesuaikan persediaan.';

  @override
  String get message299 => 'Kirim untuk peninjauan supervisor';

  @override
  String get message300 => 'Mulai sesi baru';

  @override
  String message301(String arg0) {
    return 'Nomor seri dipindai ($arg0)';
  }

  @override
  String get message302 => 'Daftar pengambilan mengembalikan data tidak valid.';

  @override
  String message303(String arg0) {
    return 'Daftar pengambilan tidak tersedia: $arg0';
  }

  @override
  String message304(String arg0) {
    return 'Tidak ada nomor seri unit stok ditugaskan ke $arg0.';
  }

  @override
  String get message305 => 'Verifikasi Daftar Kemasan';

  @override
  String message306(String arg0, String arg1) {
    return 'Pindai $arg0 nomor seri unit stok untuk $arg1';
  }

  @override
  String message307(String arg0, String arg1) {
    return 'Nomor seri tidak sesuai untuk $arg0: $arg1';
  }

  @override
  String get message308 => 'Server belum mengonfirmasi verifikasi kemasan.';

  @override
  String message309(String arg0) {
    return 'Kemasan $arg0 terverifikasi.';
  }

  @override
  String message310(String arg0) {
    return 'Verifikasi kemasan gagal: $arg0';
  }

  @override
  String get message311 => 'Panduan Pengambilan & Pengemasan';

  @override
  String get message312 => 'Perbarui daftar barang';

  @override
  String message313(String arg0, String arg1) {
    return '$arg0 / $arg1 daftar barang terverifikasi';
  }

  @override
  String get message314 => 'Tidak ada daftar pengiriman menunggu.';

  @override
  String get message315 => 'Daftar Produk';

  @override
  String message316(String arg0) {
    return 'Pelanggan: $arg0';
  }

  @override
  String message317(String arg0) {
    return 'Unit seharusnya: $arg0';
  }

  @override
  String get message318 => 'Daftar barang terverifikasi';

  @override
  String message319(String arg0, String arg1) {
    return '$arg0 / $arg1 dipindai';
  }

  @override
  String get message320 => 'Pindai';

  @override
  String get message321 => 'Notifikasi mengembalikan data tidak valid.';

  @override
  String message322(String arg0) {
    return 'Notifikasi tidak tersedia: $arg0';
  }

  @override
  String message323(String arg0) {
    return 'Notifikasi gagal ditandai dibaca: $arg0';
  }

  @override
  String get message324 =>
      'Tahapan persetujuan mengembalikan data tidak valid.';

  @override
  String get message325 => 'Tidak ditemukan tahap persetujuan menunggu.';

  @override
  String get message326 => 'Diputuskan dari notifikasi seluler';

  @override
  String get message327 => 'Persetujuan tercatat.';

  @override
  String get message328 => 'Penolakan tercatat.';

  @override
  String message329(String arg0) {
    return 'Tindakan persetujuan gagal: $arg0';
  }

  @override
  String get message330 => 'Coba Lagi';

  @override
  String get message331 => 'Tidak ada notifikasi.';

  @override
  String get message332 => 'Buka dokumen';

  @override
  String get message333 => 'Tolak';

  @override
  String get message334 => 'Setujui';

  @override
  String get message335 => 'Gaji & Kompensasi Saya';

  @override
  String get message336 => 'Belum ada slip gaji.';

  @override
  String message337(String arg0, String arg1) {
    return 'Batas Akhir: $arg0 • Pembayaran: $arg1';
  }

  @override
  String get message338 => 'Total Pembayaran Bersih (Transfer)';

  @override
  String get message339 => 'Dibayarkan melalui Rekening Gaji BCA';

  @override
  String get message340 => 'Rincian Pendapatan & Komisi';

  @override
  String get message341 => 'Gaji Pokok (Prorata)';

  @override
  String get message342 => 'Komisi Penjualan Terkonfirmasi';

  @override
  String get message343 => 'Insentif Pemulihan Penagihan';

  @override
  String get message344 => 'Tunjangan Operasional & Bahan Bakar';

  @override
  String get message345 => 'Pendapatan Kotor';

  @override
  String get message346 => 'Potongan & Penyesuaian';

  @override
  String get message347 => 'Potongan Kehadiran & Keterlambatan';

  @override
  String get message348 => 'Total Potongan';

  @override
  String get message349 => 'Produk Katalog';

  @override
  String get message350 => 'Simulasi Produk';

  @override
  String message351(String arg0) {
    return 'Gagal mencari katalog: $arg0';
  }

  @override
  String get message352 =>
      'Simulasi kredit disalin! Siap dikirim ke WhatsApp/pembeli.';

  @override
  String get message353 => 'Kalkulator Kredit & Simulasi';

  @override
  String get message354 => 'Salin Penawaran (WhatsApp)';

  @override
  String get message355 => 'Atur Ulang Input';

  @override
  String get message356 =>
      'Hitung simulasi angsuran kredit sesuai kondisi khusus pembeli (DP 10%, nominal bebas, atau tenor fleksibel).';

  @override
  String get message357 => 'Sumber Produk';

  @override
  String get message358 => 'Input Bebas';

  @override
  String get message359 => 'Katalog Toko';

  @override
  String message360(String arg0) {
    return 'Kode: $arg0';
  }

  @override
  String get message361 => 'Cari nama / kode produk...';

  @override
  String get message362 => 'Cari';

  @override
  String get message363 => 'Nama Produk / Paket (Opsional)';

  @override
  String get message364 => 'Contoh: Smart TV 43\" UHD / Paket Sofa L';

  @override
  String get message365 => 'Harga Dasar (HD / OTR Tunai)';

  @override
  String get message366 => 'Nominal Harga Dasar';

  @override
  String get message367 => '+500 Rb';

  @override
  String get message368 => '+1 Jt';

  @override
  String get message369 => '+2 Jt';

  @override
  String get message370 => '+5 Jt';

  @override
  String get message371 => 'Uang Muka (DP)';

  @override
  String get message372 => 'Standar';

  @override
  String get message373 => 'Persen (%)';

  @override
  String get message374 => 'Nominal (Rp)';

  @override
  String message375(String arg0, String arg1) {
    return 'Rekomendasi sistem: $arg0 ($arg1)';
  }

  @override
  String message376(String arg0, String arg1) {
    return 'Pilih Persentase DP: $arg0% = $arg1';
  }

  @override
  String get message377 => 'Nominal DP yang disepakati pembeli';

  @override
  String get message378 => 'Contoh: 750000';

  @override
  String message379(String arg0) {
    return 'Setara dengan $arg0% dari Harga Dasar';
  }

  @override
  String get message380 => 'Pokok Pembiayaan Bersih (h1):';

  @override
  String message381(String arg0) {
    return '$arg0 (termasuk biaya Rp 30rb)';
  }

  @override
  String get message382 => 'Diskon Lancar 15%';

  @override
  String get message383 => 'Pilihan Tenor & Angsuran';

  @override
  String message384(String arg0) {
    return '$arg0 Opsi Tersedia';
  }

  @override
  String message385(String arg0) {
    return '$arg0 Bulan';
  }

  @override
  String message386(String arg0) {
    return 'Total Bayar: $arg0';
  }

  @override
  String message387(String arg0) {
    return 'Hemat Rp ${arg0}rb/bln (Diskon 15%)';
  }

  @override
  String get message388 => 'Rincian Rumus Ritel (Standar Perusahaan)';

  @override
  String message389(String arg0) {
    return 'Rincian langkah perhitungan untuk tenor $arg0 bulan';
  }

  @override
  String get message390 => '1. Pokok Bersih (h1)';

  @override
  String get message391 => '2. Bunga Flat (h2)';

  @override
  String message392(String arg0) {
    return 'h1 × (1 + 4% × $arg0 bln)';
  }

  @override
  String get message393 => '3. Angsuran Kotor (h3)';

  @override
  String message394(String arg0) {
    return '$arg0/bln';
  }

  @override
  String get message395 => '4. Diskon Disiplin (h4)';

  @override
  String get message396 => 'h3 × 85% (Diskon 15%)';

  @override
  String get message397 => '5. Hasil Akhir';

  @override
  String get message398 => 'Salin Simulasi untuk WhatsApp';

  @override
  String message399(String arg0, String arg1) {
    return 'Gunakan Tenor $arg0 Bulan ($arg1/bln)';
  }

  @override
  String get message400 => 'Pesanan penjualan mengembalikan data tidak valid.';

  @override
  String message401(String arg0) {
    return 'Pesanan penjualan tidak tersedia: $arg0';
  }

  @override
  String get message402 => 'Pesanan Penjualan';

  @override
  String get message403 => 'Pelanggan';

  @override
  String message404(String arg0) {
    return 'Status: $arg0';
  }

  @override
  String get message405 => 'Barang';

  @override
  String message406(String arg0) {
    return 'Jumlah: $arg0';
  }

  @override
  String get message407 => 'Total penawaran';

  @override
  String get message408 =>
      'Progres penjualan tidak tersedia. Periksa akses atau koneksi.';

  @override
  String get message409 =>
      'Masukkan nama atau telepon pelanggan untuk mencari.';

  @override
  String get message410 =>
      'Pencarian pelanggan mengembalikan data tidak valid.';

  @override
  String message411(String arg0) {
    return 'Pencarian pelanggan gagal: $arg0';
  }

  @override
  String message412(String arg0) {
    return 'Draf penawaran gagal dibuat: $arg0';
  }

  @override
  String get message413 => 'Masukkan nama atau kode produk untuk mencari.';

  @override
  String get message414 => 'Pencarian produk mengembalikan data tidak valid.';

  @override
  String message415(String arg0) {
    return 'Pencarian produk gagal: $arg0';
  }

  @override
  String get message416 => 'Tidak ada varian produk aktif.';

  @override
  String get message417 => 'Tidak ada harga toko aktif untuk produk ini.';

  @override
  String get message418 => 'Item penawaran mengembalikan data tidak valid.';

  @override
  String message419(String arg0) {
    return '$arg0 ditambahkan ke draf penawaran.';
  }

  @override
  String message420(String arg0) {
    return 'Produk gagal ditambahkan ke penawaran: $arg0';
  }

  @override
  String message421(String arg0, String arg1, String arg2) {
    return 'Simulasi: $arg0 ($arg1 bln @ $arg2/bln)';
  }

  @override
  String message422(String arg0, String arg1, String arg2) {
    return 'Simulasi $arg0: $arg1 bln @ $arg2/bln';
  }

  @override
  String get message423 => 'Pusat Kerja Pramuniaga';

  @override
  String get message424 => 'Progres penjualan tidak tersedia';

  @override
  String message425(String arg0) {
    return '$arg0 pesanan terkonfirmasi bulan ini';
  }

  @override
  String get message426 => 'Perbarui progres';

  @override
  String message427(String arg0, String arg1, String arg2) {
    return 'Aktual: $arg0 / Target: $arg1 ($arg2%)';
  }

  @override
  String message428(String arg0) {
    return 'Perkiraan Komisi: $arg0';
  }

  @override
  String get message429 => 'Kalkulator & Simulasi Kredit';

  @override
  String get message430 =>
      'Hitung simulasi angsuran dengan DP khusus (10%, nominal bebas, atau tenor khusus).';

  @override
  String get message431 => 'Buka';

  @override
  String get message432 => 'Cari pelanggan';

  @override
  String message433(String arg0) {
    return 'Draf penawaran: $arg0';
  }

  @override
  String get message434 => 'Nama atau telepon pelanggan';

  @override
  String get message435 => 'Cari Pelanggan';

  @override
  String get message436 => 'Buat draf penawaran';

  @override
  String get message437 => 'Nama atau kode produk';

  @override
  String get message438 => 'Cari Produk';

  @override
  String get message439 => 'Simulasi kredit produk ini';

  @override
  String get message440 => 'Tambah satu unit dengan harga tunai toko';

  @override
  String get message441 => 'Survei Lokasi Nasabah';

  @override
  String message442(String arg0) {
    return 'Lokasi GPS gagal direkam: $arg0';
  }

  @override
  String message443(String arg0) {
    return 'Konfirmasi Survei $arg0?';
  }

  @override
  String get message444 =>
      'Ini akan menyetujui kelayakan kredit pelanggan dan melanjutkan pesanan penjualan ke konfirmasi.';

  @override
  String get message445 =>
      'Ini akan menolak kelayakan kredit dan menetapkan status akhir pesanan menjadi Survei Ditolak.';

  @override
  String get message446 => 'Konfirmasi Persetujuan';

  @override
  String get message447 => 'Konfirmasi Penolakan';

  @override
  String message448(String arg0) {
    return 'Keputusan survei belum dikirim; GPS tidak tersedia: $arg0';
  }

  @override
  String get message449 =>
      'Profil survei belum disimpan. Periksa koneksi dan coba lagi.';

  @override
  String message450(String arg0, String arg1) {
    return 'Keputusan survei kredit tercatat: $arg0 dengan GPS & $arg1 foto';
  }

  @override
  String get message451 => 'Gagal mengirim keputusan survei';

  @override
  String get message452 => 'Penilaian Survei Kredit';

  @override
  String message453(String arg0) {
    return 'ID Survei: $arg0';
  }

  @override
  String get message454 => 'NIK: 3171021405880003  •  Telepon: 0812-8899-7711';

  @override
  String get message455 =>
      'Alamat: Jl. Tebet Barat Dalam VII No. 4, Jakarta Selatan';

  @override
  String get message456 => 'Profil Lokasi Pengiriman';

  @override
  String get message457 => 'GPS tujuan belum direkam';

  @override
  String message458(String arg0, String arg1, String arg2) {
    return 'GPS: $arg0, $arg1 (±$arg2 m)';
  }

  @override
  String get message459 => 'Rekam GPS tujuan';

  @override
  String get message460 => 'Lebar gang (meter)';

  @override
  String get message461 => 'Ruang bebas tangga / pintu (meter)';

  @override
  String get message462 => 'Catatan gerbang dan akses pengiriman';

  @override
  String get message463 => 'Lebar gerbang, jam akses, tangga, batasan parkir';

  @override
  String get message464 => 'Verifikasi Tempat Tinggal & Keuangan';

  @override
  String get message465 => 'Status Kepemilikan Rumah';

  @override
  String get message466 => 'Milik Sendiri';

  @override
  String get message467 => 'Milik Keluarga';

  @override
  String get message468 => 'Sewa Tahunan (Kontrak)';

  @override
  String get message469 => 'Kost / Sewa Bulanan';

  @override
  String get message470 => 'Perkiraan Penghasilan Bersih Bulanan (Rp)';

  @override
  String get message471 => 'Perkiraan Biaya Hidup Bulanan (Rp)';

  @override
  String get message472 => 'Angsuran / Kewajiban Lain yang Ada';

  @override
  String get message473 => 'KTP Pelanggan';

  @override
  String get message474 => 'Kartu Keluarga';

  @override
  String get message475 => 'Bukti Listrik / Air';

  @override
  String get message476 => 'Rumah & Pintu Depan';

  @override
  String get message477 => 'Pemeriksaan Dokumen Fisik Lapangan';

  @override
  String get message478 => 'KTP Asli Diverifikasi di Lokasi';

  @override
  String get message479 => 'Kartu Keluarga (KK) terverifikasi';

  @override
  String get message480 => 'Tagihan Listrik / Air Terbaru sesuai alamat';

  @override
  String get message481 => 'Bukti Penghasilan / Slip Gaji / Rekening Koran';

  @override
  String get message482 => 'Penilaian & Alasan Petugas Survei';

  @override
  String get message483 => 'Catatan Penilaian';

  @override
  String get message484 =>
      'Berikan alasan terperinci tentang kelayakan kredit...';

  @override
  String get message485 => 'Tolak Kredit';

  @override
  String get message486 => 'Setujui Kredit';

  @override
  String message487(String arg0) {
    return 'Survei Kredit: Pelanggan #$arg0';
  }

  @override
  String message488(String arg0, String arg1) {
    return 'Pengiriman: $arg0 ($arg1)';
  }

  @override
  String message489(String arg0) {
    return 'Penagihan Lapangan: $arg0';
  }

  @override
  String get message490 => 'Persiapan Truk Gudang & Pemeriksaan Pembantu';

  @override
  String get message491 => 'Pekerjaan Saya & Antrean Tugas';

  @override
  String get message492 => 'Semua Tugas';

  @override
  String get message493 => 'Pengiriman';

  @override
  String get message494 => 'Survei';

  @override
  String get message495 => 'Penagihan';

  @override
  String get message496 => 'Pembantu / Lantai';

  @override
  String get message497 => 'Tidak ada tugas operasional untuk filter ini.';
}
