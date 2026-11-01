package com.sms.payroll;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.payroll.dto.CommissionTierDto;
import com.sms.payroll.dto.CommissionTierRequest;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CommissionTierServiceTest {

    @Mock
    private CommissionTierRepository commissionTierRepository;

    @Mock
    private com.sms.foundation.store.StoreRepository storeRepository;

    @InjectMocks
    private CommissionTierService commissionTierService;

    private CommissionTier bronze;
    private CommissionTier silver;
    private CommissionTier gold;
    private CommissionTier platinum;

    @BeforeEach
    void setUp() {
        bronze = CommissionTier.builder()
                .tierName("Bronze")
                .minSalesVolume(BigDecimal.ZERO)
                .maxSalesVolume(new BigDecimal("30000000.00"))
                .commissionRate(new BigDecimal("0.0100"))
                .colorCode("#CD7F32")
                .displayOrder(1)
                .isActive(true)
                .build();

        silver = CommissionTier.builder()
                .tierName("Silver")
                .minSalesVolume(new BigDecimal("30000000.00"))
                .maxSalesVolume(new BigDecimal("60000000.00"))
                .commissionRate(new BigDecimal("0.0150"))
                .colorCode("#C0C0C0")
                .displayOrder(2)
                .isActive(true)
                .build();

        gold = CommissionTier.builder()
                .tierName("Gold")
                .minSalesVolume(new BigDecimal("60000000.00"))
                .maxSalesVolume(new BigDecimal("100000000.00"))
                .commissionRate(new BigDecimal("0.0200"))
                .colorCode("#FFD700")
                .displayOrder(3)
                .isActive(true)
                .build();

        platinum = CommissionTier.builder()
                .tierName("Platinum")
                .minSalesVolume(new BigDecimal("100000000.00"))
                .maxSalesVolume(null)
                .commissionRate(new BigDecimal("0.0250"))
                .colorCode("#7986CB")
                .displayOrder(4)
                .isActive(true)
                .build();
    }

    @Test
    void evaluateSalesVolume_evaluatesBronzeTier() {
        when(commissionTierRepository.findAllByIsActiveTrueOrderByMinSalesVolumeAsc())
                .thenReturn(List.of(bronze, silver, gold, platinum));

        CommissionTierService.TierEvaluation eval = commissionTierService.evaluateSalesVolume(new BigDecimal("15000000"), null);

        assertThat(eval.currentTier().getTierName()).isEqualTo("Bronze");
        assertThat(eval.nextTier().getTierName()).isEqualTo("Silver");
        assertThat(eval.estimatedCommission()).isEqualByComparingTo(new BigDecimal("150000.00")); // 15M * 1%
        assertThat(eval.volumeNeeded()).isEqualByComparingTo(new BigDecimal("15000000.00")); // 30M - 15M
        assertThat(eval.progress()).isEqualTo(0.5); // 15M / 30M = 50%
    }

    @Test
    void evaluateSalesVolume_evaluatesSilverTier() {
        when(commissionTierRepository.findAllByIsActiveTrueOrderByMinSalesVolumeAsc())
                .thenReturn(List.of(bronze, silver, gold, platinum));

        CommissionTierService.TierEvaluation eval = commissionTierService.evaluateSalesVolume(new BigDecimal("45000000"), null);

        assertThat(eval.currentTier().getTierName()).isEqualTo("Silver");
        assertThat(eval.nextTier().getTierName()).isEqualTo("Gold");
        assertThat(eval.estimatedCommission()).isEqualByComparingTo(new BigDecimal("675000.00")); // 45M * 1.5%
        assertThat(eval.volumeNeeded()).isEqualByComparingTo(new BigDecimal("15000000.00")); // 60M - 45M
        assertThat(eval.progress()).isEqualTo(0.5); // (45M - 30M) / (60M - 30M) = 50%
    }

    @Test
    void evaluateSalesVolume_evaluatesPlatinumTierTopCap() {
        when(commissionTierRepository.findAllByIsActiveTrueOrderByMinSalesVolumeAsc())
                .thenReturn(List.of(bronze, silver, gold, platinum));

        CommissionTierService.TierEvaluation eval = commissionTierService.evaluateSalesVolume(new BigDecimal("120000000"), null);

        assertThat(eval.currentTier().getTierName()).isEqualTo("Platinum");
        assertThat(eval.nextTier()).isNull();
        assertThat(eval.estimatedCommission()).isEqualByComparingTo(new BigDecimal("3000000.00")); // 120M * 2.5%
        assertThat(eval.volumeNeeded()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(eval.progress()).isEqualTo(1.0);
    }

    @Test
    void createTier_savesAndReturnsDto() {
        CommissionTierRequest req = CommissionTierRequest.builder()
                .tierName("Diamond")
                .minSalesVolume(new BigDecimal("150000000.00"))
                .commissionRate(new BigDecimal("0.0300"))
                .colorCode("#B9F2FF")
                .displayOrder(5)
                .isActive(true)
                .build();

        CommissionTier saved = CommissionTier.builder()
                .tierName(req.getTierName())
                .minSalesVolume(req.getMinSalesVolume())
                .commissionRate(req.getCommissionRate())
                .colorCode(req.getColorCode())
                .displayOrder(5)
                .isActive(true)
                .build();

        when(commissionTierRepository.save(any(CommissionTier.class))).thenReturn(saved);

        CommissionTierDto dto = commissionTierService.createTier(req);

        assertThat(dto.getTierName()).isEqualTo("Diamond");
        assertThat(dto.getCommissionRate()).isEqualByComparingTo(new BigDecimal("0.0300"));
        verify(commissionTierRepository).save(any(CommissionTier.class));
    }

    @Test
    void deleteTier_removesTier() {
        UUID id = UUID.randomUUID();
        when(commissionTierRepository.findById(id)).thenReturn(Optional.of(bronze));

        commissionTierService.deleteTier(id);

        verify(commissionTierRepository).delete(bronze);
    }
}
