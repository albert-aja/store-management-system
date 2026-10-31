package com.sms.pricing;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.pricing.dto.GeneratePriceListVersionRequest;
import com.sms.pricing.dto.PriceListReportResponse;
import com.sms.pricing.dto.PriceListVersionDto;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceListVersionService {

    private final PriceListVersionRepository versionRepository;
    private final StoreRepository storeRepository;
    private final PriceListService priceListService;

    private static final DateTimeFormatter CODE_DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Transactional
    public PriceListVersionDto generateAndStoreVersion(
            UUID storeId,
            GeneratePriceListVersionRequest request,
            UUID createdBy) {

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));

        String groupBy = request.groupBy() != null ? request.groupBy() : "category";
        LocalDate validFrom = request.validFrom() != null ? request.validFrom() : LocalDate.now();

        // Generate report data and frozen HTML with validFrom date stamped on each page
        PriceListReportResponse report = priceListService.getPriceListReport(storeId, groupBy, validFrom);
        String html = priceListService.generatePriceListHtml(storeId, groupBy, validFrom);

        int itemCount = report.groups().stream().mapToInt(g -> g.items().size()).sum();
        long versionSequence = versionRepository.countByStoreId(storeId) + 1;
        String versionCode = String.format("PL-%s-%03d", validFrom.format(CODE_DATE_FMT), versionSequence);
        String title = String.format("Daftar Harga %s (Berlaku %s)", store.getName(), validFrom.format(PriceListService.DATE_FMT));
        String fileName = String.format("Daftar_Harga_%s_%s_%s.html",
                store.getName().replaceAll("[^a-zA-Z0-9_-]", "_"),
                groupBy,
                versionCode);

        byte[] htmlBytes = html.getBytes(StandardCharsets.UTF_8);

        PriceListVersion version = new PriceListVersion();
        version.setStore(store);
        version.setVersionCode(versionCode);
        version.setTitle(title);
        version.setValidFrom(validFrom);
        version.setGroupBy(groupBy);
        version.setFileName(fileName);
        version.setMimeType("text/html");
        version.setFileSizeBytes(htmlBytes.length);
        version.setItemCount(itemCount);
        version.setContentHtml(html);
        version.setNotes(request.notes());
        version.setCreatedBy(createdBy);

        version = versionRepository.save(version);
        log.info("Saved new Price List document version {} for store {} ({} items, {} bytes)",
                versionCode, store.getName(), itemCount, htmlBytes.length);

        return toDto(version);
    }

    @Transactional(readOnly = true)
    public List<PriceListVersionDto> listVersions(UUID storeId) {
        return versionRepository.findByStoreIdOrderByCreatedAtDesc(storeId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<PriceListVersionDto> getLatestStoredVersion(UUID storeId, String groupBy) {
        Optional<PriceListVersion> versionOpt;
        if (groupBy != null && !groupBy.isBlank()) {
            versionOpt = versionRepository.findFirstByStoreIdAndGroupByOrderByCreatedAtDesc(storeId, groupBy);
        } else {
            versionOpt = versionRepository.findFirstByStoreIdOrderByCreatedAtDesc(storeId);
        }
        return versionOpt.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public PriceListVersion getVersionEntity(UUID versionId) {
        return versionRepository.findById(versionId)
                .orElseThrow(() -> new NotFoundException("Price list version not found: " + versionId));
    }

    @Transactional(readOnly = true)
    public PriceListVersionDto getVersion(UUID versionId) {
        return toDto(getVersionEntity(versionId));
    }

    @Transactional
    public void deleteVersion(UUID versionId) {
        PriceListVersion version = getVersionEntity(versionId);
        versionRepository.delete(version);
        log.info("Deleted Price List document version {} ({})", version.getVersionCode(), versionId);
    }

    public PriceListVersionDto toDto(PriceListVersion entity) {
        UUID storeId = entity.getStore().getId();
        UUID versionId = entity.getId();
        String viewUrl = String.format("/api/stores/%s/pricing/price-list/versions/%s/view", storeId, versionId);
        String downloadUrl = String.format("/api/stores/%s/pricing/price-list/versions/%s/download", storeId, versionId);

        return PriceListVersionDto.builder()
                .id(entity.getId())
                .storeId(storeId)
                .storeName(entity.getStore().getName())
                .versionCode(entity.getVersionCode())
                .title(entity.getTitle())
                .validFrom(entity.getValidFrom())
                .groupBy(entity.getGroupBy())
                .fileName(entity.getFileName())
                .mimeType(entity.getMimeType())
                .fileSizeBytes(entity.getFileSizeBytes())
                .itemCount(entity.getItemCount())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .createdBy(entity.getCreatedBy())
                .viewUrl(viewUrl)
                .downloadUrl(downloadUrl)
                .build();
    }
}

