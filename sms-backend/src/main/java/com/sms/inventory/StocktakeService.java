package com.sms.inventory;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.employee.EmploymentStatus;
import com.sms.foundation.notification.NotificationService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class StocktakeService {

    private final StocktakeSessionRepository sessionRepository;
    private final StockUnitRepository stockUnitRepository;
    private final StoreRepository storeRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final NotificationService notificationService;

    public StocktakeSessionResponse open(UUID storeId, UUID employeeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + employeeId));

        StocktakeSession session = new StocktakeSession();
        session.setStore(store);
        session.setOpenedBy(employee);
        session.setStatus(StocktakeStatus.OPEN);
        for (StockUnit unit : stockUnitRepository.search(storeId, null, StockAvailability.AVAILABLE)) {
            StocktakeCountLine line = new StocktakeCountLine();
            line.setSession(session);
            line.setStockUnit(unit);
            line.setProductVariant(unit.getProductVariant());
            line.setScanCode(scanCode(unit));
            line.setVariantName(unit.getProductVariant().getVariantName());
            line.setExpected(true);
            line.setCounted(false);
            session.getLines().add(line);
        }
        return StocktakeSessionResponse.blind(sessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public List<StocktakeSessionResponse> list(UUID storeId) {
        return sessionRepository.findByStoreIdOrderByCreatedAtDesc(storeId).stream()
                .map(StocktakeSessionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public StocktakeSessionResponse get(UUID sessionId) {
        return StocktakeSessionResponse.from(getSession(sessionId));
    }

    public StocktakeSessionResponse submit(UUID sessionId, List<String> countedSerials) {
        StocktakeSession session = getSession(sessionId);
        if (session.getStatus() != StocktakeStatus.OPEN) {
            throw new BusinessRuleException("Only OPEN stocktake sessions can be submitted");
        }

        Set<String> counted = new HashSet<>();
        for (String serial : countedSerials) {
            if (serial == null || serial.isBlank()) {
                throw new BusinessRuleException("Scanned serials must not be blank");
            }
            if (!counted.add(serial.trim())) {
                throw new BusinessRuleException("Duplicate scanned serial: " + serial.trim());
            }
        }

        Set<String> expectedCodes = session.getLines().stream()
                .map(StocktakeCountLine::getScanCode)
                .collect(Collectors.toSet());
        for (StocktakeCountLine line : session.getLines()) {
            boolean present = counted.contains(line.getScanCode());
            line.setCounted(present);
            line.setVariance(present ? StocktakeVariance.MATCH : StocktakeVariance.MISSING);
        }
        for (String scanCode : counted) {
            if (!expectedCodes.contains(scanCode)) {
                StocktakeCountLine line = new StocktakeCountLine();
                line.setSession(session);
                line.setScanCode(scanCode);
                line.setExpected(false);
                line.setCounted(true);
                line.setVariance(StocktakeVariance.UNEXPECTED);
                session.getLines().add(line);
            }
        }

        session.setStatus(StocktakeStatus.PENDING_REVIEW);
        session.setSubmittedAt(Instant.now());
        session = sessionRepository.save(session);
        notifyReviewers(session);
        return StocktakeSessionResponse.blind(session);
    }

    public StocktakeSessionResponse review(
            UUID sessionId,
            UUID reviewerEmployeeId,
            boolean approve,
            String comment) {
        StocktakeSession session = getSession(sessionId);
        if (session.getStatus() != StocktakeStatus.PENDING_REVIEW) {
            throw new BusinessRuleException("Only PENDING_REVIEW stocktakes can be reviewed");
        }
        Employee reviewer = employeeRepository.findById(reviewerEmployeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + reviewerEmployeeId));
        session.setReviewedBy(reviewer);
        session.setReviewedAt(Instant.now());
        session.setReviewComment(comment);
        session.setStatus(approve ? StocktakeStatus.REVIEWED : StocktakeStatus.REJECTED);
        return StocktakeSessionResponse.from(sessionRepository.save(session));
    }

    private StocktakeSession getSession(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Stocktake session not found: " + sessionId));
    }

    private void notifyReviewers(StocktakeSession session) {
        List<UUID> reviewers = employeeRoleRepository.findEmployeeIdsByStoreAndPermission(
                session.getStore().getId(), "INVENTORY_MANAGE", EmploymentStatus.ACTIVE);
        if (reviewers.isEmpty()) return;
        notificationService.create(
                "STOCKTAKE",
                session.getId(),
                "Stocktake requires review",
                "A stocktake for store " + session.getStore().getCode() + " is ready for supervisor review.",
                reviewers);
    }

    private String scanCode(StockUnit unit) {
        String serial = unit.getManufacturerSerial();
        return serial == null || serial.isBlank() ? unit.getId().toString() : serial;
    }
}
