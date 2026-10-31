package com.sms.pricing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.pricing.dto.GeneratePriceListVersionRequest;
import com.sms.pricing.dto.PriceListGroupDto;
import com.sms.pricing.dto.PriceListItemDto;
import com.sms.pricing.dto.PriceListReportResponse;
import com.sms.pricing.dto.PriceListVersionDto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PriceListVersionServiceTest {

    @Mock
    private PriceListVersionRepository versionRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private PriceListService priceListService;

    @InjectMocks
    private PriceListVersionService versionService;

    private Store store;
    private UUID storeId;

    @BeforeEach
    void setUp() {
        storeId = UUID.randomUUID();
        store = new Store();
        ReflectionTestUtils.setField(store, "id", storeId);
        store.setName("Sinar Maju Elektronik");
    }

    @Test
    void generateAndStoreVersion_createsSnapshotWithFormattedCodeAndFooter() {
        LocalDate validFrom = LocalDate.of(2026, 11, 1);
        GeneratePriceListVersionRequest request = new GeneratePriceListVersionRequest("category", validFrom, "Katalog Promosi Akhir Tahun");
        UUID createdBy = UUID.randomUUID();

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(versionRepository.countByStoreId(storeId)).thenReturn(2L);

        PriceListItemDto item = PriceListItemDto.builder()
                .variantId(UUID.randomUUID())
                .displayName("Kulkas Sharp 2 Pintu")
                .hargaDasar(BigDecimal.valueOf(3200))
                .downPayment(BigDecimal.valueOf(300))
                .build();
        PriceListGroupDto group = new PriceListGroupDto("LEMARI ES", List.of(item));
        PriceListReportResponse report = new PriceListReportResponse(storeId, store.getName(), validFrom, List.of(group));

        when(priceListService.getPriceListReport(eq(storeId), eq("category"), eq(validFrom))).thenReturn(report);

        String sampleHtml = "<html><body><table><tr><td>LEMARI ES</td></tr></table><div class=\"section-footer-valid-date\">Berlaku mulai tanggal 01 November 2026</div></body></html>";
        when(priceListService.generatePriceListHtml(eq(storeId), eq("category"), eq(validFrom))).thenReturn(sampleHtml);

        when(versionRepository.save(any(PriceListVersion.class))).thenAnswer(inv -> {
            PriceListVersion v = inv.getArgument(0);
            v.setId(UUID.randomUUID());
            return v;
        });

        PriceListVersionDto result = versionService.generateAndStoreVersion(storeId, request, createdBy);

        assertThat(result).isNotNull();
        assertThat(result.versionCode()).isEqualTo("PL-20261101-003");
        assertThat(result.validFrom()).isEqualTo(validFrom);
        assertThat(result.groupBy()).isEqualTo("category");
        assertThat(result.itemCount()).isEqualTo(1);
        assertThat(result.fileSizeBytes()).isGreaterThan(0);
        assertThat(result.notes()).isEqualTo("Katalog Promosi Akhir Tahun");
        assertThat(result.viewUrl()).contains("/view");
        assertThat(result.downloadUrl()).contains("/download");

        ArgumentCaptor<PriceListVersion> captor = ArgumentCaptor.forClass(PriceListVersion.class);
        verify(versionRepository).save(captor.capture());
        PriceListVersion saved = captor.getValue();
        assertThat(saved.getContentHtml()).isEqualTo(sampleHtml);
        assertThat(saved.getFileName()).contains("Sinar_Maju_Elektronik_category_PL-20261101-003.html");
    }

    @Test
    void getLatestStoredVersion_returnsMatchingDto() {
        PriceListVersion v = new PriceListVersion();
        v.setId(UUID.randomUUID());
        v.setStore(store);
        v.setVersionCode("PL-20261031-001");
        v.setTitle("Daftar Harga Sinar Maju Elektronik");
        v.setValidFrom(LocalDate.of(2026, 10, 31));
        v.setGroupBy("category");
        v.setFileName("Daftar_Harga.html");
        v.setFileSizeBytes(1234);
        v.setItemCount(15);

        when(versionRepository.findFirstByStoreIdAndGroupByOrderByCreatedAtDesc(storeId, "category"))
                .thenReturn(Optional.of(v));

        Optional<PriceListVersionDto> opt = versionService.getLatestStoredVersion(storeId, "category");

        assertThat(opt).isPresent();
        assertThat(opt.get().versionCode()).isEqualTo("PL-20261031-001");
        assertThat(opt.get().itemCount()).isEqualTo(15);
    }

    @Test
    void deleteVersion_removesEntity() {
        UUID versionId = UUID.randomUUID();
        PriceListVersion v = new PriceListVersion();
        v.setId(versionId);
        v.setStore(store);
        v.setVersionCode("PL-20261031-001");

        when(versionRepository.findById(versionId)).thenReturn(Optional.of(v));

        versionService.deleteVersion(versionId);

        verify(versionRepository).delete(v);
    }
}
