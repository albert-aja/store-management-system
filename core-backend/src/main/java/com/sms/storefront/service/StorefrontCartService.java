package com.sms.storefront.service;

import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockUnitRepository;
import com.sms.pricing.PriceDiscountService;
import com.sms.pricing.StoreProductPrice;
import com.sms.pricing.StoreProductPriceRepository;
import com.sms.pricing.dto.DiscountCalculationResult;
import com.sms.pricing.dto.CartDiscountLine;
import com.sms.pricing.dto.CartDiscountResult;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.storefront.dto.AddToCartRequest;
import com.sms.storefront.dto.StorefrontCartDto;
import com.sms.storefront.model.CustomerCart;
import com.sms.storefront.model.CustomerCartItem;
import com.sms.storefront.repository.CustomerCartItemRepository;
import com.sms.storefront.repository.CustomerCartRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class StorefrontCartService {

    private final CustomerCartRepository cartRepository;
    private final CustomerCartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final StoreProductPriceRepository priceRepository;
    private final StockUnitRepository stockUnitRepository;
    private final PriceDiscountService discountService;

    public StorefrontCartDto getCart(String sessionId) {
        CustomerCart cart = getOrCreateCart(sessionId);
        List<CustomerCartItem> items = cartItemRepository.findByCartId(cart.getId());

        List<StorefrontCartDto.CartItemDto> itemDtos = new ArrayList<>();
        BigDecimal originalSubtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal netSubtotal = BigDecimal.ZERO;
        int totalCount = 0;
        List<CartDiscountLine> discountLines = new ArrayList<>();

        for (CustomerCartItem item : items) {
            ProductVariant v = item.getProductVariant();
            BigDecimal basePrice = resolvePrice(v);
            UUID prodId = v.getProduct() != null ? v.getProduct().getId() : null;
            DiscountCalculationResult dRes = discountService.calculateDiscount(null, v.getId(), prodId, basePrice, item.getQuantity());

            BigDecimal unitPrice = dRes.discountedPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal originalLineTotal = basePrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal lineDiscount = dRes.discountAmount().multiply(BigDecimal.valueOf(item.getQuantity()));

            originalSubtotal = originalSubtotal.add(originalLineTotal);
            totalDiscount = totalDiscount.add(lineDiscount);
            netSubtotal = netSubtotal.add(lineTotal);
            totalCount += item.getQuantity();

            long stock = stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(v.getId(), StockAvailability.AVAILABLE);
            String avail = stock >= item.getQuantity() ? "IN_STOCK" : "AVAILABLE_PROCUREMENT_REQUIRED";

            itemDtos.add(new StorefrontCartDto.CartItemDto(
                    item.getId(),
                    v.getId(),
                    v.getProduct() != null ? v.getProduct().getName() : "Product",
                    v.getVariantName() != null ? v.getVariantName() : "Standard",
                    v.getSku(),
                    unitPrice,
                    basePrice,
                    dRes.discountAmount(),
                    dRes.isDiscounted(),
                    dRes.appliedDiscountName(),
                    item.getQuantity(),
                    lineTotal,
                    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80",
                    avail
            ));
            discountLines.add(new CartDiscountLine(v.getId(), prodId, unitPrice, item.getQuantity()));
        }

        CartDiscountResult cartDiscount = discountService.calculateCartDiscount(null, discountLines);
        BigDecimal discountedSubtotal = netSubtotal.subtract(cartDiscount.discountAmount()).max(BigDecimal.ZERO);
        totalDiscount = totalDiscount.add(cartDiscount.discountAmount());
        BigDecimal tax = discountedSubtotal.multiply(BigDecimal.valueOf(0.11)).setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal total = discountedSubtotal.add(tax);

        return new StorefrontCartDto(cart.getId(), itemDtos, totalCount, originalSubtotal, totalDiscount, tax, total,
                cartDiscount.discountAmount(), cartDiscount.discountName());
    }

    public StorefrontCartDto addItem(String sessionId, AddToCartRequest request) {
        CustomerCart cart = getOrCreateCart(sessionId);
        ProductVariant variant = productVariantRepository.findById(request.variantId())
                .orElseThrow(() -> new com.sms.common.web.NotFoundException("Variant not found: " + request.variantId()));

        Optional<CustomerCartItem> existing = cartItemRepository.findByCartIdAndProductVariantId(cart.getId(), variant.getId());
        if (existing.isPresent()) {
            CustomerCartItem item = existing.get();
            item.setQuantity(item.getQuantity() + request.quantity());
            cartItemRepository.save(item);
        } else {
            CustomerCartItem newItem = new CustomerCartItem();
            newItem.setCart(cart);
            newItem.setProductVariant(variant);
            newItem.setQuantity(request.quantity());
            cartItemRepository.save(newItem);
        }

        return getCart(sessionId);
    }

    public StorefrontCartDto updateItemQuantity(String sessionId, UUID itemId, int quantity) {
        CustomerCart cart = getOrCreateCart(sessionId);
        CustomerCartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new com.sms.common.web.NotFoundException("Cart item not found: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to this session");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return getCart(sessionId);
    }

    public StorefrontCartDto removeItem(String sessionId, UUID itemId) {
        CustomerCart cart = getOrCreateCart(sessionId);
        CustomerCartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new com.sms.common.web.NotFoundException("Cart item not found: " + itemId));

        if (item.getCart().getId().equals(cart.getId())) {
            cartItemRepository.delete(item);
        }

        return getCart(sessionId);
    }

    public void clearCart(String sessionId) {
        CustomerCart cart = getOrCreateCart(sessionId);
        cartItemRepository.deleteByCartId(cart.getId());
    }

    private CustomerCart getOrCreateCart(String sessionId) {
        String sid = (sessionId != null && !sessionId.isBlank()) ? sessionId : "anon-session-default";
        return cartRepository.findBySessionId(sid).orElseGet(() -> {
            CustomerCart c = new CustomerCart();
            c.setSessionId(sid);
            return cartRepository.save(c);
        });
    }

    private BigDecimal resolvePrice(ProductVariant variant) {
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
}
