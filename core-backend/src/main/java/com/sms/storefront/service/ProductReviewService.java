package com.sms.storefront.service;

import com.sms.delivery.DeliveryOrder;
import com.sms.delivery.DeliveryOrderRepository;
import com.sms.delivery.DeliveryOrderStatus;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductRepository;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import com.sms.storefront.dto.ProductReviewDto.*;
import com.sms.storefront.model.ProductReview;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.repository.ProductReviewRepository;
import com.sms.storefront.repository.StorefrontCustomerRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final StorefrontCustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final DeliveryOrderRepository deliveryOrderRepository;

    @Transactional(readOnly = true)
    public ProductReviewSummaryDto getProductReviews(UUID productId) {
        List<ProductReview> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);

        int totalReviews = reviews.size();
        int stars5 = 0;
        int stars4 = 0;
        int stars3 = 0;
        int stars2 = 0;
        int stars1 = 0;
        double sum = 0.0;

        for (ProductReview r : reviews) {
            sum += r.getRating();
            switch (r.getRating()) {
                case 5 -> stars5++;
                case 4 -> stars4++;
                case 3 -> stars3++;
                case 2 -> stars2++;
                case 1 -> stars1++;
                default -> {}
            }
        }

        double avg = totalReviews == 0 ? 0.0 : Math.round((sum / totalReviews) * 10.0) / 10.0;
        RatingDistributionDto distribution = new RatingDistributionDto(stars5, stars4, stars3, stars2, stars1);

        List<ProductReviewItemDto> items = reviews.stream()
                .map(r -> new ProductReviewItemDto(
                        r.getId(),
                        r.getCustomer().getId(),
                        maskCustomerName(r.getCustomer().getFullName()),
                        r.getRating(),
                        r.getTitle(),
                        r.getContent(),
                        r.isVerifiedPurchase(),
                        r.getCreatedAt()
                ))
                .toList();

        return new ProductReviewSummaryDto(avg, totalReviews, distribution, items);
    }

    @Transactional(readOnly = true)
    public ReviewEligibilityDto checkEligibility(UUID storefrontCustomerId, UUID productId) {
        if (storefrontCustomerId == null) {
            return new ReviewEligibilityDto(false, false, null, null, "AUTH_REQUIRED");
        }

        StorefrontCustomer sc = customerRepository.findById(storefrontCustomerId).orElse(null);
        if (sc == null) {
            return new ReviewEligibilityDto(false, false, null, null, "AUTH_REQUIRED");
        }

        Optional<ProductReview> existing = reviewRepository.findByCustomerIdAndProductId(storefrontCustomerId, productId);
        boolean alreadyReviewed = existing.isPresent();
        UUID existingReviewId = existing.map(ProductReview::getId).orElse(null);

        VerificationResult vr = verifyDeliveryForProduct(sc, productId);
        if (!vr.eligible()) {
            String orderNum = vr.salesOrder() != null ? vr.salesOrder().getNumber() : null;
            return new ReviewEligibilityDto(false, alreadyReviewed, existingReviewId, orderNum, vr.reason());
        }

        return new ReviewEligibilityDto(
                true,
                alreadyReviewed,
                existingReviewId,
                vr.salesOrder() != null ? vr.salesOrder().getNumber() : null,
                null
        );
    }

    public ProductReviewItemDto submitReview(UUID storefrontCustomerId, SubmitReviewRequest request) {
        if (storefrontCustomerId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Silakan masuk akun terlebih dahulu.");
        }

        StorefrontCustomer sc = customerRepository.findById(storefrontCustomerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Customer tidak ditemukan."));

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produk tidak ditemukan."));

        VerificationResult vr = verifyDeliveryForProduct(sc, request.productId());
        if (!vr.eligible()) {
            if ("DELIVERY_PENDING".equals(vr.reason())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Barang masih dalam proses pengiriman. Ulasan hanya dapat diberikan setelah pesanan diterima."
                );
            }
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Hanya pembeli terverifikasi dengan konfirmasi pengiriman selesai yang dapat memberikan ulasan."
            );
        }

        ProductReview review = reviewRepository.findByCustomerIdAndProductId(storefrontCustomerId, request.productId())
                .orElseGet(() -> {
                    ProductReview r = new ProductReview();
                    r.setCustomer(sc);
                    r.setProduct(product);
                    return r;
                });

        if (request.productVariantId() != null) {
            ProductVariant variant = productVariantRepository.findById(request.productVariantId()).orElse(null);
            review.setProductVariant(variant);
        }

        review.setRating(request.rating());
        review.setTitle(request.title() != null ? request.title().trim() : null);
        review.setContent(request.content().trim());
        review.setVerifiedPurchase(true);
        review.setSalesOrder(vr.salesOrder());
        review.setDeliveryOrder(vr.deliveryOrder());

        ProductReview saved = reviewRepository.save(review);

        return new ProductReviewItemDto(
                saved.getId(),
                sc.getId(),
                maskCustomerName(sc.getFullName()),
                saved.getRating(),
                saved.getTitle(),
                saved.getContent(),
                saved.isVerifiedPurchase(),
                saved.getCreatedAt()
        );
    }

    public record VerificationResult(
            boolean eligible,
            String reason,
            SalesOrder salesOrder,
            DeliveryOrder deliveryOrder
    ) {}

    public VerificationResult verifyDeliveryForProduct(StorefrontCustomer sc, UUID productId) {
        if (sc == null || sc.getCustomer() == null) {
            return new VerificationResult(false, "NO_PURCHASE_FOUND", null, null);
        }
        UUID masterCustomerId = sc.getCustomer().getId();

        List<SalesOrder> orders = salesOrderRepository.search(null, masterCustomerId, null);
        if (orders.isEmpty()) {
            return new VerificationResult(false, "NO_PURCHASE_FOUND", null, null);
        }

        boolean productFoundInAnyOrder = false;
        SalesOrder latestOrderWithProduct = null;
        DeliveryOrder latestDeliveryOrder = null;

        for (SalesOrder order : orders) {
            List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(order.getId());
            boolean hasProduct = items.stream().anyMatch(item ->
                    item.getProductVariant() != null &&
                    item.getProductVariant().getProduct() != null &&
                    item.getProductVariant().getProduct().getId().equals(productId)
            );

            if (hasProduct) {
                productFoundInAnyOrder = true;
                List<DeliveryOrder> deliveryOrders = deliveryOrderRepository.findBySalesOrderIdOrderByCreatedAtDesc(order.getId());
                Optional<DeliveryOrder> deliveredOpt = deliveryOrders.stream()
                        .filter(d -> d.getStatus() == DeliveryOrderStatus.DELIVERED)
                        .findFirst();

                if (deliveredOpt.isPresent()) {
                    return new VerificationResult(true, null, order, deliveredOpt.get());
                }

                if (order.getStatus() == SalesOrderStatus.COMPLETED) {
                    return new VerificationResult(true, null, order, deliveryOrders.isEmpty() ? null : deliveryOrders.get(0));
                }

                if (latestOrderWithProduct == null) {
                    latestOrderWithProduct = order;
                    if (!deliveryOrders.isEmpty()) {
                        latestDeliveryOrder = deliveryOrders.get(0);
                    }
                }
            }
        }

        if (!productFoundInAnyOrder) {
            return new VerificationResult(false, "NO_PURCHASE_FOUND", null, null);
        }

        return new VerificationResult(false, "DELIVERY_PENDING", latestOrderWithProduct, latestDeliveryOrder);
    }

    private String maskCustomerName(String name) {
        if (name == null || name.isBlank()) {
            return "Pelanggan Terverifikasi";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length >= 2) {
            return parts[0] + " " + parts[1].charAt(0) + ".";
        }
        if (name.length() <= 2) {
            return name;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1);
    }
}

