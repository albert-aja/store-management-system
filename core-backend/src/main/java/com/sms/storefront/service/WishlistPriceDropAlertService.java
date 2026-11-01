package com.sms.storefront.service;

import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.storefront.dto.StorefrontWishlistDto.PriceDropAlertSummary;
import com.sms.storefront.dto.StorefrontWishlistDto.PriceDropScanResultDto;
import com.sms.storefront.model.CustomerWishlistItem;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.model.WishlistPriceDropAlertLog;
import com.sms.storefront.repository.CustomerWishlistItemRepository;
import com.sms.storefront.repository.WishlistPriceDropAlertLogRepository;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WishlistPriceDropAlertService {

    private final CustomerWishlistItemRepository wishlistRepository;
    private final WishlistPriceDropAlertLogRepository alertLogRepository;
    private final StorefrontPushNotificationService pushNotificationService;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${sms.wishlist.mail.from:promo@smsmart.co.id}")
    private String mailFromAddress;

    @Value("${sms.wishlist.mail.enabled:false}")
    private boolean mailDeliveryEnabled;

    /**
     * Daily background cron job scanning price movements for wishlisted items.
     * Fires at 09:00 AM every day by default.
     */
    @Scheduled(cron = "${sms.storefront.wishlist.price-drop-cron:0 0 9 * * ?}")
    public void scheduledDailyPriceDropScan() {
        log.info("Wishlist Price Drop Cron: Starting automated daily scan...");
        PriceDropScanResultDto result = scanAndDispatchPriceDropAlerts();
        log.info("Wishlist Price Drop Cron: Completed. Scanned: {}, Triggered Alerts: {}, Push: {}, Email: {}",
                result.scannedCount(), result.alertsTriggered(), result.pushSentCount(), result.emailSentCount());
    }

    @Transactional
    public PriceDropScanResultDto scanAndDispatchPriceDropAlerts() {
        List<CustomerWishlistItem> watchers = wishlistRepository.findActivePriceDropWatchers();
        int scannedCount = watchers.size();
        int alertsTriggered = 0;
        int pushSentCount = 0;
        int emailSentCount = 0;
        List<PriceDropAlertSummary> triggeredAlerts = new ArrayList<>();

        for (CustomerWishlistItem item : watchers) {
            StorefrontCustomer customer = item.getCustomer();
            if (customer == null || !customer.isActive()) {
                continue;
            }

            BigDecimal addedPrice = item.getAddedPrice();
            BigDecimal currentPrice = item.getCurrentPrice();

            if (addedPrice == null || currentPrice == null || addedPrice.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            if (currentPrice.compareTo(addedPrice) < 0) {
                BigDecimal dropAmount = addedPrice.subtract(currentPrice);
                BigDecimal dropPercentage = dropAmount
                        .divide(addedPrice, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);

                BigDecimal threshold = item.getAlertDropThresholdPercent() != null
                        ? item.getAlertDropThresholdPercent()
                        : new BigDecimal("5.00");

                // Check if price drop meets or exceeds user-chosen threshold percentage
                if (dropPercentage.compareTo(threshold) >= 0) {
                    // Prevent repeated duplicate alerts if price has not dropped further since last alert
                    boolean shouldAlert = item.getLastAlertedPrice() == null
                            || currentPrice.compareTo(item.getLastAlertedPrice()) < 0;

                    if (shouldAlert) {
                        Product product = item.getProduct();
                        ProductVariant variant = item.getProductVariant();
                        String productName = product != null ? product.getName() : "Produk Wishlist";
                        String variantName = variant != null ? variant.getVariantName() : null;

                        // 1. Dispatch Mobile FCM/APNs Push Notification
                        boolean pushSent = dispatchPushNotification(customer, productName, variantName, addedPrice, currentPrice, dropPercentage.doubleValue(), product != null ? product.getId() : null);
                        if (pushSent) {
                            pushSentCount++;
                        }

                        // 2. Dispatch Email Alert
                        boolean emailSent = dispatchEmailAlert(customer, productName, addedPrice, currentPrice, dropPercentage.doubleValue());
                        if (emailSent) {
                            emailSentCount++;
                        }

                        // 3. Update Wishlist Item Alert Attribution
                        BigDecimal previousAlertedPrice = item.getLastAlertedPrice();
                        item.setLastAlertedPrice(currentPrice);
                        item.setLastAlertedAt(Instant.now());
                        wishlistRepository.save(item);

                        // 4. Save Audit Log Record
                        WishlistPriceDropAlertLog logEntry = new WishlistPriceDropAlertLog();
                        logEntry.setWishlistItem(item);
                        logEntry.setCustomer(customer);
                        logEntry.setProduct(product);
                        logEntry.setProductVariant(variant);
                        logEntry.setProductName(productName);
                        logEntry.setOriginalAddedPrice(addedPrice);
                        logEntry.setPreviousAlertedPrice(previousAlertedPrice);
                        logEntry.setCurrentPrice(currentPrice);
                        logEntry.setPriceDropAmount(dropAmount);
                        logEntry.setDropPercentage(dropPercentage);
                        logEntry.setThresholdPercentage(threshold);
                        logEntry.setPushNotified(pushSent);
                        logEntry.setEmailNotified(emailSent);
                        logEntry.setRecipientEmail(customer.getEmail());
                        logEntry.setDispatchedAt(Instant.now());

                        WishlistPriceDropAlertLog savedLog = alertLogRepository.save(logEntry);
                        alertsTriggered++;

                        triggeredAlerts.add(new PriceDropAlertSummary(
                                savedLog.getId(),
                                customer.getId(),
                                customer.getFullName(),
                                customer.getEmail(),
                                productName,
                                addedPrice,
                                currentPrice,
                                dropPercentage.doubleValue(),
                                threshold.doubleValue(),
                                pushSent,
                                emailSent,
                                savedLog.getDispatchedAt()
                        ));

                        log.info("Dispatched price drop alert for customer {} (product: {}, drop: {}%, threshold: {}%)",
                                customer.getId(), productName, dropPercentage, threshold);
                    }
                }
            }
        }

        return new PriceDropScanResultDto(scannedCount, alertsTriggered, pushSentCount, emailSentCount, triggeredAlerts);
    }

    private boolean dispatchPushNotification(
            StorefrontCustomer customer,
            String productName,
            String variantName,
            BigDecimal originalPrice,
            BigDecimal currentPrice,
            double dropPercentage,
            java.util.UUID productId
    ) {
        try {
            String formattedCurrent = formatCurrencyIdr(currentPrice);
            String title = "Harga Wishlist Turun! 🏷️";
            String body = String.format("Barang idamanmu \"%s\" turun %.1f%% menjadi %s! Checkout sekarang sebelum kehabisan stok.",
                    productName, dropPercentage, formattedCurrent);

            Map<String, Object> meta = Map.of(
                    "type", "WISHLIST_PRICE_DROP",
                    "productId", productId != null ? productId.toString() : "",
                    "currentPrice", currentPrice.toString(),
                    "dropPercentage", String.format(Locale.US, "%.1f", dropPercentage)
            );

            pushNotificationService.sendMilestoneNotification(
                    "WISHLIST-" + customer.getId().toString().substring(0, 8).toUpperCase(),
                    "WISHLIST_PRICE_DROP",
                    title,
                    body,
                    meta
            );
            return true;
        } catch (Exception ex) {
            log.warn("Failed to dispatch push notification for price drop: {}", ex.getMessage());
            return false;
        }
    }

    private boolean dispatchEmailAlert(
            StorefrontCustomer customer,
            String productName,
            BigDecimal originalPrice,
            BigDecimal currentPrice,
            double dropPercentage
    ) {
        String email = customer.getEmail();
        if (email == null || email.isBlank()) {
            return false;
        }

        String formattedOriginal = formatCurrencyIdr(originalPrice);
        String formattedCurrent = formatCurrencyIdr(currentPrice);
        String customerName = customer.getFullName() != null ? customer.getFullName() : "Pelanggan Setia SMS";

        String subject = String.format("Penurunan Harga Spesial: %s Turun %.1f%%!", productName, dropPercentage);
        String htmlBody = String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; }
                    .card { max-width: 580px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
                    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
                    .content { padding: 24px; background: #ffffff; }
                    .badge { display: inline-block; background: #ecfdf5; color: #047857; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-size: 14px; }
                    .price-box { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px; border-radius: 8px; margin: 18px 0; }
                    .old-price { text-decoration: line-through; color: #64748b; font-size: 13px; }
                    .new-price { font-size: 22px; font-weight: 900; color: #047857; margin-top: 4px; }
                    .btn { display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 16px; }
                    .footer { background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="header">
                      <h2 style="margin:0; font-size:20px;">SMS Mart Retail Showroom</h2>
                      <p style="margin:4px 0 0 0; font-size:12px; color:#94a3b8;">Pemberitahuan Penurunan Harga Wishlist</p>
                    </div>
                    <div class="content">
                      <p>Halo <strong>%s</strong>,</p>
                      <p>Kabar gembira! Produk yang Anda simpan di daftar keinginan (wishlist) baru saja mengalami penurunan harga sesuai preferensi notifikasi Anda:</p>
                      <div class="price-box">
                        <span class="badge">Diskon %.1f%% Turun Harga!</span>
                        <h3 style="margin:8px 0 4px 0; font-size:16px;">%s</h3>
                        <div class="old-price">Harga Sebelumnya: %s</div>
                        <div class="new-price">%s</div>
                      </div>
                      <p style="font-size:13px; color:#475569;">Stok terbatas di cabang showroom terdekat. Segera buka aplikasi mobile SMS Store Anda untuk melanjutkan pemesanan atau simulasi cicilan.</p>
                    </div>
                    <div class="footer">
                      SMS Mart &bull; Money Management & Retail Merchandising System &bull; Notifikasi Resmi
                    </div>
                  </div>
                </body>
                </html>
                """, customerName, dropPercentage, productName, formattedOriginal, formattedCurrent);

        if (mailSender == null || !mailDeliveryEnabled) {
            log.info("Email alert simulated for {} (to: {}, subject: {})", customer.getId(), email, subject);
            return true;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFromAddress, "SMS Mart Storefront");
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Price drop email sent to {}", email);
            return true;
        } catch (Exception ex) {
            log.warn("Failed to send price drop email to {}: {}", email, ex.getMessage());
            return false;
        }
    }

    private String formatCurrencyIdr(BigDecimal amount) {
        if (amount == null) return "Rp 0";
        NumberFormat nf = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("id-ID"));
        return nf.format(amount).replace(",00", "");
    }
}

