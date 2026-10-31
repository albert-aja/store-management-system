package com.sms.pricing;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.pricing.dto.DiscountCalculationResult;
import com.sms.pricing.dto.CartDiscountLine;
import com.sms.pricing.dto.CartDiscountResult;
import com.sms.pricing.dto.PriceDiscountRequest;
import com.sms.pricing.dto.PriceDiscountResponse;
import com.sms.pricing.dto.PriceDiscountRequirementRequest;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductRepository;
import com.sms.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PriceDiscountService {

    private final PriceDiscountRepository discountRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    @Transactional(readOnly = true)
    public List<PriceDiscountResponse> listDiscounts(UUID storeId, Boolean activeOnly) {
        Instant now = Instant.now();
        List<PriceDiscount> list;
        if (storeId != null) {
            list = discountRepository.findByStoreIdOrderByPriorityDesc(storeId);
        } else {
            list = discountRepository.findAll();
        }

        return list.stream()
                .filter(d -> {
                    if (Boolean.TRUE.equals(activeOnly)) {
                        return d.isActive() && !d.getValidFrom().isAfter(now) && !d.getValidUntil().isBefore(now);
                    }
                    return true;
                })
                .sorted(Comparator.comparingInt(PriceDiscount::getPriority).reversed())
                .map(PriceDiscountResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PriceDiscount getDiscount(UUID id) {
        return discountRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Price discount not found: " + id));
    }

    @Transactional(readOnly = true)
    public PriceDiscountResponse getDiscountResponse(UUID id) {
        return PriceDiscountResponse.from(getDiscount(id));
    }

    public PriceDiscountResponse createDiscount(PriceDiscountRequest req) {
        validateRequest(req);

        PriceDiscount discount = new PriceDiscount();
        applyRequestData(discount, req);

        return PriceDiscountResponse.from(discountRepository.save(discount));
    }

    public PriceDiscountResponse updateDiscount(UUID id, PriceDiscountRequest req) {
        validateRequest(req);
        PriceDiscount discount = getDiscount(id);
        applyRequestData(discount, req);

        return PriceDiscountResponse.from(discount);
    }

    public PriceDiscountResponse toggleActive(UUID id) {
        PriceDiscount discount = getDiscount(id);
        discount.setActive(!discount.isActive());
        return PriceDiscountResponse.from(discount);
    }

    public void deleteDiscount(UUID id) {
        PriceDiscount discount = getDiscount(id);
        discountRepository.delete(discount);
    }

    @Transactional(readOnly = true)
    public DiscountCalculationResult calculateDiscount(UUID storeId, UUID variantId, UUID productId, BigDecimal basePrice, int quantity) {
        if (basePrice == null || basePrice.compareTo(BigDecimal.ZERO) <= 0) {
            return DiscountCalculationResult.noDiscount(basePrice != null ? basePrice : BigDecimal.ZERO);
        }

        int qty = Math.max(quantity, 1);
        BigDecimal lineSubtotal = basePrice.multiply(BigDecimal.valueOf(qty));
        Instant now = Instant.now();

        // Resolve productId if variantId is provided but productId is null
        UUID resolvedProductId = productId;
        if (resolvedProductId == null && variantId != null) {
            ProductVariant v = variantRepository.findById(variantId).orElse(null);
            if (v != null && v.getProduct() != null) {
                resolvedProductId = v.getProduct().getId();
            }
        }

        List<PriceDiscount> candidates = discountRepository.findActiveDiscountsForVariant(storeId, variantId, resolvedProductId, now);
        if (candidates.isEmpty()) {
            return DiscountCalculationResult.noDiscount(basePrice);
        }

        PriceDiscount bestDiscount = null;
        BigDecimal bestUnitDiscount = BigDecimal.ZERO;

        for (PriceDiscount candidate : candidates) {
            if (candidate.getDiscountScope() != null && candidate.getDiscountScope() != DiscountScope.UNIT) {
                continue;
            }
            if (qty < candidate.getMinQuantity()) {
                continue;
            }
            if (candidate.getMinOrderAmount() != null && lineSubtotal.compareTo(candidate.getMinOrderAmount()) < 0) {
                continue;
            }

            BigDecimal unitDiscount;
            if (candidate.getDiscountType() == DiscountType.PERCENTAGE) {
                unitDiscount = basePrice.multiply(candidate.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                if (candidate.getMaxDiscountAmount() != null && unitDiscount.compareTo(candidate.getMaxDiscountAmount()) > 0) {
                    unitDiscount = candidate.getMaxDiscountAmount();
                }
            } else {
                unitDiscount = candidate.getDiscountValue().min(basePrice);
            }

            if (unitDiscount.compareTo(bestUnitDiscount) > 0) {
                bestUnitDiscount = unitDiscount;
                bestDiscount = candidate;
            }
        }

        if (bestDiscount == null || bestUnitDiscount.compareTo(BigDecimal.ZERO) <= 0) {
            return DiscountCalculationResult.noDiscount(basePrice);
        }

        BigDecimal discountedPrice = basePrice.subtract(bestUnitDiscount).max(BigDecimal.ZERO);
        int discountPercentage = basePrice.compareTo(BigDecimal.ZERO) > 0
                ? bestUnitDiscount.multiply(BigDecimal.valueOf(100)).divide(basePrice, 0, RoundingMode.HALF_UP).intValue()
                : 0;

        return new DiscountCalculationResult(
                basePrice,
                discountedPrice,
                bestUnitDiscount,
                discountPercentage,
                bestDiscount.getId(),
                bestDiscount.getDiscountName(),
                bestDiscount.getDiscountType(),
                true,
                bestDiscount.isFlashSale(),
                bestDiscount.getValidUntil()
        );
    }

    @Transactional(readOnly = true)
    public CartDiscountResult calculateCartDiscount(UUID storeId, List<CartDiscountLine> lines) {
        if (lines == null || lines.isEmpty()) return CartDiscountResult.none();

        BigDecimal bestAmount = BigDecimal.ZERO;
        PriceDiscount bestDiscount = null;
        for (PriceDiscount candidate : discountRepository.findActiveCartDiscounts(storeId, Instant.now())) {
            BigDecimal eligibleSubtotal = BigDecimal.ZERO;
            int eligibleQuantity = 0;
            int bundleCount = 0;

            if (candidate.getDiscountScope() == DiscountScope.BUNDLE) {
                if (candidate.getRequirements() == null || candidate.getRequirements().isEmpty()) continue;
                Map<UUID, CartDiscountLine> lineByVariant = new HashMap<>();
                for (CartDiscountLine line : lines) {
                    lineByVariant.merge(line.variantId(), line,
                            (left, right) -> new CartDiscountLine(left.variantId(), left.productId(), left.unitPrice(), left.quantity() + right.quantity()));
                }
                bundleCount = Integer.MAX_VALUE;
                for (PriceDiscountRequirement requirement : candidate.getRequirements()) {
                    CartDiscountLine line = lineByVariant.get(requirement.getProductVariant().getId());
                    if (line == null || requirement.getRequiredQuantity() <= 0) {
                        bundleCount = 0;
                        break;
                    }
                    bundleCount = Math.min(bundleCount, line.quantity() / requirement.getRequiredQuantity());
                }
                if (bundleCount <= 0 || bundleCount == Integer.MAX_VALUE) continue;
                for (PriceDiscountRequirement requirement : candidate.getRequirements()) {
                    CartDiscountLine line = lineByVariant.get(requirement.getProductVariant().getId());
                    int qualifyingQuantity = requirement.getRequiredQuantity() * bundleCount;
                    eligibleQuantity += qualifyingQuantity;
                    eligibleSubtotal = eligibleSubtotal.add(line.unitPrice().multiply(BigDecimal.valueOf(qualifyingQuantity)));
                }
            } else {
                for (CartDiscountLine line : lines) {
                    boolean matches = candidate.getProductVariant() == null && candidate.getProduct() == null
                            || candidate.getProductVariant() != null && candidate.getProductVariant().getId().equals(line.variantId())
                            || candidate.getProductVariant() == null && candidate.getProduct() != null
                                    && candidate.getProduct().getId().equals(line.productId());
                    if (matches) {
                        eligibleQuantity += line.quantity();
                        eligibleSubtotal = eligibleSubtotal.add(line.unitPrice().multiply(BigDecimal.valueOf(line.quantity())));
                    }
                }
                if (eligibleQuantity < candidate.getMinQuantity()) continue;
            }

            if (eligibleSubtotal.compareTo(candidate.getMinOrderAmount() != null ? candidate.getMinOrderAmount() : BigDecimal.ZERO) < 0) {
                continue;
            }

            BigDecimal amount = candidate.getDiscountType() == DiscountType.PERCENTAGE
                    ? eligibleSubtotal.multiply(candidate.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    : candidate.getDiscountValue().multiply(BigDecimal.valueOf(candidate.getDiscountScope() == DiscountScope.BUNDLE ? bundleCount : 1));
            if (candidate.getMaxDiscountAmount() != null) amount = amount.min(candidate.getMaxDiscountAmount());
            amount = amount.min(eligibleSubtotal);
            if (amount.compareTo(bestAmount) > 0) {
                bestAmount = amount;
                bestDiscount = candidate;
            }
        }

        return bestDiscount == null
                ? CartDiscountResult.none()
                : new CartDiscountResult(bestDiscount.getId(), bestDiscount.getDiscountName(), bestAmount);
    }

    private void validateRequest(PriceDiscountRequest req) {
        if (req.discountValue() == null || req.discountValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Discount value must be greater than zero");
        }
        if (req.discountType() == DiscountType.PERCENTAGE && req.discountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BusinessRuleException("Percentage discount cannot exceed 100%");
        }
        if (req.validFrom() != null && req.validUntil() != null && req.validUntil().isBefore(req.validFrom())) {
            throw new BusinessRuleException("Valid until date must be after valid from date");
        }
        DiscountScope scope = req.discountScope() != null ? req.discountScope() : DiscountScope.UNIT;
        List<PriceDiscountRequirementRequest> requirements = req.requirements() != null ? req.requirements() : List.of();
        if (Boolean.TRUE.equals(req.flashSale()) && scope != DiscountScope.UNIT) {
            throw new BusinessRuleException("Flash sale must use unit discount scope");
        }
        if (scope == DiscountScope.BUNDLE) {
            if (requirements.size() < 2) throw new BusinessRuleException("Bundle discount requires at least two product variants");
            Set<UUID> variantIds = new HashSet<>();
            for (PriceDiscountRequirementRequest requirement : requirements) {
                if (requirement.productVariantId() == null || requirement.quantity() < 1
                        || !variantIds.add(requirement.productVariantId())) {
                    throw new BusinessRuleException("Bundle requirements need unique variants and positive quantities");
                }
            }
        } else if (!requirements.isEmpty()) {
            throw new BusinessRuleException("Product requirements are only valid for bundle discounts");
        }
    }

    private void applyRequestData(PriceDiscount discount, PriceDiscountRequest req) {
        Store store = null;
        if (req.storeId() != null) {
            store = storeRepository.findById(req.storeId())
                    .orElseThrow(() -> new NotFoundException("Store not found: " + req.storeId()));
        }

        Product product = null;
        if (req.productId() != null) {
            product = productRepository.findById(req.productId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + req.productId()));
        }

        ProductVariant variant = null;
        if (req.productVariantId() != null) {
            variant = variantRepository.findById(req.productVariantId())
                    .orElseThrow(() -> new NotFoundException("Product variant not found: " + req.productVariantId()));
        }

        discount.setStore(store);
        discount.setProduct(product);
        discount.setProductVariant(variant);
        discount.setDiscountName(req.discountName().trim());
        discount.setDiscountType(req.discountType());
        discount.setDiscountScope(req.discountScope() != null ? req.discountScope() : DiscountScope.UNIT);
        discount.setDiscountValue(req.discountValue());
        discount.setMinOrderAmount(req.minOrderAmount() != null ? req.minOrderAmount() : BigDecimal.ZERO);
        discount.setMaxDiscountAmount(req.maxDiscountAmount());
        discount.setMinQuantity(req.minQuantity() != null && req.minQuantity() > 0 ? req.minQuantity() : 1);
        discount.setValidFrom(req.validFrom());
        discount.setValidUntil(req.validUntil());
        if (req.active() != null) {
            discount.setActive(req.active());
        }
        discount.setFlashSale(Boolean.TRUE.equals(req.flashSale()));
        discount.setPriority(req.priority() != null ? req.priority() : 0);
        discount.setNotes(req.notes());

        discount.getRequirements().clear();
        if (req.requirements() != null) {
            for (PriceDiscountRequirementRequest requirementRequest : req.requirements()) {
                ProductVariant requiredVariant = variantRepository.findById(requirementRequest.productVariantId())
                        .orElseThrow(() -> new NotFoundException("Product variant not found: " + requirementRequest.productVariantId()));
                PriceDiscountRequirement requirement = new PriceDiscountRequirement();
                requirement.setPriceDiscount(discount);
                requirement.setProductVariant(requiredVariant);
                requirement.setRequiredQuantity(requirementRequest.quantity());
                discount.getRequirements().add(requirement);
            }
        }
    }
}

