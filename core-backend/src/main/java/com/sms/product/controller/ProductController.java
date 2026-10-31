package com.sms.product.controller;

import com.sms.product.*;
import com.sms.product.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> search(@RequestParam(required = false) String query) {
        return productService.search(query).stream().map(ProductResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable UUID id) {
        return ProductResponse.from(productService.getProduct(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ProductResponse createProduct(@Valid @RequestBody ProductRequest request) {
        return ProductResponse.from(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ProductResponse updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return ProductResponse.from(productService.updateProduct(id, request));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public void deactivate(@PathVariable UUID id) {
        productService.setActive(id, false);
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public void activate(@PathVariable UUID id) {
        productService.setActive(id, true);
    }

    @GetMapping("/{id}/variants")
    public List<VariantResponse> listVariants(@PathVariable UUID id) {
        return productService.listVariants(id).stream().map(VariantResponse::from).toList();
    }

    @PostMapping("/{id}/variants")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public VariantResponse addVariant(@PathVariable UUID id, @Valid @RequestBody VariantRequest request) {
        return VariantResponse.from(productService.addVariant(id, request));
    }

    @PostMapping("/variants/{variantId}/deactivate")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public void deactivateVariant(@PathVariable UUID variantId) {
        productService.setVariantActive(variantId, false);
    }

    @PostMapping("/variants/{variantId}/activate")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public void activateVariant(@PathVariable UUID variantId) {
        productService.setVariantActive(variantId, true);
    }

    @GetMapping("/{id}/components")
    public List<ComponentResponse> listComponents(@PathVariable UUID id) {
        return productService.listComponents(id).stream().map(ComponentResponse::from).toList();
    }

    @PostMapping("/{id}/components")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public ComponentResponse addComponent(@PathVariable UUID id, @Valid @RequestBody ComponentRequest request) {
        return ComponentResponse.from(productService.addComponent(id, request));
    }

    @PostMapping("/components/{componentId}/deactivate")
    @PreAuthorize("hasAuthority('PRODUCT_MANAGE')")
    public void deactivateComponent(@PathVariable UUID componentId) {
        productService.setComponentActive(componentId, false);
    }
}
