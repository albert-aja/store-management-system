package com.sms.storefront.service;

import com.sms.common.web.NotFoundException;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockUnitRepository;
import com.sms.pricing.StoreProductPrice;
import com.sms.pricing.StoreProductPriceRepository;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductRepository;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.storefront.dto.AddToCartRequest;
import com.sms.storefront.dto.StorefrontCartDto;
import com.sms.storefront.dto.StorefrontWishlistDto.*;
import com.sms.storefront.model.CustomerWishlistItem;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.repository.CustomerWishlistItemRepository;
import com.sms.storefront.repository.StorefrontCustomerRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StorefrontWishlistService {

    private final CustomerWishlistItemRepository wishlistRepository;
    private final StorefrontCustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final StoreProductPriceRepository priceRepository;
    private final StockUnitRepository stockUnitRepository;
    private final StorefrontCartService cartService;
    private final StorefrontPushNotificationService pushNotificationService;

    @Transactional(readOnly = true)
    public WishlistSummaryDto getWishlist(String sessionId, UUID customerId) {
        List<CustomerWishlistItem> items;
        if (customerId != null) {
            items = wishlistRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        } else {
            String sid = sanitizeSession(sessionId);
            items = wishlistRepository.findBySessionIdOrderByCreatedAtDesc(sid);
        }

        List<WishlistItemDto> itemDtos = new ArrayList<>();
        int priceDropCount = 0;
        BigDecimal totalPotentialSavings = BigDecimal.ZERO;

        for (CustomerWishlistItem item : items) {
            Product product = item.getProduct();
            ProductVariant variant = item.getProductVariant();

            if (product == null && variant != null) {
                product = variant.getProduct();
            }

            if (product == null) {
                continue;
            }

            if (variant == null) {
                List<ProductVariant> variants = productVariantRepository.findByProductIdOrderByVariantName(product.getId());
                if (!variants.isEmpty()) {
                    variant = variants.get(0);
                }
            }

            BigDecimal currentPrice = resolveCurrentPrice(variant);
            // If currentPrice has been simulated on the item directly
            if (item.getCurrentPrice() != null && item.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                currentPrice = item.getCurrentPrice();
            }

            BigDecimal originalPrice = item.getAddedPrice();
            if (originalPrice == null || originalPrice.compareTo(BigDecimal.ZERO) <= 0) {
                originalPrice = currentPrice;
            }

            boolean hasPriceDrop = currentPrice.compareTo(originalPrice) < 0;
            BigDecimal priceDropAmount = BigDecimal.ZERO;
            double priceDropPercentage = 0.0;

            if (hasPriceDrop) {
                priceDropAmount = originalPrice.subtract(currentPrice);
                totalPotentialSavings = totalPotentialSavings.add(priceDropAmount);
                priceDropCount++;

                if (originalPrice.compareTo(BigDecimal.ZERO) > 0) {
                    priceDropPercentage = priceDropAmount
                            .multiply(BigDecimal.valueOf(100))
                            .divide(originalPrice, 1, RoundingMode.HALF_UP)
                            .doubleValue();
                }
            }

            long inStock = 0;
            if (variant != null) {
                inStock = stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(variant.getId(), StockAvailability.AVAILABLE);
            }
            String commercialAvailability = inStock > 0 ? "IN_STOCK" : "AVAILABLE_PROCUREMENT_REQUIRED";
            int leadTimeDays = inStock > 0 ? 1 : 4;

            String imageUrl = resolveProductImage(product);

            itemDtos.add(new WishlistItemDto(
                    item.getId(),
                    product.getId(),
                    variant != null ? variant.getId() : null,
                    product.getName(),
                    variant != null ? variant.getVariantName() : "Pilihan Standar",
                    variant != null ? variant.getSku() : product.getCode(),
                    product.getCategory() != null ? product.getCategory().getName() : "Umum",
                    product.getBrand() != null ? product.getBrand().getName() : "SMS Mart",
                    imageUrl,
                    commercialAvailability,
                    leadTimeDays,
                    inStock,
                    originalPrice,
                    currentPrice,
                    hasPriceDrop,
                    priceDropAmount,
                    priceDropPercentage,
                    item.getNotes(),
                    item.getCreatedAt()
            ));
        }

        return new WishlistSummaryDto(
                itemDtos,
                itemDtos.size(),
                priceDropCount,
                totalPotentialSavings
        );
    }

    public WishlistItemDto addToWishlist(String sessionId, UUID customerId, AddToWishlistRequest request) {
        StorefrontCustomer customer = customerId != null ? customerRepository.findById(customerId).orElse(null) : null;
        String sid = sanitizeSession(sessionId);

        Product product = null;
        ProductVariant variant = null;

        if (request.variantId() != null) {
            variant = productVariantRepository.findById(request.variantId()).orElse(null);
            if (variant != null) {
                product = variant.getProduct();
            }
        }

        if (product == null && request.productId() != null) {
            product = productRepository.findById(request.productId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + request.productId()));
            if (variant == null) {
                List<ProductVariant> variants = productVariantRepository.findByProductIdOrderByVariantName(product.getId());
                if (!variants.isEmpty()) {
                    variant = variants.get(0);
                }
            }
        }

        if (product == null) {
            throw new IllegalArgumentException("Either productId or variantId must be provided");
        }

        // Check if already in wishlist
        Optional<CustomerWishlistItem> existing = Optional.empty();
        if (customer != null) {
            existing = wishlistRepository.findByCustomerIdAndProductId(customer.getId(), product.getId());
        } else {
            existing = wishlistRepository.findBySessionIdAndProductId(sid, product.getId());
        }

        CustomerWishlistItem item;
        BigDecimal currentPrice = request.currentPrice() != null && request.currentPrice().compareTo(BigDecimal.ZERO) > 0
                ? request.currentPrice()
                : resolveCurrentPrice(variant);

        if (existing.isPresent()) {
            item = existing.get();
            if (request.notes() != null) {
                item.setNotes(request.notes());
            }
        } else {
            item = new CustomerWishlistItem();
            item.setCustomer(customer);
            item.setSessionId(customer == null ? sid : null);
            item.setProduct(product);
            item.setProductVariant(variant);
            item.setAddedPrice(currentPrice);
            item.setCurrentPrice(currentPrice);
            item.setNotes(request.notes());
            item.setNotifyOnPriceDrop(true);
        }

        CustomerWishlistItem saved = wishlistRepository.save(item);

        return new WishlistItemDto(
                saved.getId(),
                product.getId(),
                variant != null ? variant.getId() : null,
                product.getName(),
                variant != null ? variant.getVariantName() : "Pilihan Standar",
                variant != null ? variant.getSku() : product.getCode(),
                product.getCategory() != null ? product.getCategory().getName() : "Umum",
                product.getBrand() != null ? product.getBrand().getName() : "SMS Mart",
                resolveProductImage(product),
                "IN_STOCK",
                1,
                10,
                saved.getAddedPrice(),
                saved.getCurrentPrice(),
                false,
                BigDecimal.ZERO,
                0.0,
                saved.getNotes(),
                saved.getCreatedAt()
        );
    }

    public void removeFromWishlist(UUID itemId) {
        wishlistRepository.deleteById(itemId);
    }

    @Transactional(readOnly = true)
    public void checkOwnership(String sessionId, UUID customerId, UUID itemId) {
        CustomerWishlistItem item = wishlistRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Wishlist item not found: " + itemId));
        boolean owned = item.getCustomer() != null
                ? item.getCustomer().getId().equals(customerId)
                : sessionId != null && sessionId.equals(item.getSessionId());
        if (!owned) {
            throw new org.springframework.security.access.AccessDeniedException("Wishlist item belongs to another session");
        }
    }

    public void removeByProductId(String sessionId, UUID customerId, UUID productId) {
        if (customerId != null) {
            wishlistRepository.deleteByCustomerIdAndProductId(customerId, productId);
        } else {
            String sid = sanitizeSession(sessionId);
            wishlistRepository.deleteBySessionIdAndProductId(sid, productId);
        }
    }

    public CheckWishlistResponse isWishlisted(String sessionId, UUID customerId, UUID productId) {
        if (customerId != null) {
            Optional<CustomerWishlistItem> item = wishlistRepository.findByCustomerIdAndProductId(customerId, productId);
            return new CheckWishlistResponse(item.isPresent(), item.map(CustomerWishlistItem::getId).orElse(null));
        } else {
            String sid = sanitizeSession(sessionId);
            Optional<CustomerWishlistItem> item = wishlistRepository.findBySessionIdAndProductId(sid, productId);
            return new CheckWishlistResponse(item.isPresent(), item.map(CustomerWishlistItem::getId).orElse(null));
        }
    }

    public StorefrontCartDto moveToCart(String sessionId, UUID customerId, UUID itemId) {
        CustomerWishlistItem item = wishlistRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Wishlist item not found: " + itemId));

        ProductVariant variant = item.getProductVariant();
        if (variant == null && item.getProduct() != null) {
            List<ProductVariant> variants = productVariantRepository.findByProductIdOrderByVariantName(item.getProduct().getId());
            if (!variants.isEmpty()) {
                variant = variants.get(0);
            }
        }

        if (variant == null) {
            throw new IllegalStateException("Product variant not found for wishlist item");
        }

        // Add to cart
        StorefrontCartDto cart = cartService.addItem(sessionId, new AddToCartRequest(variant.getId(), 1));

        // Delete from wishlist
        wishlistRepository.delete(item);

        return cart;
    }

    public WishlistSummaryDto syncWishlist(String guestSessionId, UUID customerId) {
        StorefrontCustomer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));

        String sid = sanitizeSession(guestSessionId);
        List<CustomerWishlistItem> guestItems = wishlistRepository.findBySessionIdOrderByCreatedAtDesc(sid);

        for (CustomerWishlistItem guestItem : guestItems) {
            Optional<CustomerWishlistItem> customerExisting = wishlistRepository.findByCustomerIdAndProductId(
                    customer.getId(),
                    guestItem.getProduct().getId()
            );

            if (customerExisting.isEmpty()) {
                // Transfer to customer
                guestItem.setCustomer(customer);
                guestItem.setSessionId(null);
                wishlistRepository.save(guestItem);
            } else {
                // If customer already has it, remove redundant guest record
                wishlistRepository.delete(guestItem);
            }
        }

        return getWishlist(guestSessionId, customerId);
    }

    public WishlistItemDto simulatePriceDrop(UUID itemId, BigDecimal newPrice) {
        CustomerWishlistItem item = wishlistRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Wishlist item not found: " + itemId));

        // If new price not provided, drop by 15%
        if (newPrice == null || newPrice.compareTo(BigDecimal.ZERO) <= 0) {
            BigDecimal original = item.getAddedPrice();
            if (original == null || original.compareTo(BigDecimal.ZERO) <= 0) {
                original = BigDecimal.valueOf(5000000);
                item.setAddedPrice(original);
            }
            newPrice = original.multiply(BigDecimal.valueOf(0.85)).setScale(0, RoundingMode.HALF_UP);
        }

        item.setCurrentPrice(newPrice);
        wishlistRepository.save(item);

        // Optionally trigger push notification for price drop
        try {
            if (item.getCustomer() != null) {
                String title = "Harga Turun! 🏷️ " + item.getProduct().getName();
                String body = "Produk impian Anda sekarang turun harga menjadi Rp " + newPrice + "! Beli sekarang sebelum stok habis.";
                log.info("Simulated price drop push notification for customer {}: {}", item.getCustomer().getId(), body);
            }
        } catch (Exception e) {
            log.warn("Failed to dispatch simulated price drop notification: {}", e.getMessage());
        }

        return getWishlist(item.getSessionId(), item.getCustomer() != null ? item.getCustomer().getId() : null)
                .items().stream()
                .filter(i -> i.id().equals(itemId))
                .findFirst()
                .orElseThrow();
    }

    private BigDecimal resolveCurrentPrice(ProductVariant variant) {
        if (variant == null) return BigDecimal.valueOf(1500000);
        if (variant.getId() != null) {
            Optional<StoreProductPrice> priceOpt = priceRepository.findFirstByProductVariantIdAndActiveTrue(variant.getId());
            if (priceOpt.isPresent()) {
                return priceOpt.get().getCashPrice();
            }
        }
        int hash = variant.getId() != null ? Math.abs(variant.getId().hashCode()) : Math.abs(variant.getSku() != null ? variant.getSku().hashCode() : 42);
        long basePrice = 500000L + (hash % 4500000L);
        return BigDecimal.valueOf((basePrice / 50000L) * 50000L);
    }

    private String sanitizeSession(String sessionId) {
        return (sessionId != null && !sessionId.isBlank()) ? sessionId : "anon-wishlist-default";
    }

    static String resolveProductImage(Product product) {
        if (product == null) return "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80";
        String name = product.getName() != null ? product.getName().toLowerCase() : "";
        if (name.contains("sofa") || name.contains("kursi") || name.contains("meja") || name.contains("furniture")) {
            return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80";
        } else if (name.contains("tv") || name.contains("televisi")) {
            return "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80";
        } else if (name.contains("kulkas") || name.contains("mesin cuci") || name.contains("ac")) {
            return "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80";
        } else if (name.contains("phone") || name.contains("samsung") || name.contains("xiaomi") || name.contains("apple")) {
            return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80";
        } else if (name.contains("laptop") || name.contains("komputer")) {
            return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80";
        }
        return "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80";
    }
}
