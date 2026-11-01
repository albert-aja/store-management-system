package com.sms.payroll;

import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.payroll.dto.CommissionTierDto;
import com.sms.payroll.dto.CommissionTierRequest;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommissionTierService {

    private final CommissionTierRepository commissionTierRepository;
    private final StoreRepository storeRepository;

    @Transactional(readOnly = true)
    public List<CommissionTierDto> getAllTiers() {
        return commissionTierRepository.findAllByOrderByDisplayOrderAscMinSalesVolumeAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CommissionTier> getActiveTiers(UUID storeId) {
        List<CommissionTier> tiers;
        if (storeId != null) {
            tiers = commissionTierRepository.findAllByStoreIdAndIsActiveTrueOrderByMinSalesVolumeAsc(storeId);
            if (tiers.isEmpty()) {
                tiers = commissionTierRepository.findAllByIsActiveTrueOrderByMinSalesVolumeAsc();
            }
        } else {
            tiers = commissionTierRepository.findAllByIsActiveTrueOrderByMinSalesVolumeAsc();
        }

        if (tiers.isEmpty()) {
            return getDefaultTiers();
        }
        return tiers;
    }

    @Transactional
    public CommissionTierDto createTier(CommissionTierRequest request) {
        Store store = null;
        if (request.getStoreId() != null) {
            store = storeRepository.findById(request.getStoreId())
                    .orElseThrow(() -> new EntityNotFoundException("Store not found: " + request.getStoreId()));
        }

        CommissionTier tier = CommissionTier.builder()
                .tierName(request.getTierName())
                .minSalesVolume(request.getMinSalesVolume())
                .maxSalesVolume(request.getMaxSalesVolume())
                .commissionRate(request.getCommissionRate())
                .colorCode(request.getColorCode() != null && !request.getColorCode().isBlank()
                        ? request.getColorCode() : "#CD7F32")
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 1)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .store(store)
                .build();

        return toDto(commissionTierRepository.save(tier));
    }

    @Transactional
    public CommissionTierDto updateTier(UUID id, CommissionTierRequest request) {
        CommissionTier tier = commissionTierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Commission tier not found: " + id));

        tier.setTierName(request.getTierName());
        tier.setMinSalesVolume(request.getMinSalesVolume());
        tier.setMaxSalesVolume(request.getMaxSalesVolume());
        tier.setCommissionRate(request.getCommissionRate());
        if (request.getColorCode() != null && !request.getColorCode().isBlank()) {
            tier.setColorCode(request.getColorCode());
        }
        if (request.getDisplayOrder() != null) {
            tier.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            tier.setActive(request.getIsActive());
        }
        if (request.getStoreId() != null) {
            Store store = storeRepository.findById(request.getStoreId())
                    .orElseThrow(() -> new EntityNotFoundException("Store not found: " + request.getStoreId()));
            tier.setStore(store);
        } else {
            tier.setStore(null);
        }

        return toDto(commissionTierRepository.save(tier));
    }

    @Transactional
    public void deleteTier(UUID id) {
        CommissionTier tier = commissionTierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Commission tier not found: " + id));
        commissionTierRepository.delete(tier);
    }

    public TierEvaluation evaluateSalesVolume(BigDecimal volume, UUID storeId) {
        final BigDecimal safeVol = volume != null ? volume : BigDecimal.ZERO;
        List<CommissionTier> activeTiers = new java.util.ArrayList<>(getActiveTiers(storeId));
        activeTiers.sort(Comparator.comparing(CommissionTier::getMinSalesVolume));

        CommissionTier current = null;
        CommissionTier next = null;

        for (int i = 0; i < activeTiers.size(); i++) {
            CommissionTier t = activeTiers.get(i);
            boolean aboveMin = safeVol.compareTo(t.getMinSalesVolume()) >= 0;
            boolean belowMax = t.getMaxSalesVolume() == null || safeVol.compareTo(t.getMaxSalesVolume()) < 0;

            if (aboveMin && belowMax) {
                current = t;
                if (i + 1 < activeTiers.size()) {
                    next = activeTiers.get(i + 1);
                }
                break;
            } else if (safeVol.compareTo(t.getMinSalesVolume()) < 0) {
                // Volume has not reached tier i yet
                if (current == null && i == 0) {
                    current = t; // Default to lowest tier
                    if (i + 1 < activeTiers.size()) {
                        next = activeTiers.get(i + 1);
                    }
                }
                break;
            }
        }

        if (current == null && !activeTiers.isEmpty()) {
            current = activeTiers.get(activeTiers.size() - 1);
        }

        BigDecimal rate = current != null ? current.getCommissionRate() : new BigDecimal("0.0100");
        BigDecimal commission = safeVol.multiply(rate).setScale(2, RoundingMode.HALF_UP);

        BigDecimal needed = BigDecimal.ZERO;
        double progress = 1.0;
        if (next != null) {
            needed = next.getMinSalesVolume().subtract(safeVol).max(BigDecimal.ZERO);
            BigDecimal span = next.getMinSalesVolume().subtract(current.getMinSalesVolume());
            if (span.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal gained = safeVol.subtract(current.getMinSalesVolume()).max(BigDecimal.ZERO);
                progress = gained.divide(span, 4, RoundingMode.HALF_UP).doubleValue();
            } else {
                progress = 0.0;
            }
        }

        return new TierEvaluation(current, next, commission, needed, Math.min(1.0, Math.max(0.0, progress)));
    }

    private CommissionTierDto toDto(CommissionTier entity) {
        return CommissionTierDto.builder()
                .id(entity.getId())
                .tierName(entity.getTierName())
                .minSalesVolume(entity.getMinSalesVolume())
                .maxSalesVolume(entity.getMaxSalesVolume())
                .commissionRate(entity.getCommissionRate())
                .colorCode(entity.getColorCode())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.isActive())
                .storeId(entity.getStore() != null ? entity.getStore().getId() : null)
                .build();
    }

    private List<CommissionTier> getDefaultTiers() {
        return List.of(
                CommissionTier.builder()
                        .tierName("Bronze")
                        .minSalesVolume(BigDecimal.ZERO)
                        .maxSalesVolume(new BigDecimal("30000000.00"))
                        .commissionRate(new BigDecimal("0.0100"))
                        .colorCode("#CD7F32")
                        .displayOrder(1)
                        .isActive(true)
                        .build(),
                CommissionTier.builder()
                        .tierName("Silver")
                        .minSalesVolume(new BigDecimal("30000000.00"))
                        .maxSalesVolume(new BigDecimal("60000000.00"))
                        .commissionRate(new BigDecimal("0.0150"))
                        .colorCode("#C0C0C0")
                        .displayOrder(2)
                        .isActive(true)
                        .build(),
                CommissionTier.builder()
                        .tierName("Gold")
                        .minSalesVolume(new BigDecimal("60000000.00"))
                        .maxSalesVolume(new BigDecimal("100000000.00"))
                        .commissionRate(new BigDecimal("0.0200"))
                        .colorCode("#FFD700")
                        .displayOrder(3)
                        .isActive(true)
                        .build(),
                CommissionTier.builder()
                        .tierName("Platinum")
                        .minSalesVolume(new BigDecimal("100000000.00"))
                        .maxSalesVolume(null)
                        .commissionRate(new BigDecimal("0.0250"))
                        .colorCode("#7986CB")
                        .displayOrder(4)
                        .isActive(true)
                        .build()
        );
    }

    public record TierEvaluation(
            CommissionTier currentTier,
            CommissionTier nextTier,
            BigDecimal estimatedCommission,
            BigDecimal volumeNeeded,
            double progress
    ) {}
}
