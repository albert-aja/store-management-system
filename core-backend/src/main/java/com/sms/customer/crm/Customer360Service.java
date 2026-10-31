package com.sms.customer.crm;

import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.customer.Customer;
import com.sms.customer.CustomerRepository;
import com.sms.customer.crm.dto.*;
import com.sms.delivery.DeliveryOrder;
import com.sms.delivery.DeliveryOrderRepository;
import com.sms.finance.CustomerPayment;
import com.sms.finance.CustomerPaymentRepository;
import com.sms.finance.Receivable;
import com.sms.finance.ReceivableInstallment;
import com.sms.finance.ReceivableRepository;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.repossession.StockReturn;
import com.sms.repossession.StockReturnRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderRepository;
import com.sms.survey.Survey;
import com.sms.survey.SurveyRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class Customer360Service {

    private final CustomerRepository customerRepository;
    private final CustomerTagRepository customerTagRepository;
    private final CustomerInteractionRepository interactionRepository;
    private final CustomerFollowUpRepository followUpRepository;
    private final CustomerPromiseToPayRepository ptpRepository;
    private final StoreCreditEntryRepository storeCreditRepository;
    private final StoreVoucherRepository storeVoucherRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final CustomerPaymentRepository paymentRepository;
    private final ReceivableRepository receivableRepository;
    private final DeliveryOrderRepository deliveryOrderRepository;
    private final StockReturnRepository stockReturnRepository;
    private final SurveyRepository surveyRepository;
    private final EmployeeRepository employeeRepository;
    private final com.sms.sales.SalesOrderItemRepository salesOrderItemRepository;

    @Transactional(readOnly = true)
    public Customer360Response getCustomer360Summary(UUID customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));

        // 1. Recalculate metrics & credit score
        List<SalesOrder> orders = salesOrderRepository.search(null, customerId, null);
        List<CustomerPayment> payments = paymentRepository.findByCustomerIdOrderByPaidAtDesc(customerId);
        List<Receivable> receivables = receivableRepository.findByCustomerId(customerId);
        List<StockReturn> repossessions = stockReturnRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);

        Map<UUID, BigDecimal> orderTotals = new HashMap<>();
        boolean hasCreditOrder = false;

        BigDecimal clv = BigDecimal.ZERO;
        for (SalesOrder o : orders) {
            List<com.sms.sales.SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(o.getId());
            BigDecimal tot = items.stream()
                    .map(it -> it.getFinalPrice().multiply(BigDecimal.valueOf(it.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            orderTotals.put(o.getId(), tot);

            if (o.getStatus() != com.sms.sales.SalesOrderStatus.CANCELLED) {
                clv = clv.add(tot);
            }
            if (items.stream().anyMatch(it -> it.getPaymentTermMonths() > 0)) {
                hasCreditOrder = true;
            }
        }

        // Credit Reliability Score Calculation
        int scorePoints = 85; // baseline B
        boolean hasRepossession = !repossessions.isEmpty();
        boolean hasOverdue = false;

        for (Receivable r : receivables) {
            for (ReceivableInstallment inst : r.getInstallments()) {
                if (inst.getDueDate().isBefore(LocalDate.now()) && inst.getAmountPaid().compareTo(inst.getAmountDue()) < 0) {
                    hasOverdue = true;
                    scorePoints -= 15;
                } else if (inst.getAmountPaid().compareTo(inst.getAmountDue()) >= 0) {
                    scorePoints += 3;
                }
            }
        }

        if (hasRepossession) {
            scorePoints = Math.min(scorePoints, 40);
        }
        scorePoints = Math.max(10, Math.min(100, scorePoints));

        String grade = "B";
        if (scorePoints >= 90) grade = "A";
        else if (scorePoints >= 75) grade = "B";
        else if (scorePoints >= 50) grade = "C";
        else grade = "D";

        // Determine Segment
        String segment = "STANDARD";
        if (hasRepossession || scorePoints < 50) {
            segment = "HIGH_DELINQUENCY_RISK";
        } else if (orders.size() >= 3 || clv.compareTo(BigDecimal.valueOf(15000000)) >= 0) {
            segment = hasCreditOrder ? "STAR_CREDIT" : "VIP_CASH";
        }

        customer.setClvAmount(clv);
        customer.setTotalOrdersCount(orders.size());
        customer.setCreditScorePoints(scorePoints);
        customer.setCreditScoreGrade(grade);
        customer.setSegment(segment);
        customerRepository.save(customer);

        // 2. Fetch tags
        List<CustomerTagResponse> tags = customerTagRepository.findByCustomerIdOrderByTagNameAsc(customerId)
                .stream().map(CustomerTagResponse::from).toList();

        // 3. Store Credit balance
        BigDecimal storeCreditBal = storeCreditRepository.findFirstByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(StoreCreditEntry::getBalanceAfter)
                .orElse(BigDecimal.ZERO);

        int activeVouchers = (int) storeVoucherRepository.findByAssignedCustomerIdOrderByValidUntilAsc(customerId)
                .stream().filter(StoreVoucher::isActive).count();

        int pendingPtps = (int) ptpRepository.countByCustomerIdAndStatus(customerId, PtpStatus.PENDING);

        List<CustomerFollowUp> followUps = followUpRepository.findByCustomerIdOrderByScheduledAtAsc(customerId);
        int pendingFollowUps = (int) followUps.stream().filter(f -> f.getStatus() == FollowUpStatus.SCHEDULED).count();

        // 4. Build Unified Chronological Timeline (J.1)
        List<TimelineEventResponse> timeline = buildTimeline(customer, orders, payments, repossessions, customerId);

        return new Customer360Response(
                customer.getId(),
                customer.getFullName(),
                customer.getNik(),
                customer.getPrimaryPhone(),
                customer.getPrimaryEmail(),
                customer.getMotherMaidenName(),
                customer.getBirthDate(),
                customer.getBirthPlace(),
                segment,
                grade,
                scorePoints,
                clv,
                orders.size(),
                storeCreditBal,
                activeVouchers,
                pendingPtps,
                pendingFollowUps,
                tags,
                timeline
        );
    }

    private List<TimelineEventResponse> buildTimeline(
            Customer customer,
            List<SalesOrder> orders,
            List<CustomerPayment> payments,
            List<StockReturn> returns,
            UUID customerId
    ) {
        List<TimelineEventResponse> events = new ArrayList<>();

        // Sales Orders
        for (SalesOrder o : orders) {
            List<com.sms.sales.SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(o.getId());
            BigDecimal tot = items.stream()
                    .map(it -> it.getFinalPrice().multiply(BigDecimal.valueOf(it.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            events.add(new TimelineEventResponse(
                    "SO-" + o.getId(),
                    "SALES_ORDER",
                    "Pesanan Penjualan #" + o.getNumber(),
                    "Total: Rp " + tot.toPlainString() + " • Status: " + o.getStatus(),
                    o.getStatus().name(),
                    o.getCreatedAt(),
                    o.getNumber(),
                    o.getId(),
                    "#2563eb"
            ));

            // Surveys linked to SO
            surveyRepository.findBySalesOrderId(o.getId()).ifPresent(s -> {
                events.add(new TimelineEventResponse(
                        "SURVEY-" + s.getId(),
                        "SURVEY",
                        "Survei Kelayakan Kredit",
                        "Hasil Survei Lapangan: " + s.getStatus() + (s.getDecisionNotes() != null ? " • " + s.getDecisionNotes() : ""),
                        s.getStatus().name(),
                        s.getCreatedAt(),
                        o.getNumber(),
                        s.getId(),
                        "#8b5cf6"
                ));
            });

            // Deliveries linked to SO
            List<DeliveryOrder> dos = deliveryOrderRepository.findBySalesOrderIdOrderByCreatedAtDesc(o.getId());
            for (DeliveryOrder d : dos) {
                events.add(new TimelineEventResponse(
                        "DO-" + d.getId(),
                        "DELIVERY",
                        "Pengiriman Surat Jalan #" + d.getDeliveryOrderNumber(),
                        "Status: " + d.getStatus() + " • Penerima: " + d.getRecipientName(),
                        d.getStatus().name(),
                        d.getCreatedAt(),
                        d.getDeliveryOrderNumber(),
                        d.getId(),
                        "#0ea5e9"
                ));
            }
        }

        // Payments
        for (CustomerPayment p : payments) {
            Instant payTime = p.getPaidAt() != null ? p.getPaidAt() : p.getCreatedAt();
            events.add(new TimelineEventResponse(
                    "PAY-" + p.getId(),
                    "PAYMENT",
                    "Pembayaran #" + p.getPaymentNumber(),
                    "Nominal: Rp " + p.getAmount() + " • Metode: " + p.getPaymentMethod() + " (" + p.getPaymentType() + ")",
                    "SUCCESS",
                    payTime,
                    p.getPaymentNumber(),
                    p.getId(),
                    "#10b981"
            ));
        }

        // Returns / Repossessions
        for (StockReturn r : returns) {
            events.add(new TimelineEventResponse(
                    "RET-" + r.getId(),
                    "REPOSSESSION",
                    "Penarikan/Retur Unit #" + r.getReturnNumber(),
                    "Alasan: " + r.getReason() + " • Tipe: " + r.getReturnType(),
                    r.getStatus().name(),
                    r.getCreatedAt(),
                    r.getReturnNumber(),
                    r.getId(),
                    "#ef4444"
            ));
        }

        // Interactions (J.6)
        List<CustomerInteraction> interactions = interactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        for (CustomerInteraction ci : interactions) {
            events.add(new TimelineEventResponse(
                    "INT-" + ci.getId(),
                    "INTERACTION",
                    "Interaksi " + ci.getChannel() + " (" + ci.getDirection() + ")",
                    ci.getSummary() + " • Hasil: " + ci.getOutcome(),
                    ci.getOutcome().name(),
                    ci.getCreatedAt(),
                    ci.getChannel().name(),
                    ci.getId(),
                    "#f59e0b"
            ));
        }

        // Promise to Pay (J.3)
        List<CustomerPromiseToPay> ptps = ptpRepository.findByCustomerIdOrderByPromisedDateDesc(customerId);
        for (CustomerPromiseToPay ptp : ptps) {
            Instant ptpInstant = ptp.getPromisedDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
            events.add(new TimelineEventResponse(
                    "PTP-" + ptp.getId(),
                    "PTP",
                    "Janji Bayar (PTP) - " + ptp.getPromisedDate(),
                    "Nominal Dijanjikan: Rp " + ptp.getPromisedAmount() + " • Status: " + ptp.getStatus(),
                    ptp.getStatus().name(),
                    ptp.getCreatedAt() != null ? ptp.getCreatedAt() : ptpInstant,
                    ptp.getStatus().name(),
                    ptp.getId(),
                    "#ec4899"
            ));
        }

        // Follow ups (J.7)
        List<CustomerFollowUp> followUps = followUpRepository.findByCustomerIdOrderByScheduledAtAsc(customerId);
        for (CustomerFollowUp fu : followUps) {
            events.add(new TimelineEventResponse(
                    "FU-" + fu.getId(),
                    "FOLLOW_UP",
                    "Pengingat Tindak Lanjut: " + fu.getTitle(),
                    "Tipe: " + fu.getFollowUpType() + " • Status: " + fu.getStatus(),
                    fu.getStatus().name(),
                    fu.getScheduledAt(),
                    fu.getFollowUpType().name(),
                    fu.getId(),
                    "#6366f1"
            ));
        }

        // Store credit entries (J.5)
        List<StoreCreditEntry> credits = storeCreditRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        for (StoreCreditEntry sc : credits) {
            events.add(new TimelineEventResponse(
                    "SC-" + sc.getId(),
                    "STORE_CREDIT",
                    "Store Credit " + sc.getEntryType(),
                    "Nominal: Rp " + sc.getAmount() + " • Saldo Akhir: Rp " + sc.getBalanceAfter() + " (" + (sc.getNotes() != null ? sc.getNotes() : "") + ")",
                    sc.getEntryType().name(),
                    sc.getCreatedAt(),
                    sc.getEntryType().name(),
                    sc.getId(),
                    "#14b8a6"
            ));
        }

        // Sort descending by timestamp
        events.sort((a, b) -> b.timestamp().compareTo(a.timestamp()));
        return events;
    }

    // --- Omnichannel Interaction (J.6) ---
    @Transactional(readOnly = true)
    public List<InteractionResponse> listInteractions(UUID customerId) {
        return interactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream().map(InteractionResponse::from).toList();
    }

    public InteractionResponse logInteraction(UUID customerId, InteractionRequest request, UUID employeeId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));
        Employee employee = employeeId != null ? employeeRepository.findById(employeeId).orElse(null) : null;

        CustomerInteraction interaction = new CustomerInteraction();
        interaction.setCustomer(customer);
        interaction.setChannel(request.channel());
        interaction.setDirection(request.direction());
        interaction.setSummary(request.summary());
        interaction.setDetails(request.details());
        interaction.setOutcome(request.outcome() != null ? request.outcome() : InteractionOutcome.NEUTRAL);
        interaction.setRecordedBy(employee);

        return InteractionResponse.from(interactionRepository.save(interaction));
    }

    // --- Follow-Up Reminders (J.7) ---
    @Transactional(readOnly = true)
    public List<FollowUpResponse> listFollowUps(UUID customerId) {
        return followUpRepository.findByCustomerIdOrderByScheduledAtAsc(customerId)
                .stream().map(FollowUpResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> listPendingFollowUps() {
        return followUpRepository.findByStatusOrderByScheduledAtAsc(FollowUpStatus.SCHEDULED)
                .stream().map(FollowUpResponse::from).toList();
    }

    public FollowUpResponse createFollowUp(UUID customerId, FollowUpRequest request, UUID employeeId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));
        Employee assigned = request.assignedEmployeeId() != null
                ? employeeRepository.findById(request.assignedEmployeeId()).orElse(null)
                : (employeeId != null ? employeeRepository.findById(employeeId).orElse(null) : null);

        CustomerFollowUp followUp = new CustomerFollowUp();
        followUp.setCustomer(customer);
        followUp.setTitle(request.title());
        followUp.setFollowUpType(request.followUpType());
        followUp.setScheduledAt(request.scheduledAt());
        followUp.setAssignedEmployee(assigned);
        followUp.setNotes(request.notes());
        followUp.setStatus(FollowUpStatus.SCHEDULED);

        return FollowUpResponse.from(followUpRepository.save(followUp));
    }

    public FollowUpResponse completeFollowUp(UUID followUpId, String notes) {
        CustomerFollowUp followUp = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new NotFoundException("Follow-up not found: " + followUpId));
        followUp.setStatus(FollowUpStatus.COMPLETED);
        followUp.setCompletedAt(Instant.now());
        if (notes != null && !notes.isBlank()) {
            String existing = followUp.getNotes() != null ? followUp.getNotes() + "\n" : "";
            followUp.setNotes(existing + "[Completed]: " + notes);
        }
        return FollowUpResponse.from(followUpRepository.save(followUp));
    }

    public FollowUpResponse cancelFollowUp(UUID followUpId) {
        CustomerFollowUp followUp = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new NotFoundException("Follow-up not found: " + followUpId));
        followUp.setStatus(FollowUpStatus.CANCELLED);
        return FollowUpResponse.from(followUpRepository.save(followUp));
    }

    // --- Promise-to-Pay (PTP) (J.3) ---
    @Transactional(readOnly = true)
    public List<PtpResponse> listPtps(UUID customerId) {
        return ptpRepository.findByCustomerIdOrderByPromisedDateDesc(customerId)
                .stream().map(PtpResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PtpResponse> listPendingPtps() {
        return ptpRepository.findByStatusOrderByPromisedDateAsc(PtpStatus.PENDING)
                .stream().map(PtpResponse::from).toList();
    }

    public PtpResponse recordPtp(UUID customerId, PtpRequest request, UUID employeeId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));
        SalesOrder so = request.salesOrderId() != null
                ? salesOrderRepository.findById(request.salesOrderId()).orElse(null)
                : null;
        Employee employee = employeeId != null ? employeeRepository.findById(employeeId).orElse(null) : null;

        CustomerPromiseToPay ptp = new CustomerPromiseToPay();
        ptp.setCustomer(customer);
        ptp.setSalesOrder(so);
        ptp.setPromisedAmount(request.promisedAmount());
        ptp.setPromisedDate(request.promisedDate());
        ptp.setNotes(request.notes());
        ptp.setRecordedBy(employee);
        ptp.setStatus(PtpStatus.PENDING);

        return PtpResponse.from(ptpRepository.save(ptp));
    }

    public PtpResponse updatePtpStatus(UUID ptpId, PtpStatus status, String notes) {
        CustomerPromiseToPay ptp = ptpRepository.findById(ptpId)
                .orElseThrow(() -> new NotFoundException("PTP record not found: " + ptpId));
        ptp.setStatus(status);
        ptp.setResolvedAt(Instant.now());
        if (notes != null && !notes.isBlank()) {
            String existing = ptp.getNotes() != null ? ptp.getNotes() + "\n" : "";
            ptp.setNotes(existing + "[Resolution]: " + notes);
        }
        return PtpResponse.from(ptpRepository.save(ptp));
    }

    // --- Store Credit Ledger (J.5) ---
    @Transactional(readOnly = true)
    public BigDecimal getStoreCreditBalance(UUID customerId) {
        return storeCreditRepository.findFirstByCustomerIdOrderByCreatedAtDesc(customerId)
                .map(StoreCreditEntry::getBalanceAfter)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public List<StoreCreditResponse> listStoreCreditEntries(UUID customerId) {
        return storeCreditRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream().map(StoreCreditResponse::from).toList();
    }

    public StoreCreditResponse grantStoreCredit(UUID customerId, StoreCreditRequest request, UUID employeeId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));
        BigDecimal currentBal = getStoreCreditBalance(customerId);
        BigDecimal newBal = currentBal.add(request.amount());

        StoreCreditEntry entry = new StoreCreditEntry();
        entry.setCustomer(customer);
        entry.setEntryType(StoreCreditType.GRANT);
        entry.setAmount(request.amount());
        entry.setBalanceAfter(newBal);
        entry.setReferenceType(request.referenceType() != null ? request.referenceType() : "MANUAL_GRANT");
        entry.setReferenceId(request.referenceId());
        entry.setNotes(request.reason());
        entry.setCreatedBy(employeeId);

        return StoreCreditResponse.from(storeCreditRepository.save(entry));
    }

    public StoreCreditResponse redeemStoreCredit(UUID customerId, StoreCreditRequest request, UUID employeeId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));
        BigDecimal currentBal = getStoreCreditBalance(customerId);
        if (currentBal.compareTo(request.amount()) < 0) {
            throw new ConflictException("Insufficient store credit balance. Current: Rp " + currentBal + ", requested: Rp " + request.amount());
        }
        BigDecimal newBal = currentBal.subtract(request.amount());

        StoreCreditEntry entry = new StoreCreditEntry();
        entry.setCustomer(customer);
        entry.setEntryType(StoreCreditType.REDEEM);
        entry.setAmount(request.amount());
        entry.setBalanceAfter(newBal);
        entry.setReferenceType(request.referenceType() != null ? request.referenceType() : "SALES_ORDER");
        entry.setReferenceId(request.referenceId());
        entry.setNotes(request.reason());
        entry.setCreatedBy(employeeId);

        return StoreCreditResponse.from(storeCreditRepository.save(entry));
    }

    // --- Customer Tags (J.2) ---
    @Transactional(readOnly = true)
    public List<CustomerTagResponse> listTags(UUID customerId) {
        return customerTagRepository.findByCustomerIdOrderByTagNameAsc(customerId)
                .stream().map(CustomerTagResponse::from).toList();
    }

    public CustomerTagResponse addTag(UUID customerId, CustomerTagRequest request, UUID employeeId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));
        String name = request.tagName().trim().toUpperCase();

        Optional<CustomerTag> existing = customerTagRepository.findByCustomerIdAndTagNameIgnoreCase(customerId, name);
        if (existing.isPresent()) {
            return CustomerTagResponse.from(existing.get());
        }

        CustomerTag tag = new CustomerTag();
        tag.setCustomer(customer);
        tag.setTagName(name);
        tag.setColor(request.color() != null && !request.color().isBlank() ? request.color() : "#1976d2");
        tag.setCreatedBy(employeeId);

        return CustomerTagResponse.from(customerTagRepository.save(tag));
    }

    public void removeTag(UUID customerId, String tagName) {
        customerTagRepository.deleteByCustomerIdAndTagNameIgnoreCase(customerId, tagName.trim());
    }

    // --- Fuzzy Duplicate Customer Detection (J.4) ---
    @Transactional(readOnly = true)
    public List<DuplicateMatchResult> findFuzzyDuplicates(DuplicateCheckRequest request) {
        List<Customer> all = customerRepository.findAll();
        List<DuplicateMatchResult> matches = new ArrayList<>();

        String cleanNik = normalize(request.nik());
        String cleanPhone = normalizePhone(request.phone());
        String cleanName = normalize(request.fullName());
        String cleanMother = normalize(request.motherMaidenName());

        for (Customer c : all) {
            if (request.currentCustomerId() != null && request.currentCustomerId().equals(c.getId())) {
                continue;
            }

            int score = 0;
            List<String> reasons = new ArrayList<>();

            // 1. Exact NIK check
            if (!cleanNik.isBlank() && cleanNik.equals(normalize(c.getNik()))) {
                score += 100;
                reasons.add("Exact Indonesian National ID (NIK) match");
            }

            // 2. Normalized Phone check
            if (!cleanPhone.isBlank()) {
                String targetPhone = normalizePhone(c.getPrimaryPhone());
                if (!targetPhone.isBlank() && (cleanPhone.equals(targetPhone) || targetPhone.endsWith(cleanPhone) || cleanPhone.endsWith(targetPhone))) {
                    score += 65;
                    reasons.add("Identical or matching phone contact number");
                }
            }

            // 3. Mother's Maiden Name check
            if (!cleanMother.isBlank() && c.getMotherMaidenName() != null) {
                if (cleanMother.equalsIgnoreCase(normalize(c.getMotherMaidenName()))) {
                    score += 35;
                    reasons.add("Identical Mother's Maiden Name");
                }
            }

            // 4. Name similarity
            if (!cleanName.isBlank() && c.getFullName() != null) {
                String targetName = normalize(c.getFullName());
                if (cleanName.equalsIgnoreCase(targetName)) {
                    score += 50;
                    reasons.add("Exact customer full name match");
                } else if (cleanName.contains(targetName) || targetName.contains(cleanName)) {
                    score += 30;
                    reasons.add("Partial substring customer name match");
                } else {
                    double similarity = calculateDiceCoefficient(cleanName, targetName);
                    if (similarity >= 0.70) {
                        score += (int) (similarity * 40);
                        reasons.add(String.format("Phonetic/character similarity (%.0f%% match)", similarity * 100));
                    }
                }
            }

            if (score >= 40) {
                matches.add(new DuplicateMatchResult(
                        c.getId(),
                        c.getFullName(),
                        c.getNik(),
                        c.getPrimaryPhone(),
                        Math.min(100, score),
                        reasons
                ));
            }
        }

        matches.sort((a, b) -> Integer.compare(b.matchScorePercent(), a.matchScorePercent()));
        return matches;
    }

    private String normalize(String s) {
        return s == null ? "" : s.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private String normalizePhone(String p) {
        if (p == null) return "";
        String digits = p.replaceAll("[^0-9]", "");
        if (digits.startsWith("62")) {
            digits = "0" + digits.substring(2);
        }
        return digits;
    }

    /** Bigram Dice coefficient for fuzzy name similarity */
    private double calculateDiceCoefficient(String s1, String s2) {
        if (s1.length() < 2 || s2.length() < 2) return 0.0;
        Set<String> n1 = new HashSet<>();
        for (int i = 0; i < s1.length() - 1; i++) n1.add(s1.substring(i, i + 2));
        Set<String> n2 = new HashSet<>();
        for (int i = 0; i < s2.length() - 1; i++) n2.add(s2.substring(i, i + 2));

        Set<String> intersection = new HashSet<>(n1);
        intersection.retainAll(n2);
        return (2.0 * intersection.size()) / (n1.size() + n2.size());
    }
}
