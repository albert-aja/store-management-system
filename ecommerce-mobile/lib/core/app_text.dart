import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

// Static, typed UI messages. Catalog and customer data are never translated.
class AppText {
  static String shareSnapshot(BuildContext? context) =>
      isEnglish(context) ? 'Share 30-day snapshot' : 'Bagikan snapshot 30 hari';
  static String sharedWishlist(BuildContext? context) =>
      isEnglish(context) ? 'Shared wishlist' : 'Wishlist bersama';
  static String snapshotPrivacy(BuildContext? context) => isEnglish(context)
      ? 'Anyone with the link can view this fixed 30-day snapshot. No identity, private notes, or prices are shared. Clearing guest session/cache loses revocation access, not the snapshot.'
      : 'Siapa pun dengan tautan dapat melihat snapshot tetap selama 30 hari. Identitas, catatan pribadi, dan harga tidak dibagikan. Menghapus sesi/cache tamu menghilangkan akses pencabutan, bukan snapshot.';
  static String giftIntentInfo(BuildContext? context) => isEnglish(context)
      ? 'One whole item per claim. Anonymous gift intent only — not a verified purchase, payment, or stock hold. View product details for current prices. Keep your private cancellation key; clearing device data loses it.'
      : 'Satu barang utuh per klaim. Hanya niat hadiah anonim — bukan pembelian terverifikasi, pembayaran, atau penahanan stok. Lihat detail produk untuk harga terkini. Simpan kunci pembatalan pribadi; penghapusan data perangkat menghilangkannya.';
  static String activeSnapshots(BuildContext? context) => isEnglish(context)
      ? 'Manage shared snapshots'
      : 'Kelola snapshot bersama';
  static String revokeSnapshot(BuildContext? context) =>
      isEnglish(context) ? 'Revoke link' : 'Cabut tautan';
  static String revokedSnapshot(BuildContext? context) =>
      isEnglish(context) ? 'Revoked' : 'Dicabut';
  static String snapshotExpires(BuildContext? context, DateTime date) =>
      isEnglish(context)
      ? 'Expires: ${DateFormat.yMMMd('en').add_jm().format(date.toLocal())}'
      : 'Berlaku hingga: ${DateFormat.yMMMd('id').add_Hm().format(date.toLocal())}';
  static String copyShareLink(BuildContext? context) =>
      isEnglish(context) ? 'Copy link' : 'Salin tautan';
  static String shareLink(BuildContext? context) =>
      isEnglish(context) ? 'Share link' : 'Bagikan tautan';
  static String copiedShareLink(BuildContext? context) =>
      isEnglish(context) ? 'Link copied' : 'Tautan disalin';
  static String shareConfigurationMissing(BuildContext? context) =>
      isEnglish(context)
      ? 'Sharing is not configured. Set PUBLIC_STOREFRONT_URL to the deployed HTTPS storefront origin.'
      : 'Berbagi belum dikonfigurasi. Atur PUBLIC_STOREFRONT_URL ke origin HTTPS storefront yang telah diterapkan.';
  static String snapshotExpired(BuildContext? context) => isEnglish(context)
      ? 'This snapshot has expired.'
      : 'Snapshot ini sudah kedaluwarsa.';
  static String snapshotUnavailable(BuildContext? context) => isEnglish(context)
      ? 'This link is invalid, revoked, or expired.'
      : 'Tautan tidak valid, dicabut, atau kedaluwarsa.';
  static String shareOperationFailed(BuildContext? context) =>
      isEnglish(context)
      ? 'Unable to complete the action or refresh server state. Please retry.'
      : 'Tindakan atau pemuatan ulang status server gagal. Silakan coba lagi.';
  static String shareConflict(BuildContext? context) => isEnglish(context)
      ? 'The item state changed. Refresh before trying again.'
      : 'Status barang berubah. Muat ulang sebelum mencoba lagi.';
  static String clipboardFailed(BuildContext? context) => isEnglish(context)
      ? 'Could not copy to clipboard. Select and copy the text manually.'
      : 'Gagal menyalin ke papan klip. Pilih dan salin teks secara manual.';
  static String shareSheetFailed(BuildContext? context) => isEnglish(context)
      ? 'The share sheet is unavailable. Copy the link instead.'
      : 'Menu berbagi tidak tersedia. Salin tautan sebagai gantinya.';
  static String claimGiftIntent(BuildContext? context) =>
      isEnglish(context) ? 'Claim gift intent' : 'Klaim niat hadiah';
  static String giftIntentReserved(BuildContext? context) =>
      isEnglish(context) ? 'Gift intent claimed' : 'Niat hadiah diklaim';
  static String cancelGiftIntent(BuildContext? context) =>
      isEnglish(context) ? 'Cancel my intent' : 'Batalkan niat saya';
  static String recoveryKey(BuildContext? context) => isEnglish(context)
      ? 'Private cancellation key'
      : 'Kunci pembatalan pribadi';
  static String keyStorageFailed(BuildContext? context) => isEnglish(context)
      ? 'The server accepted your intent, but this device could not save the cancellation key. Copy it privately now. Do not include it in a shared link.'
      : 'Server menerima niat Anda, tetapi perangkat gagal menyimpan kunci pembatalan. Salin secara pribadi sekarang. Jangan sertakan dalam tautan bersama.';
  static String keyReadFailed(BuildContext? context) => isEnglish(context)
      ? 'Could not read private cancellation keys. Use your recovery key or retry.'
      : 'Gagal membaca kunci pembatalan pribadi. Gunakan kunci pemulihan atau coba lagi.';
  static String useRecoveryKey(BuildContext? context) => isEnglish(context)
      ? 'Cancel with private key'
      : 'Batalkan dengan kunci pribadi';
  static String missingCancellationKey(BuildContext? context) =>
      isEnglish(context)
      ? 'A private cancellation key is required. No cancellation was sent.'
      : 'Kunci pembatalan pribadi diperlukan. Pembatalan tidak dikirim.';
  static String copyPrivateKey(BuildContext? context) =>
      isEnglish(context) ? 'Copy private key' : 'Salin kunci pribadi';
  static String privateKeyCopied(BuildContext? context) =>
      isEnglish(context) ? 'Private key copied' : 'Kunci pribadi disalin';
  static String viewCurrentProduct(BuildContext? context) =>
      isEnglish(context) ? 'View current product' : 'Lihat produk terkini';
  static String paymentHistorySummary(BuildContext context) =>
      isEnglish(context)
      ? 'Transactions and payment receipts'
      : 'Daftar transaksi dan bukti bayar';
  static String helpAndCustomerCare(BuildContext context) => isEnglish(context)
      ? 'Help Center & Customer Care'
      : 'Pusat Bantuan & Customer Care';
  static String securityAndPrivacy(BuildContext context) => isEnglish(context)
      ? 'Security & Privacy Policy'
      : 'Keamanan & Kebijakan Privasi';
  static String unableToContactTheSignIn(BuildContext? context) =>
      isEnglish(context)
      ? 'Unable to contact the sign-in server. Please try again.'
      : 'Tidak dapat menghubungi server login. Silakan coba lagi.';
  static String signInFailedPleaseTryAgain(BuildContext? context) =>
      isEnglish(context)
      ? 'Sign-in failed. Please try again.'
      : 'Login gagal. Silakan coba lagi.';
  static String continueWithGoogle(BuildContext? context) =>
      isEnglish(context) ? 'Continue with Google' : 'Lanjutkan dengan Google';
  static String orUseEmail(BuildContext? context) =>
      isEnglish(context) ? 'or use email' : 'atau gunakan email';
  static String emailAddress(BuildContext? context) =>
      isEnglish(context) ? 'Email Address' : 'Alamat Email';
  static String enterAValidEmailAddress(BuildContext? context) =>
      isEnglish(context)
      ? 'Enter a valid email address.'
      : 'Masukkan email yang valid.';
  static String codeSentToCheckYourInbox(
    BuildContext? context,
    Object? value0,
  ) => isEnglish(context)
      ? 'Code sent to ${formatArgument(context, value0)}. Check your inbox or spam folder.'
      : 'Kode dikirim ke ${formatArgument(context, value0)}. Periksa kotak masuk atau spam.';
  static String otpCode(BuildContext? context) =>
      isEnglish(context) ? 'OTP Code' : 'Kode OTP';
  static String enterTheOtpCodeFromYour(BuildContext? context) =>
      isEnglish(context)
      ? 'Enter the OTP code from your email.'
      : 'Masukkan kode OTP dari email.';
  static String processing(BuildContext? context) =>
      isEnglish(context) ? 'Processing...' : 'Memproses...';
  static String sendOtpCode(BuildContext? context) =>
      isEnglish(context) ? 'Send OTP Code' : 'Kirim Kode OTP';
  static String verifySignIn(BuildContext? context) =>
      isEnglish(context) ? 'Verify & Sign In' : 'Verifikasi & Masuk';
  static String resendS(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Resend (${formatArgument(context, value0)}s)'
      : 'Kirim ulang (${formatArgument(context, value0)}s)';
  static String resendCode(BuildContext? context) =>
      isEnglish(context) ? 'Resend code' : 'Kirim ulang kode';
  static String changeEmail(BuildContext? context) =>
      isEnglish(context) ? 'Change email' : 'Ganti email';
  static String yourEmailIsVerifiedBeforeYour(BuildContext? context) =>
      isEnglish(context)
      ? 'Your email is verified before your account is activated.'
      : 'Email diverifikasi sebelum akun digunakan.';
  static String account(BuildContext? context) =>
      isEnglish(context) ? 'Account' : 'Akun';
  static String signInToSmsMart(BuildContext? context) =>
      isEnglish(context) ? 'Sign in to SMS Mart' : 'Masuk ke SMS Mart';
  static String signInOrRegisterWithGoogle(BuildContext? context) =>
      isEnglish(context)
      ? 'Sign in or register with Google or an email code. No password needed.'
      : 'Masuk atau daftar dengan Google atau kode email. Tanpa kata sandi.';
  static String shoppingCart(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Shopping Cart (${formatArgument(context, value0)})'
      : 'Keranjang Belanja (${formatArgument(context, value0)})';
  static String yourShoppingCartIsEmpty(BuildContext? context) =>
      isEnglish(context)
      ? 'Your Shopping Cart Is Empty'
      : 'Keranjang Belanja Masih Kosong';
  static String findYourFavoriteProductsInThe(BuildContext? context) =>
      isEnglish(context)
      ? 'Find your favorite products in the SMS catalog'
      : 'Temukan berbagai barang impian Anda di katalog SMS';
  static String startShopping(BuildContext? context) =>
      isEnglish(context) ? 'Start Shopping' : 'Mulai Belanja';
  static String inStock(BuildContext? context) =>
      isEnglish(context) ? 'In Stock' : 'Ready Stock';
  static String preorderPo(BuildContext? context) =>
      isEnglish(context) ? 'Preorder / PO' : 'Indent / PO';
  static String subtotal(BuildContext? context) =>
      isEnglish(context) ? 'Subtotal' : 'Subtotal';
  static String productDiscount(BuildContext? context) =>
      isEnglish(context) ? 'Product discount' : 'Diskon produk';
  static String volumeBundleDiscount(BuildContext? context) =>
      isEnglish(context)
      ? 'Volume / bundle discount'
      : 'Diskon volume / bundel';
  static String vat(BuildContext? context) =>
      isEnglish(context) ? 'VAT 11%' : 'PPN 11%';
  static String totalPayment(BuildContext? context) =>
      isEnglish(context) ? 'Total Payment' : 'Total Pembayaran';
  static String proceedToPayment(BuildContext? context) =>
      isEnglish(context) ? 'Proceed to Payment' : 'Lanjut ke Pembayaran';
  static String productCatalog(BuildContext? context) =>
      isEnglish(context) ? 'Product Catalog' : 'Katalog Produk';
  static String wishlist(BuildContext? context) =>
      isEnglish(context) ? 'Wishlist' : 'Wishlist';
  static String cart(BuildContext? context) =>
      isEnglish(context) ? 'Cart' : 'Keranjang';
  static String searchElectronicsFurniture(BuildContext? context) =>
      isEnglish(context)
      ? 'Search electronics & furniture'
      : 'Cari elektronik & furniture';
  static String clearSearch(BuildContext? context) =>
      isEnglish(context) ? 'Clear search' : 'Hapus pencarian';
  static String category(BuildContext? context) =>
      isEnglish(context) ? 'Category' : 'Kategori';
  static String all(BuildContext? context) =>
      isEnglish(context) ? 'All' : 'Semua';
  static String sort(BuildContext? context) =>
      isEnglish(context) ? 'Sort' : 'Urutkan';
  static String recommended(BuildContext? context) =>
      isEnglish(context) ? 'Recommended' : 'Rekomendasi';
  static String lowestPrice(BuildContext? context) =>
      isEnglish(context) ? 'Lowest price' : 'Termurah';
  static String highestPrice(BuildContext? context) =>
      isEnglish(context) ? 'Highest price' : 'Termahal';
  static String preorder(BuildContext? context) =>
      isEnglish(context) ? 'Preorder' : 'Indent';
  static String noMatchingProducts(BuildContext? context) => isEnglish(context)
      ? 'No matching products'
      : 'Tidak ada produk yang cocok';
  static String tryAnotherKeywordOrCategory(BuildContext? context) =>
      isEnglish(context)
      ? 'Try another keyword or category.'
      : 'Coba kata kunci atau kategori lain.';
  static String unableToLoadCatalog(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Unable to load catalog: ${formatArgument(context, value0)}'
      : 'Gagal memuat katalog: ${formatArgument(context, value0)}';
  static String checkoutOrderConfirmation(BuildContext? context) =>
      isEnglish(context)
      ? 'Checkout & Order Confirmation'
      : 'Checkout & Konfirmasi Pesanan';
  static String contactRecipient(BuildContext? context) =>
      isEnglish(context) ? '1. Contact & Recipient' : '1. Kontak & Penerima';
  static String fullName(BuildContext? context) =>
      isEnglish(context) ? 'Full Name' : 'Nama Lengkap';
  static String whatsappMobileNumber(BuildContext? context) =>
      isEnglish(context) ? 'WhatsApp / Mobile Number' : 'Nomor WhatsApp / HP';
  static String deliveryOrPickup(BuildContext? context) => isEnglish(context)
      ? '2. Delivery or Pickup'
      : '2. Pengiriman atau Pengambilan';
  static String storeFleetDelivery(BuildContext? context) =>
      isEnglish(context) ? 'Store Fleet Delivery' : 'Kirim Armada Toko';
  static String deliveredDirectlyByAnSmsMart(BuildContext? context) =>
      isEnglish(context)
      ? 'Delivered directly by an SMS Mart driver'
      : 'Diantar langsung driver SMS Mart';
  static String branchPickup(BuildContext? context) =>
      isEnglish(context) ? 'Branch Pickup' : 'Ambil di Cabang';
  static String noDeliveryFeeAtYourNearest(BuildContext? context) =>
      isEnglish(context)
      ? 'No delivery fee at your nearest store'
      : 'Bebas ongkir di toko terdekat';
  static String fullDeliveryAddress(BuildContext? context) => isEnglish(context)
      ? 'Full Delivery Address'
      : 'Alamat Pengantaran Lengkap';
  static String fulfillmentPreference(BuildContext? context) =>
      isEnglish(context)
      ? '3. Fulfillment Preference'
      : '3. Kelengkapan Pengiriman';
  static String partialDelivery(BuildContext? context) =>
      isEnglish(context) ? 'Partial Delivery' : 'Kirim Bertahap';
  static String deliverInStockItemsFirstPreorders(BuildContext? context) =>
      isEnglish(context)
      ? 'Deliver in-stock items first, preorders later'
      : 'Kirim barang ready dulu, indent menyusul';
  static String completeDelivery(BuildContext? context) =>
      isEnglish(context) ? 'Complete Delivery' : 'Kirim Sekaligus';
  static String waitUntilAllItemsAreAvailable(BuildContext? context) =>
      isEnglish(context)
      ? 'Wait until all items are available at the warehouse'
      : 'Tunggu semua barang lengkap di gudang';
  static String procurementAuthorizationDepositFirst(BuildContext? context) =>
      isEnglish(context)
      ? 'Procurement Authorization (Deposit First)'
      : 'Aturan Otorisasi Pengadaan (Deposit-First)';
  static String yourOrderContainsPreorderedProductsA(
    BuildContext? context,
    Object? value0,
  ) => isEnglish(context)
      ? 'Your order contains preordered products. A supplier purchase order (PO) is issued only after a minimum 30% deposit (${formatArgument(context, value0)}) is confirmed.'
      : 'Pesanan Anda berisi produk Indent. Surat Pemesanan (PO) ke pemasok baru akan diterbitkan setelah uang muka minimal 30% (${formatArgument(context, value0)}) terkonfirmasi.';
  static String paymentMethod(BuildContext? context) =>
      isEnglish(context) ? '4. Payment Method' : '4. Metode Pembayaran';
  static String surveyRequired(BuildContext? context) =>
      isEnglish(context) ? 'Survey Required' : 'Perlu Survei';
  static String billingSummary(BuildContext? context) =>
      isEnglish(context) ? '5. Billing Summary' : '5. Ringkasan Tagihan';
  static String itemsSubtotal(BuildContext? context) =>
      isEnglish(context) ? 'Items Subtotal' : 'Subtotal Barang';
  static String totalOrderValue(BuildContext? context) =>
      isEnglish(context) ? 'Total Order Value' : 'Total Nilai Pesanan';
  static String dueNowDeposit(BuildContext? context) => isEnglish(context)
      ? 'Due Now (30% Deposit)'
      : 'Wajib Bayar Sekarang (DP 30%)';
  static String unableToCreateOrder(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Unable to create order: ${formatArgument(context, value0)}'
      : 'Gagal membuat pesanan: ${formatArgument(context, value0)}';
  static String placeOrderPay(BuildContext? context) =>
      isEnglish(context) ? 'Place Order & Pay' : 'Buat Pesanan & Bayar';
  static String smsMart(BuildContext? context) =>
      isEnglish(context) ? 'SMS Mart' : 'SMS Mart';
  static String retailLiving(BuildContext? context) =>
      isEnglish(context) ? 'Retail & Living' : 'Retail & Living';
  static String notifications(BuildContext? context) =>
      isEnglish(context) ? 'Notifications' : 'Notifikasi';
  static String officialWarranty(BuildContext? context) =>
      isEnglish(context) ? 'Official warranty' : 'Garansi resmi';
  static String homeDelivery(BuildContext? context) =>
      isEnglish(context) ? 'Home delivery' : 'Kirim ke rumah';
  static String storePickup(BuildContext? context) =>
      isEnglish(context) ? 'Store pickup' : 'Ambil di toko';
  static String featuredCategories(BuildContext? context) =>
      isEnglish(context) ? 'Featured categories' : 'Kategori pilihan';
  static String flashSale(BuildContext? context) =>
      isEnglish(context) ? 'Flash Sale' : 'Flash Sale';
  static String pickedForYou(BuildContext? context) =>
      isEnglish(context) ? 'Picked for You' : 'Pilihan untuk Anda';
  static String unableToLoadProducts(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Unable to load products: ${formatArgument(context, value0)}'
      : 'Gagal memuat produk: ${formatArgument(context, value0)}';
  static String moreChoicesWithPreorders(BuildContext? context) =>
      isEnglish(context)
      ? 'More choices, with preorders.'
      : 'Lebih banyak pilihan, dengan indent.';
  static String orderDistributorCollectionsWithTransparentDeposits(
    BuildContext? context,
  ) => isEnglish(context)
      ? 'Order distributor collections with transparent deposits.'
      : 'Pesan koleksi dari distributor dengan uang muka transparan.';
  static String viewCollection(BuildContext? context) =>
      isEnglish(context) ? 'View collection' : 'Lihat koleksi';
  static String retailLiving84(BuildContext? context) =>
      isEnglish(context) ? 'RETAIL & LIVING' : 'RETAIL & LIVING';
  static String theRightChoiceForYourHome(BuildContext? context) =>
      isEnglish(context)
      ? 'The right choice for your home.'
      : 'Pilihan tepat untuk rumah Anda.';
  static String selectedElectronicsAndFurnitureOfficialWarranties(
    BuildContext? context,
  ) => isEnglish(context)
      ? 'Selected electronics and furniture. Official warranties, home delivery or store pickup.'
      : 'Elektronik dan furniture pilihan. Garansi resmi, kirim ke rumah atau ambil di toko.';
  static String browseCatalog(BuildContext? context) =>
      isEnglish(context) ? 'Browse Catalog' : 'Jelajahi Katalog';
  static String viewAll(BuildContext? context) =>
      isEnglish(context) ? 'View all' : 'Lihat semua';
  static String home(BuildContext? context) =>
      isEnglish(context) ? 'Home' : 'Beranda';
  static String catalog(BuildContext? context) =>
      isEnglish(context) ? 'Catalog' : 'Katalog';
  static String track(BuildContext? context) =>
      isEnglish(context) ? 'Track' : 'Lacak';
  static String orderNotifications(BuildContext? context) =>
      isEnglish(context) ? 'Order Notifications' : 'Notifikasi Pesanan';
  static String markAllAsRead(BuildContext? context) =>
      isEnglish(context) ? 'Mark All as Read' : 'Tandai Semua Dibaca';
  static String unread(BuildContext? context) =>
      isEnglish(context) ? 'Unread' : 'Belum Dibaca';
  static String payment(BuildContext? context) =>
      isEnglish(context) ? 'Payment' : 'Pembayaran';
  static String deliveryPickup(BuildContext? context) =>
      isEnglish(context) ? 'Delivery / Pickup' : 'Pengiriman / Ambil';
  static String noNotificationsYet(BuildContext? context) =>
      isEnglish(context) ? 'No notifications yet' : 'Belum ada notifikasi';
  static String orderMilestoneNotificationsWillAppearHere(
    BuildContext? context,
  ) => isEnglish(context)
      ? 'Order milestone notifications will appear here.'
      : 'Pemberitahuan milestone pesanan akan muncul di sini.';
  static String trackOrder(BuildContext? context) =>
      isEnglish(context) ? 'Track Order' : 'Lacak Pesanan';
  static String mAgo(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? '${formatArgument(context, value0)}m ago'
      : '${formatArgument(context, value0)}m yang lalu';
  static String hAgo(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? '${formatArgument(context, value0)}h ago'
      : '${formatArgument(context, value0)}j yang lalu';
  static String dAgo(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? '${formatArgument(context, value0)}d ago'
      : '${formatArgument(context, value0)}h yang lalu';
  static String paymentVerifiedMilestoneNotificationSent(
    BuildContext? context,
  ) => isEnglish(context)
      ? 'Payment Verified! Milestone notification sent.'
      : 'Pembayaran Terverifikasi! Notifikasi milestone dikirimkan.';
  static String simulationFailed(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Simulation failed: ${formatArgument(context, value0)}'
      : 'Simulasi gagal: ${formatArgument(context, value0)}';
  static String paymentInstructions(BuildContext? context) =>
      isEnglish(context) ? 'Payment Instructions' : 'Instruksi Pembayaran';
  static String orderPlacedSuccessfully(BuildContext? context) =>
      isEnglish(context)
      ? 'Order Placed Successfully!'
      : 'Pesanan Berhasil Dibuat!';
  static String orderNo(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Order No.: ${formatArgument(context, value0)}'
      : 'No. Pesanan: ${formatArgument(context, value0)}';
  static String paymentConfirmed(BuildContext? context) =>
      isEnglish(context) ? 'PAYMENT CONFIRMED' : 'PEMBAYARAN TERKONFIRMASI';
  static String awaitingPayment(BuildContext? context) =>
      isEnglish(context) ? 'AWAITING PAYMENT' : 'MENUNGGU PEMBAYARAN';
  static String amountDue(BuildContext? context) =>
      isEnglish(context) ? 'Amount Due:' : 'Jumlah Tagihan:';
  static String scanTheNationalQrisCode(BuildContext? context) =>
      isEnglish(context)
      ? 'Scan the National QRIS Code'
      : 'Scan Kode QRIS Nasional';
  static String openBcaMobileGopayOvoShopeepay(BuildContext? context) =>
      isEnglish(context)
      ? 'Open BCA Mobile, GoPay, OVO, ShopeePay, or Livin'
      : 'Buka BCA Mobile, GoPay, OVO, ShopeePay, atau Livin';
  static String virtualAccountNumber(BuildContext? context) =>
      isEnglish(context)
      ? 'Virtual Account Number'
      : 'Nomor Rekening Virtual Account';
  static String vaNumberCopied(BuildContext? context) =>
      isEnglish(context) ? 'VA number copied!' : 'Nomor VA disalin!';
  static String method(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Method: ${formatArgument(context, value0)}'
      : 'Metode: ${formatArgument(context, value0)}';
  static String pleaseCompletePaymentUsingTheInstructions(
    BuildContext? context,
  ) => isEnglish(context)
      ? 'Please complete payment using the instructions for your selected method.'
      : 'Silakan selesaikan pembayaran sesuai petunjuk metode yang dipilih.';
  static String simulateFullPayment(BuildContext? context) => isEnglish(context)
      ? 'Simulate Full Payment'
      : 'Simulasikan Pembayaran Lunas';
  static String fulfillmentGroups(BuildContext? context) => isEnglish(context)
      ? 'Fulfillment Groups'
      : 'Kelompok Pemenuhan (Fulfillment)';
  static String group(BuildContext? context, Object? value0, Object? value1) =>
      isEnglish(context)
      ? 'Group #${formatArgument(context, value0)} (${formatArgument(context, value1)})'
      : 'Kelompok #${formatArgument(context, value0)} (${formatArgument(context, value1)})';
  static String readyToProcess(BuildContext? context) =>
      isEnglish(context) ? 'READY TO PROCESS' : 'SIAP DIPROSES';
  static String awaitingDepositPo(BuildContext? context) =>
      isEnglish(context) ? 'AWAITING DEPOSIT / PO' : 'MENUNGGU DP / PO';
  static String openPickupTicketQrPass(BuildContext? context) =>
      isEnglish(context)
      ? 'Open Pickup Ticket (QR Pass)'
      : 'Buka Tiket Pengambilan (QR Pass)';
  static String backToStore(BuildContext? context) =>
      isEnglish(context) ? 'Back to Store' : 'Kembali ke Toko';
  static String orderWasNotFoundInThe(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Order "${formatArgument(context, value0)}" was not found in the system.'
      : 'Pesanan "${formatArgument(context, value0)}" tidak ditemukan di sistem.';
  static String unableToTrackOrder(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Unable to track order: ${formatArgument(context, value0)}'
      : 'Terjadi kesalahan saat melacak pesanan: ${formatArgument(context, value0)}';
  static String salesOrderSoNumber(BuildContext? context) => isEnglish(context)
      ? 'Sales Order (SO) Number'
      : 'Nomor Pesanan Sales Order (SO)';
  static String exampleSoApp(BuildContext? context) =>
      isEnglish(context) ? 'Example: SO-APP-123456' : 'Misal: SO-APP-123456';
  static String paidDepositReceived(BuildContext? context) =>
      isEnglish(context) ? 'PAID / DEPOSIT RECEIVED' : 'LUNAS / DP SUDAH BAYAR';
  static String recipient(
    BuildContext? context,
    Object? value0,
    Object? value1,
  ) => isEnglish(context)
      ? 'Recipient: ${formatArgument(context, value0)} (${formatArgument(context, value1)})'
      : 'Penerima: ${formatArgument(context, value0)} (${formatArgument(context, value1)})';
  static String totalValue(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Total Value: ${formatArgument(context, value0)}'
      : 'Total Nilai: ${formatArgument(context, value0)}';
  static String fulfillmentPreference131(
    BuildContext? context,
    Object? value0,
  ) => isEnglish(context)
      ? 'Fulfillment Preference: ${formatArgument(context, value0)}'
      : 'Preferensi Pemenuhan: ${formatArgument(context, value0)}';
  static String fulfillmentProgress(BuildContext? context) =>
      isEnglish(context) ? 'Fulfillment Progress' : 'Status Alur Pemenuhan';
  static String orderReceived(BuildContext? context) =>
      isEnglish(context) ? 'Order Received' : 'Pesanan Diterima';
  static String salesOrderRecordedInTheBackend(BuildContext? context) =>
      isEnglish(context)
      ? 'Sales order recorded in the backend\'s single source of truth.'
      : 'Sales Order tercatat di Single Source of Truth backend.';
  static String paymentAuthorizationDepositFull(BuildContext? context) =>
      isEnglish(context)
      ? 'Payment Authorization (Deposit / Full)'
      : 'Otorisasi Pembayaran (DP / Lunas)';
  static String paymentVerifiedProcurementIsAuthorized(BuildContext? context) =>
      isEnglish(context)
      ? 'Payment verified. Procurement is authorized.'
      : 'Pembayaran terverifikasi. Pengadaan resmi diizinkan.';
  static String awaitingCustomerPaymentDeposit(BuildContext? context) =>
      isEnglish(context)
      ? 'Awaiting customer payment/deposit.'
      : 'Menunggu pelunasan/deposit customer.';
  static String stockPreparationPreorderProcurement(BuildContext? context) =>
      isEnglish(context)
      ? 'Stock Preparation & Preorder Procurement'
      : 'Penyiapan Stok & Pengadaan Indent';
  static String theWarehouseTeamPreparesInStock(BuildContext? context) =>
      isEnglish(context)
      ? 'The warehouse team prepares in-stock items and issues purchase orders.'
      : 'Armada gudang menyiapkan barang ready & menerbitkan PO.';
  static String deliveryBranchPickup(BuildContext? context) =>
      isEnglish(context)
      ? 'Delivery / Branch Pickup'
      : 'Pengiriman / Pengambilan Cabang';
  static String deliveredByAnSmsMartDriver(BuildContext? context) =>
      isEnglish(context)
      ? 'Delivered by an SMS Mart driver or ready for showroom pickup.'
      : 'Diantar driver SMS Mart atau siap diambil di showroom.';
  static String deliveryGroupDetailsFulfillmentGroups(BuildContext? context) =>
      isEnglish(context)
      ? 'Delivery Group Details (Fulfillment Groups)'
      : 'Rincian Kelompok Pengiriman (Fulfillment Groups)';
  static String group143(
    BuildContext? context,
    Object? value0,
    Object? value1,
  ) => isEnglish(context)
      ? 'Group #${formatArgument(context, value0)} • ${formatArgument(context, value1)}'
      : 'Kelompok #${formatArgument(context, value0)} • ${formatArgument(context, value1)}';
  static String preorder144(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Preorder (${formatArgument(context, value0)})'
      : 'Indent (${formatArgument(context, value0)})';
  static String openPickupTicketPickupPassQr(BuildContext? context) =>
      isEnglish(context)
      ? 'Open Pickup Ticket (Pickup Pass & QR)'
      : 'Buka Tiket Pengambilan (Pickup Pass & QR)';
  static String unableToLoadShowroomPickupTicket(
    BuildContext? context,
    Object? value0,
  ) => isEnglish(context)
      ? 'Unable to load showroom pickup ticket: ${formatArgument(context, value0)}'
      : 'Gagal memuat tiket pengambilan showroom: ${formatArgument(context, value0)}';
  static String itemsStagedOnTheShowroomRack(BuildContext? context) =>
      isEnglish(context)
      ? 'Items staged on the showroom rack and ready for customer pickup!'
      : 'Barang berhasil distaging di rak showroom & siap diambil pelanggan!';
  static String unableToStageItems(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Unable to stage items: ${formatArgument(context, value0)}'
      : 'Gagal melakukan staging: ${formatArgument(context, value0)}';
  static String handoverVerifiedTheOrderIsNow(BuildContext? context) =>
      isEnglish(context)
      ? 'Handover verified! The order is now completed.'
      : 'Verifikasi serah terima sukses! Status pesanan kini COMPLETED.';
  static String unableToVerifyHandover(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Unable to verify handover: ${formatArgument(context, value0)}'
      : 'Gagal verifikasi serah terima: ${formatArgument(context, value0)}';
  static String showroomPickupTicket(BuildContext? context) =>
      isEnglish(context)
      ? 'Showroom Pickup Ticket'
      : 'Tiket Pengambilan Showroom';
  static String refresh(BuildContext? context) =>
      isEnglish(context) ? 'Refresh' : 'Segarkan';
  static String pickupTicketNotFound(BuildContext? context) =>
      isEnglish(context)
      ? 'Pickup ticket not found'
      : 'Data tiket tidak ditemukan';
  static String orderPickupCompleted(BuildContext? context) =>
      isEnglish(context)
      ? 'Order Pickup Completed'
      : 'Pesanan Sudah Selesai Diambil';
  static String readyForShowroomPickup(BuildContext? context) =>
      isEnglish(context)
      ? 'Ready for Showroom Pickup'
      : 'Siap Diambil di Showroom';
  static String beingPreparedAtTheStore(BuildContext? context) =>
      isEnglish(context)
      ? 'Being Prepared at the Store'
      : 'Dalam Penyiapan Staging Toko';
  static String handedOverBy(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Handed over by ${formatArgument(context, value0)}'
      : 'Diserahkan oleh ${formatArgument(context, value0)}';
  static String rackLocation(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Rack Location: ${formatArgument(context, value0)}'
      : 'Lokasi Rak: ${formatArgument(context, value0)}';
  static String showroomStaffArePreparingYourItems(BuildContext? context) =>
      isEnglish(context)
      ? 'Showroom staff are preparing your items in the staging area'
      : 'Barang sedang disiapkan petugas showroom di area staging';
  static String officialPickupTicket(BuildContext? context) =>
      isEnglish(context) ? 'OFFICIAL PICKUP TICKET' : 'TIKET PENGAMBILAN RESMI';
  static String pickupCodeCopied(BuildContext? context) =>
      isEnglish(context) ? 'Pickup code copied!' : 'Kode pengambilan disalin!';
  static String copyCode(BuildContext? context) =>
      isEnglish(context) ? 'Copy Code' : 'Salin Kode';
  static String showThisQrCodeOrGive(BuildContext? context) =>
      isEnglish(context)
      ? 'Show this QR code or give the code above to the showroom cashier when collecting your items.'
      : 'Tunjukkan kode QR ini atau sebutkan kode di atas kepada petugas kasir showroom saat pengambilan barang.';
  static String phone(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Phone: ${formatArgument(context, value0)}'
      : 'Telp: ${formatArgument(context, value0)}';
  static String depositPaid(BuildContext? context) =>
      isEnglish(context) ? 'Deposit Paid' : 'Uang Muka Terbayar';
  static String balanceDueAtCheckout(BuildContext? context) =>
      isEnglish(context) ? 'Balance Due at Checkout' : 'Sisa Tagihan di Kasir';
  static String paidInFullRp(BuildContext? context) =>
      isEnglish(context) ? 'PAID IN FULL (Rp 0)' : 'LUNAS (Rp 0)';
  static String storeStaffOperationsSimulationDemo(BuildContext? context) =>
      isEnglish(context)
      ? 'Store Staff Operations Simulation (Demo)'
      : 'Simulasi Operasional Staf Toko (Demo)';
  static String showroomStagingRackLocation(BuildContext? context) =>
      isEnglish(context)
      ? 'Showroom Staging Rack Location'
      : 'Lokasi Rak Staging Showroom';
  static String markReadyForPickupStagingComplete(BuildContext? context) =>
      isEnglish(context)
      ? 'Mark Ready for Pickup (Staging Complete)'
      : 'Tandai Siap Ambil (Staging Selesai)';
  static String cashierHandoverStaffName(BuildContext? context) =>
      isEnglish(context)
      ? 'Cashier / Handover Staff Name'
      : 'Nama Kasir / Petugas Handover';
  static String verifyHandoverComplete(BuildContext? context) =>
      isEnglish(context)
      ? 'Verify Handover (Complete)'
      : 'Verifikasi Serah Terima (Handover Selesai)';
  static String itemsHaveBeenHandedOverTo(BuildContext? context) =>
      isEnglish(context)
      ? 'Items have been handed over to the customer. The pickup cycle is complete.'
      : 'Barang telah diserahterimakan kepada pelanggan. Siklus penjemputan selesai.';
  static String productDetails(BuildContext? context) =>
      isEnglish(context) ? 'Product Details' : 'Detail Produk';
  static String saveToWishlist(BuildContext? context) =>
      isEnglish(context) ? 'Save to Wishlist' : 'Simpan ke Wishlist';
  static String savedToWishlist(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? '${formatArgument(context, value0)} saved to Wishlist!'
      : '${formatArgument(context, value0)} berhasil disimpan ke Wishlist!';
  static String removedFromWishlist(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? '${formatArgument(context, value0)} removed from Wishlist.'
      : '${formatArgument(context, value0)} dihapus dari Wishlist.';
  static String inStockAtTheShowroom(BuildContext? context) =>
      isEnglish(context)
      ? 'In Stock at the Showroom'
      : 'Ready Stock di Showroom';
  static String preorderProcurementRequired(BuildContext? context) =>
      isEnglish(context)
      ? 'Preorder Procurement Required'
      : 'Indent Pengadaan Diperlukan';
  static String readyForDeliveryTodayStorePickup(BuildContext? context) =>
      isEnglish(context)
      ? 'Ready for delivery today / store pickup'
      : 'Siap dikirim hari ini / siap diambil di toko';
  static String estimatedArrivalInBusinessDaysMinimum(
    BuildContext? context,
    Object? value0,
  ) => isEnglish(context)
      ? 'Estimated arrival in ${formatArgument(context, value0)} business days (minimum 30% deposit for PO)'
      : 'Estimasi kedatangan ${formatArgument(context, value0)} hari kerja (DP min. 30% untuk PO)';
  static String productDescription(BuildContext? context) =>
      isEnglish(context) ? 'Product Description' : 'Deskripsi Produk';
  static String ourDedicatedStoreFleetEnsuresYour(BuildContext? context) =>
      isEnglish(context)
      ? 'Our dedicated store fleet ensures your items arrive safely.'
      : 'Pengiriman armada khusus toko menjamin barang aman sampai tujuan.';
  static String collectDirectlyAtYourChosenStore(BuildContext? context) =>
      isEnglish(context)
      ? 'Collect directly at your chosen store branch with no delivery fee.'
      : 'Dapat diambil langsung di cabang toko pilihan tanpa biaya antar.';
  static String quantity(BuildContext? context) =>
      isEnglish(context) ? 'Quantity:' : 'Jumlah:';
  static String itemSAddedToCart(
    BuildContext? context,
    Object? value0,
    Object? value1,
  ) => isEnglish(context)
      ? '${formatArgument(context, value0)} ${formatArgument(context, value1)} item(s) added to cart!'
      : '${formatArgument(context, value0)} item ${formatArgument(context, value1)} masuk keranjang!';
  static String addToCart(BuildContext? context) =>
      isEnglish(context) ? 'Add to Cart' : 'Tambah Keranjang';
  static String buyNow(BuildContext? context) =>
      isEnglish(context) ? 'Buy Now' : 'Beli Sekarang';
  static String myAccount(BuildContext? context) =>
      isEnglish(context) ? 'My Account' : 'Akun Saya';
  static String notSignedIn(BuildContext? context) =>
      isEnglish(context) ? 'Not signed in' : 'Belum masuk';
  static String signInWithGoogleOrAn(BuildContext? context) =>
      isEnglish(context)
      ? 'Sign in with Google or an email code'
      : 'Masuk dengan Google atau kode email';
  static String emailVerified(BuildContext? context) =>
      isEnglish(context) ? 'Email Verified' : 'Email Terverifikasi';
  static String signInRegister(BuildContext? context) =>
      isEnglish(context) ? 'Sign In / Register' : 'Masuk / Daftar';
  static String signOut(BuildContext? context) =>
      isEnglish(context) ? 'Sign Out' : 'Keluar';
  static String storeInstallmentFacility(BuildContext? context) =>
      isEnglish(context)
      ? 'Store Installment Facility'
      : 'Fasilitas Cicilan Toko';
  static String availableLimitRp(BuildContext? context) => isEnglish(context)
      ? 'Available Limit: Rp 15,000,000'
      : 'Limit Tersedia: Rp 15.000.000';
  static String usedBalanceRpApprovedThroughAn(BuildContext? context) =>
      isEnglish(context)
      ? 'Used Balance: Rp 0 • Approved through an in-person survey'
      : 'Saldo Terpakai: Rp 0 • Disetujui melalui survei fisik';
  static String wishlistSavedProducts(BuildContext? context) =>
      isEnglish(context)
      ? 'Wishlist & Saved Products'
      : 'Wishlist & Produk Disimpan';
  static String viewYourFavoritesAndMonitorPrice(BuildContext? context) =>
      isEnglish(context)
      ? 'View your favorites and monitor price drops'
      : 'Lihat barang impian dan pantau penurunan harga';
  static String deliveryAddressBook(BuildContext? context) =>
      isEnglish(context) ? 'Delivery Address Book' : 'Buku Alamat Pengantaran';
  static String manageHomeAndOfficeAddresses(BuildContext? context) =>
      isEnglish(context)
      ? 'Manage home and office addresses'
      : 'Kelola alamat rumah dan kantor';
  static String paymentBillingHistory(BuildContext? context) =>
      isEnglish(context)
      ? 'Payment & Billing History'
      : 'Riwayat Pembayaran & Tagihan';
  static String checkDepositsFullPaymentsAndInstallments(
    BuildContext? context,
  ) => isEnglish(context)
      ? 'Check deposits, full payments, and installments'
      : 'Cek pembayaran DP, pelunasan, dan angsuran';
  static String helpCenter(BuildContext? context) =>
      isEnglish(context) ? 'Help Center' : 'Pusat Bantuan';
  static String contactTheSmsMartSupportTeam(BuildContext? context) =>
      isEnglish(context)
      ? 'Contact the SMS Mart support team'
      : 'Hubungi tim layanan SMS Mart';
  static String settingsPolicies(BuildContext? context) =>
      isEnglish(context) ? 'Settings & Policies' : 'Pengaturan & Kebijakan';
  static String accountAndPrivacyInformation(BuildContext? context) =>
      isEnglish(context)
      ? 'Account and privacy information'
      : 'Informasi akun dan privasi';
  static String wishlistSaved(BuildContext? context) =>
      isEnglish(context) ? 'Wishlist & Saved' : 'Wishlist & Tersimpan';
  static String syncedAcrossWebMobile(BuildContext? context) =>
      isEnglish(context)
      ? 'Synced Across Web & Mobile'
      : 'Tersinkronisasi Web & Mobile';
  static String refreshWishlist(BuildContext? context) =>
      isEnglish(context) ? 'Refresh Wishlist' : 'Segarkan Wishlist';
  static String priceDrop(BuildContext? context) =>
      isEnglish(context) ? 'PRICE DROP!' : 'HARGA TURUN!';
  static String totalSavings(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Total Savings: ${formatArgument(context, value0)}'
      : 'Total Hemat: ${formatArgument(context, value0)}';
  static String productsInYourWishlistHaveDropped(
    BuildContext? context,
    Object? value0,
  ) => isEnglish(context)
      ? '${formatArgument(context, value0)} products in your wishlist have dropped in price!'
      : 'Ada ${formatArgument(context, value0)} produk di wishlist Anda yang sedang turun harga!';
  static String pricesAreLowerThanWhenYou(BuildContext? context) =>
      isEnglish(context)
      ? 'Prices are lower than when you first saved them. Check out before the offer ends.'
      : 'Harga lebih hemat dari saat pertama kali disimpan. Segera checkout sebelum promo berakhir.';
  static String saved(BuildContext? context) =>
      isEnglish(context) ? 'Saved' : 'Tersimpan';
  static String cloudSync(BuildContext? context) =>
      isEnglish(context) ? 'Cloud Sync' : 'Cloud Sync';
  static String webMobile(BuildContext? context) =>
      isEnglish(context) ? 'Web & Mobile' : 'Web & Mobile';
  static String preorderDays(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Preorder ${formatArgument(context, value0)} Days'
      : 'Indent ${formatArgument(context, value0)} Hari';
  static String save(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Save ${formatArgument(context, value0)}'
      : 'Hemat ${formatArgument(context, value0)}';
  static String moveToCart(BuildContext? context) =>
      isEnglish(context) ? 'Move to Cart' : 'Pindah ke Keranjang';
  static String movedToCart(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? '${formatArgument(context, value0)} moved to cart!'
      : '${formatArgument(context, value0)} dipindahkan ke keranjang!';
  static String simulateDiscount(BuildContext? context) =>
      isEnglish(context) ? 'Simulate Discount' : 'Simulasi Diskon';
  static String priceDropSimulationAppliedSuccessfully(BuildContext? context) =>
      isEnglish(context)
      ? 'Price drop simulation applied successfully!'
      : 'Simulasi penurunan harga berhasil diterapkan!';
  static String yourWishlistIsEmpty(BuildContext? context) => isEnglish(context)
      ? 'Your Wishlist Is Empty'
      : 'Wishlist Anda Masih Kosong';
  static String saveYourFavoriteTvsFridgesSofas(BuildContext? context) =>
      isEnglish(context)
      ? 'Save your favorite TVs, fridges, sofas, and furniture to automatically monitor price drops.'
      : 'Simpan TV, kulkas, sofa, dan perabotan favorit Anda untuk memantau penurunan harga otomatis.';
  static String exploreProducts(BuildContext? context) =>
      isEnglish(context) ? 'Explore Products' : 'Jelajahi Produk';
  static String pThisWishlistAutomaticallySyncsWith(BuildContext? context) =>
      isEnglish(context)
      ? 'P.16: This wishlist automatically syncs with your web session. Notifications are sent automatically when prices drop.'
      : 'P.16: Wishlist ini tersinkronisasi otomatis dengan sesi web Anda. Notifikasi otomatis dikirim saat harga turun.';
  static String signInToManageYourDeliveries(BuildContext? context) =>
      isEnglish(context)
      ? 'Sign in to manage your deliveries.'
      : 'Masuk untuk mengatur pengiriman milik Anda.';
  static String timeNotSet(BuildContext? context) =>
      isEnglish(context) ? 'Time not set' : 'Jam belum ditentukan';
  static String rescheduleDelivery(BuildContext? context) =>
      isEnglish(context) ? 'Reschedule delivery' : 'Ubah jadwal pengiriman';
  static String checkingAccount(BuildContext? context) =>
      isEnglish(context) ? 'Checking account...' : 'Memeriksa akun...';
  static String signInToManageYourDeliveries232(BuildContext? context) =>
      isEnglish(context)
      ? 'Sign in to manage your deliveries'
      : 'Masuk untuk mengatur pengiriman milik Anda';
  static String loadingSchedules(BuildContext? context) =>
      isEnglish(context) ? 'Loading schedules...' : 'Memuat jadwal...';
  static String tryAgain(BuildContext? context) =>
      isEnglish(context) ? 'Try again' : 'Coba lagi';
  static String noDeliveriesHaveBeenScheduledBy(BuildContext? context) =>
      isEnglish(context)
      ? 'No deliveries have been scheduled by the dispatcher yet.'
      : 'Belum ada pengiriman yang dijadwalkan dispatcher.';
  static String requestSentTheScheduleRemainsUnchanged(BuildContext? context) =>
      isEnglish(context)
      ? 'Request sent. The schedule remains unchanged until the dispatcher approves it.'
      : 'Permintaan terkirim. Jadwal belum berubah sampai disetujui dispatcher.';
  static String reschedulingIsUnavailable(BuildContext? context) =>
      isEnglish(context)
      ? 'Rescheduling is unavailable.'
      : 'Perubahan jadwal tidak tersedia.';
  static String chooseANewDeliveryDate(BuildContext? context) =>
      isEnglish(context)
      ? 'Choose a new delivery date'
      : 'Pilih tanggal pengiriman baru';
  static String deliveryWindowWib(BuildContext? context) =>
      isEnglish(context) ? 'Delivery window (WIB)' : 'Waktu pengiriman (WIB)';
  static String morning(BuildContext? context) =>
      isEnglish(context) ? 'Morning · 09:00–12:00' : 'Pagi · 09:00–12:00';
  static String afternoon(BuildContext? context) =>
      isEnglish(context) ? 'Afternoon · 12:00–17:00' : 'Siang · 12:00–17:00';
  static String reasonOptional(BuildContext? context) =>
      isEnglish(context) ? 'Reason (optional)' : 'Alasan (opsional)';
  static String sending(BuildContext? context) =>
      isEnglish(context) ? 'Sending...' : 'Mengirim...';
  static String requestReschedule(BuildContext? context) =>
      isEnglish(context) ? 'Request reschedule' : 'Ajukan perubahan jadwal';
  static String dH(BuildContext? context, Object? value0, Object? value1) =>
      isEnglish(context)
      ? '${formatArgument(context, value0)}d ${formatArgument(context, value1)}h'
      : '${formatArgument(context, value0)}h ${formatArgument(context, value1)}j';
  static String unitsLeft(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? '${formatArgument(context, value0)} units left'
      : 'Sisa ${formatArgument(context, value0)} unit';
  static String unableToSaveChangesPleaseTry(BuildContext? context) =>
      isEnglish(context)
      ? 'Unable to save changes. Please try again.'
      : 'Perubahan gagal disimpan. Silakan coba lagi.';
  static String removeFromWishlist(BuildContext? context) =>
      isEnglish(context) ? 'Remove from Wishlist' : 'Hapus dari Wishlist';
  static String preorderDays249(BuildContext? context, Object? value0) =>
      isEnglish(context)
      ? 'Preorder ${formatArgument(context, value0)} Days'
      : 'Indent ${formatArgument(context, value0)} Hari';
  static String productAddedToCart(BuildContext? context) => isEnglish(context)
      ? 'Product added to cart.'
      : 'Produk ditambahkan ke keranjang.';
  static String add(BuildContext? context) =>
      isEnglish(context) ? 'Add' : 'Tambah';
  static String submitAtLeastHoursBeforePlanned(BuildContext? context) =>
      isEnglish(context)
      ? 'Submit at least 24 hours before planned dispatch. Changes require dispatcher approval. All schedules use WIB (Asia/Jakarta).'
      : 'Ajukan paling lambat 24 jam sebelum rencana berangkat. Perubahan menunggu persetujuan dispatcher. Semua jadwal memakai WIB (Asia/Jakarta).';
}

bool isEnglish(BuildContext? context) =>
    context != null && Localizations.localeOf(context).languageCode == 'en';
String localeName(BuildContext? context) =>
    isEnglish(context) ? 'en_US' : 'id_ID';
String formatArgument(BuildContext? context, Object? value) => value is num
    ? NumberFormat.decimalPattern(localeName(context)).format(value)
    : value?.toString() ?? '';

String formatDecimal(BuildContext? context, num value, int digits) =>
    (NumberFormat.decimalPattern(localeName(context))
          ..minimumFractionDigits = digits
          ..maximumFractionDigits = digits)
        .format(value);
