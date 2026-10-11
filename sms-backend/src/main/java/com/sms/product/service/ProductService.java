package com.sms.product.service;

import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import java.util.List;
import java.util.UUID;

import com.sms.product.ComponentRequest;
import com.sms.product.ProductRequest;
import com.sms.product.VariantRequest;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductComponent;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductBrandRepository;
import com.sms.product.repository.ProductCategoryRepository;
import com.sms.product.repository.ProductComponentRepository;
import com.sms.product.repository.ProductRepository;
import com.sms.product.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductComponentRepository componentRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductBrandRepository brandRepository;

    @Transactional(readOnly = true)
    public List<Product> search(String term) {
        return productRepository.search(term);
    }

    @Transactional(readOnly = true)
    public Product getProduct(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    public Product createProduct(ProductRequest request) {
        Product product = new Product();
        product.setCode("PRD-%05d".formatted(productRepository.nextCodeSequence()));
        applyRequest(product, request);
        return productRepository.save(product);
    }

    public Product updateProduct(UUID id, ProductRequest request) {
        Product product = getProduct(id);
        applyRequest(product, request);
        return product;
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setCategory(request.categoryId() == null ? null : categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new NotFoundException("Category not found: " + request.categoryId())));
        product.setBrand(request.brandId() == null ? null : brandRepository.findById(request.brandId())
                .orElseThrow(() -> new NotFoundException("Brand not found: " + request.brandId())));
        product.setDescription(request.description());
    }

    public void setActive(UUID id, boolean active) {
        getProduct(id).setActive(active);
    }

    @Transactional(readOnly = true)
    public List<ProductVariant> listVariants(UUID productId) {
        return variantRepository.findByProductIdOrderByVariantName(productId);
    }

    public ProductVariant addVariant(UUID productId, VariantRequest request) {
        if (variantRepository.existsBySku(request.sku())) {
            throw new ConflictException("Variant SKU already exists: " + request.sku());
        }
        Product product = getProduct(productId);
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku(request.sku());
        variant.setVariantName(request.variantName());
        return variantRepository.save(variant);
    }

    public void setVariantActive(UUID variantId, boolean active) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new NotFoundException("Variant not found: " + variantId));
        variant.setActive(active);
    }

    @Transactional(readOnly = true)
    public List<ProductComponent> listComponents(UUID productId) {
        return componentRepository.findByProductIdOrderByName(productId);
    }

    public ProductComponent addComponent(UUID productId, ComponentRequest request) {
        Product product = getProduct(productId);
        ProductComponent component = new ProductComponent();
        component.setProduct(product);
        component.setName(request.name());
        component.setQuantity(request.quantity());
        component.setNotes(request.notes());
        return componentRepository.save(component);
    }

    public void setComponentActive(UUID componentId, boolean active) {
        ProductComponent component = componentRepository.findById(componentId)
                .orElseThrow(() -> new NotFoundException("Component not found: " + componentId));
        component.setActive(active);
    }
}
