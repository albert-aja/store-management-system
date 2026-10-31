package com.sms.storefront.controller;

import com.sms.storefront.dto.StorefrontBannerDto;
import com.sms.storefront.dto.StorefrontCategoryDto;
import com.sms.storefront.dto.StorefrontProductDetailDto;
import com.sms.storefront.dto.StorefrontProductSummaryDto;
import com.sms.storefront.service.StorefrontCatalogService;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/storefront")
@RequiredArgsConstructor
public class StorefrontProductController {

    private final StorefrontCatalogService catalogService;

    @GetMapping("/products")
    public List<StorefrontProductSummaryDto> getProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID brandId,
            @RequestParam(required = false) String availability,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {
        return catalogService.getProducts(query, categoryId, brandId, availability, minPrice, maxPrice);
    }

    @GetMapping("/products/{id}")
    public StorefrontProductDetailDto getProductDetail(@PathVariable UUID id) {
        return catalogService.getProductDetail(id);
    }

    @GetMapping("/categories")
    public List<StorefrontCategoryDto> getCategories() {
        return catalogService.getCategories();
    }

    @GetMapping("/banners")
    public List<StorefrontBannerDto> getBanners() {
        return catalogService.getPromotionalBanners();
    }
}

