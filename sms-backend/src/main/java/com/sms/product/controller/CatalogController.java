package com.sms.product.controller;

import com.sms.product.dto.ProductBrand;
import com.sms.product.dto.ProductCategory;
import com.sms.product.dto.ProductType;
import com.sms.product.repository.ProductBrandRepository;
import com.sms.product.repository.ProductCategoryRepository;
import com.sms.product.repository.ProductTypeRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lookup data for the Type -> Category -> Product / Brand catalog hierarchy. */
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
@Transactional
public class CatalogController {

    public record TypeRequest(@NotBlank String type) {}

    public record TypeResponse(UUID id, String type, boolean active) {}

    public record CategoryRequest(@NotBlank String code, @NotBlank String name, String description, UUID typeId) {}

    public record CategoryResponse(UUID id, String code, String name, String description, UUID typeId,
                                   String typeName, boolean active) {}

    public record BrandRequest(@NotBlank String code, @NotBlank String name, String description) {}

    public record BrandResponse(UUID id, String code, String name, String description, boolean active) {}

    private final ProductTypeRepository typeRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductBrandRepository brandRepository;

    @GetMapping("/types")
    @Transactional(readOnly = true)
    public List<TypeResponse> types() {
        return typeRepository.findAll().stream().map(t -> new TypeResponse(t.getId(), t.getType(), t.isActive())).toList();
    }

    @PostMapping("/types")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public TypeResponse createType(@Valid @RequestBody TypeRequest request) {
        ProductType type = new ProductType();
        type.setType(request.type());
        type = typeRepository.save(type);
        return new TypeResponse(type.getId(), type.getType(), type.isActive());
    }

    @GetMapping("/categories")
    @Transactional(readOnly = true)
    public List<CategoryResponse> categories() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        ProductCategory category = new ProductCategory();
        category.setCode(request.code());
        category.setName(request.name());
        category.setDescription(request.description());
        if (request.typeId() != null) {
            category.setType(typeRepository.findById(request.typeId())
                    .orElseThrow(() -> new com.sms.common.web.NotFoundException("Type not found: " + request.typeId())));
        }
        return toResponse(categoryRepository.save(category));
    }

    private CategoryResponse toResponse(ProductCategory c) {
        return new CategoryResponse(c.getId(), c.getCode(), c.getName(), c.getDescription(),
                c.getType() != null ? c.getType().getId() : null, c.getType() != null ? c.getType().getType() : null,
                c.isActive());
    }

    @GetMapping("/brands")
    @Transactional(readOnly = true)
    public List<BrandResponse> brands() {
        return brandRepository.findAll().stream().map(this::toResponse).toList();
    }

    @PostMapping("/brands")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public BrandResponse createBrand(@Valid @RequestBody BrandRequest request) {
        ProductBrand brand = new ProductBrand();
        brand.setCode(request.code());
        brand.setName(request.name());
        brand.setDescription(request.description());
        return toResponse(brandRepository.save(brand));
    }

    private BrandResponse toResponse(ProductBrand b) {
        return new BrandResponse(b.getId(), b.getCode(), b.getName(), b.getDescription(), b.isActive());
    }
}
