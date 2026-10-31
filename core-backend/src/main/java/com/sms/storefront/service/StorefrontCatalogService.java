package com.sms.storefront.service;

import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockUnitRepository;
import com.sms.pricing.PriceDiscountService;
import com.sms.pricing.StoreProductPrice;
import com.sms.pricing.StoreProductPriceRepository;
import com.sms.pricing.dto.DiscountCalculationResult;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductCategory;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductBrandRepository;
import com.sms.product.repository.ProductCategoryRepository;
import com.sms.product.repository.ProductRepository;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.storefront.dto.StorefrontBannerDto;
import com.sms.storefront.dto.StorefrontCategoryDto;
import com.sms.storefront.dto.StorefrontProductDetailDto;
import com.sms.storefront.dto.StorefrontProductSummaryDto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StorefrontCatalogService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductBrandRepository brandRepository;
    private final StoreProductPriceRepository priceRepository;
    private final StockUnitRepository stockUnitRepository;
    private final PriceDiscountService discountService;

    public List<StorefrontProductSummaryDto> getProducts(
            String query,
            UUID categoryId,
            UUID brandId,
            String availabilityFilter,
            BigDecimal minPrice,
            BigDecimal maxPrice) {

        List<Product> products = productRepository.search(query);
        List<StorefrontProductSummaryDto> result = new ArrayList<>();

        for (Product product : products) {
            if (!product.isActive()) continue;
            if (categoryId != null && (product.getCategory() == null || !product.getCategory().getId().equals(categoryId))) {
                continue;
            }
            if (brandId != null && (product.getBrand() == null || !product.getBrand().getId().equals(brandId))) {
                continue;
            }

            List<ProductVariant> variants = productVariantRepository.findByProductIdOrderByVariantName(product.getId());
            if (variants.isEmpty()) continue;

            BigDecimal pMin = BigDecimal.valueOf(Long.MAX_VALUE);
            BigDecimal pMax = BigDecimal.ZERO;
            BigDecimal origMin = BigDecimal.valueOf(Long.MAX_VALUE);
            long totalStock = 0;
            boolean hasDiscount = false;
            boolean hasFlashSale = false;
            Instant flashSaleEndsAt = null;
            UUID primaryVariantId = null;
            int maxDiscountPercent = 0;
            String bestDiscountLabel = null;

            for (ProductVariant v : variants) {
                if (!v.isActive()) continue;
                if (primaryVariantId == null) primaryVariantId = v.getId();
                BigDecimal basePrice = resolvePrice(v);
                DiscountCalculationResult dRes = discountService.calculateDiscount(null, v.getId(), product.getId(), basePrice, 1);
                BigDecimal effectivePrice = dRes.discountedPrice();

                if (effectivePrice.compareTo(pMin) < 0) pMin = effectivePrice;
                if (effectivePrice.compareTo(pMax) > 0) pMax = effectivePrice;
                if (basePrice.compareTo(origMin) < 0) origMin = basePrice;

                if (dRes.isDiscounted()) {
                    hasDiscount = true;
                    if (dRes.discountPercentage() > maxDiscountPercent) {
                        maxDiscountPercent = dRes.discountPercentage();
                        bestDiscountLabel = dRes.appliedDiscountName();
                    }
                }
                if (dRes.flashSale()) {
                    hasFlashSale = true;
                    if (flashSaleEndsAt == null || dRes.validUntil().isBefore(flashSaleEndsAt)) {
                        flashSaleEndsAt = dRes.validUntil();
                    }
                }

                long stock = stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(v.getId(), StockAvailability.AVAILABLE);
                totalStock += stock;
            }

            if (pMin.compareTo(BigDecimal.valueOf(Long.MAX_VALUE)) == 0) {
                pMin = BigDecimal.valueOf(500000);
                pMax = BigDecimal.valueOf(500000);
                origMin = pMin;
            }

            // Price filtering
            if (minPrice != null && pMax.compareTo(minPrice) < 0) continue;
            if (maxPrice != null && pMin.compareTo(maxPrice) > 0) continue;

            // Decoupled commercial availability calculation
            String availability = totalStock > 0 ? "IN_STOCK" : "AVAILABLE_PROCUREMENT_REQUIRED";
            int leadTime = totalStock > 0 ? 1 : 4;

            if (availabilityFilter != null && !availabilityFilter.isBlank() && !availabilityFilter.equalsIgnoreCase("ALL")) {
                if (!availability.equalsIgnoreCase(availabilityFilter)) {
                    continue;
                }
            }

            String primaryImage = resolveProductImage(product);

            result.add(new StorefrontProductSummaryDto(
                    product.getId(),
                    product.getName(),
                    product.getCode(),
                    product.getDescription(),
                    product.getBrand() != null ? product.getBrand().getName() : "SMS Mart",
                    product.getCategory() != null ? product.getCategory().getName() : "General",
                    pMin,
                    pMax,
                    origMin,
                    hasDiscount,
                    maxDiscountPercent,
                    bestDiscountLabel,
                    primaryImage,
                    availability,
                    leadTime,
                    totalStock,
                    hasFlashSale,
                    flashSaleEndsAt,
                    primaryVariantId
            ));
        }

        return result;
    }

    public StorefrontProductDetailDto getProductDetail(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new com.sms.common.web.NotFoundException("Product not found: " + productId));

        List<ProductVariant> variants = productVariantRepository.findByProductIdOrderByVariantName(product.getId());
        List<StorefrontProductDetailDto.StorefrontVariantDto> variantDtos = new ArrayList<>();

        BigDecimal pMin = BigDecimal.valueOf(Long.MAX_VALUE);
        BigDecimal pMax = BigDecimal.ZERO;
        BigDecimal origMin = BigDecimal.valueOf(Long.MAX_VALUE);
        long totalStock = 0;
        boolean hasDiscount = false;
        boolean hasFlashSale = false;
        Instant flashSaleEndsAt = null;
        int maxDiscountPercent = 0;

        for (ProductVariant v : variants) {
            if (!v.isActive()) continue;
            BigDecimal basePrice = resolvePrice(v);
            DiscountCalculationResult dRes = discountService.calculateDiscount(null, v.getId(), product.getId(), basePrice, 1);
            BigDecimal effectivePrice = dRes.discountedPrice();

            if (effectivePrice.compareTo(pMin) < 0) pMin = effectivePrice;
            if (effectivePrice.compareTo(pMax) > 0) pMax = effectivePrice;
            if (basePrice.compareTo(origMin) < 0) origMin = basePrice;

            if (dRes.isDiscounted()) {
                hasDiscount = true;
                if (dRes.discountPercentage() > maxDiscountPercent) {
                    maxDiscountPercent = dRes.discountPercentage();
                }
            }
            if (dRes.flashSale()) {
                hasFlashSale = true;
                if (flashSaleEndsAt == null || dRes.validUntil().isBefore(flashSaleEndsAt)) {
                    flashSaleEndsAt = dRes.validUntil();
                }
            }

            long stock = stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(v.getId(), StockAvailability.AVAILABLE);
            totalStock += stock;

            String varAvailability = stock > 0 ? "IN_STOCK" : "AVAILABLE_PROCUREMENT_REQUIRED";
            int varLeadTime = stock > 0 ? 1 : 4;

            Map<String, String> attrs = new HashMap<>();
            attrs.put("SKU", v.getSku());
            if (v.getVariantName() != null) attrs.put("Option", v.getVariantName());

            variantDtos.add(new StorefrontProductDetailDto.StorefrontVariantDto(
                    v.getId(),
                    v.getVariantName() != null ? v.getVariantName() : product.getName(),
                    v.getSku(),
                    effectivePrice,
                    basePrice,
                    dRes.discountAmount(),
                    dRes.discountPercentage(),
                    dRes.isDiscounted(),
                    dRes.appliedDiscountName(),
                    stock,
                    varAvailability,
                    varLeadTime,
                    attrs,
                    dRes.flashSale(),
                    dRes.validUntil()
            ));
        }

        if (pMin.compareTo(BigDecimal.valueOf(Long.MAX_VALUE)) == 0) {
            pMin = BigDecimal.valueOf(500000);
            pMax = BigDecimal.valueOf(500000);
            origMin = pMin;
        }

        String overallAvailability = totalStock > 0 ? "IN_STOCK" : "AVAILABLE_PROCUREMENT_REQUIRED";
        int overallLeadTime = totalStock > 0 ? 1 : 4;

        List<String> images = List.of(
                resolveProductImage(product),
                "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80"
        );

        Map<String, String> specs = new HashMap<>();
        specs.put("Brand", product.getBrand() != null ? product.getBrand().getName() : "SMS Mart");
        specs.put("Category", product.getCategory() != null ? product.getCategory().getName() : "General");
        specs.put("Model Code", product.getCode());
        specs.put("Warranty", "1 Year Official Brand Warranty");
        specs.put("Delivery Coverage", "National & Local Instant Dispatch");

        return new StorefrontProductDetailDto(
                product.getId(),
                product.getName(),
                product.getCode(),
                product.getDescription(),
                product.getBrand() != null ? product.getBrand().getName() : "SMS Mart",
                product.getCategory() != null ? product.getCategory().getName() : "General",
                pMin,
                pMax,
                origMin,
                hasDiscount,
                maxDiscountPercent,
                images,
                overallAvailability,
                overallLeadTime,
                totalStock,
                variantDtos,
                specs,
                hasFlashSale,
                flashSaleEndsAt
        );
    }

    public List<StorefrontCategoryDto> getCategories() {
        List<ProductCategory> categories = categoryRepository.findAll();
        List<StorefrontCategoryDto> result = new ArrayList<>();
        for (ProductCategory c : categories) {
            if (!c.isActive()) continue;
            String img = switch (c.getName().toLowerCase()) {
                case "elektronik", "electronics" -> "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80";
                case "furniture", "mebel" -> "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80";
                case "smartphone", "handphone", "gadget" -> "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";
                default -> "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80";
            };
            result.add(new StorefrontCategoryDto(c.getId(), c.getName(), c.getCode(), c.getDescription(), img, 12));
        }
        return result;
    }

    public List<StorefrontBannerDto> getPromotionalBanners() {
        return List.of(
                new StorefrontBannerDto(
                        "banner-1",
                        "Super Mega Retail Sale 2026",
                        "Diskon hingga 40% untuk produk Smart TV, Kulkas & Furniture Idaman",
                        "PROMO SPESIAL",
                        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
                        "/products",
                        "Belanja Sekarang"
                ),
                new StorefrontBannerDto(
                        "banner-2",
                        "Cicilan Ringan & Mudah",
                        "Pilihan cicilan in-house terpercaya & mitra pembiayaan resmi (Kredivo / Akulaku)",
                        "KREDIT MUDAH",
                        "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80",
                        "/products",
                        "Lihat Produk"
                ),
                new StorefrontBannerDto(
                        "banner-3",
                        "Pengiriman Cepat & Ambil di Toko",
                        "Layanan antar langsung oleh armada pengemudi toko atau ambil di cabang terdekat",
                        "DUAL FULFILLMENT",
                        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
                        "/products",
                        "Pelajari Layanan"
                )
        );
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
        return BigDecimal.valueOf((basePrice / 50000L) * 50000L); // round to neat 50,000 IDR
    }

    private String resolveProductImage(Product product) {
        String name = product.getName().toLowerCase();
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
