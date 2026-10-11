package com.sms.reporting;

import com.sms.expense.Expense;
import com.sms.expense.ExpenseRepository;
import com.sms.finance.CustodyStatus;
import com.sms.finance.CustomerPayment;
import com.sms.finance.CustomerPaymentRepository;
import com.sms.finance.InstallmentStatus;
import com.sms.finance.PaymentCustody;
import com.sms.finance.PaymentCustodyRepository;
import com.sms.finance.Receivable;
import com.sms.finance.ReceivableInstallment;
import com.sms.finance.ReceivableInstallmentRepository;
import com.sms.finance.ReceivableRepository;
import com.sms.finance.ReceivableStatus;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockLocationType;
import com.sms.inventory.StockUnit;
import com.sms.inventory.StockUnitRepository;
import com.sms.reporting.dto.CollectionAgingBucket;
import com.sms.reporting.dto.CollectionAgingSummaryResponse;
import com.sms.reporting.dto.ExecutiveOverviewResponse;
import com.sms.reporting.dto.InventoryDistributionResponse;
import com.sms.reporting.dto.OperationalExceptionItem;
import com.sms.reporting.dto.SalesPerformanceItem;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportingService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final CustomerPaymentRepository customerPaymentRepository;
    private final ReceivableRepository receivableRepository;
    private final ReceivableInstallmentRepository receivableInstallmentRepository;
    private final PaymentCustodyRepository paymentCustodyRepository;
    private final StockUnitRepository stockUnitRepository;
    private final ExpenseRepository expenseRepository;

    public ExecutiveOverviewResponse getExecutiveOverview(UUID storeId) {
        // Sales orders
        List<SalesOrder> orders = salesOrderRepository.search(storeId, null, null);
        long totalOrdersCount = orders.stream()
                .filter(so -> so.getStatus() != SalesOrderStatus.CANCELLED)
                .count();

        BigDecimal totalSalesAmount = BigDecimal.ZERO;
        for (SalesOrder so : orders) {
            if (so.getStatus() != SalesOrderStatus.CANCELLED && so.getStatus() != SalesOrderStatus.DRAFT) {
                List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(so.getId());
                for (SalesOrderItem item : items) {
                    BigDecimal lineTotal = item.getFinalPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    totalSalesAmount = totalSalesAmount.add(lineTotal);
                }
            }
        }

        // Customer payments
        List<CustomerPayment> payments = customerPaymentRepository.search(storeId, null);
        BigDecimal totalCashCollected = payments.stream()
                .map(CustomerPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Receivables
        List<Receivable> receivables = receivableRepository.search(storeId, null, null);
        BigDecimal totalOutstandingReceivables = receivables.stream()
                .filter(r -> r.getStatus() != ReceivableStatus.SETTLED_REPOSSESSION)
                .map(Receivable::getRemainingBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeCreditAccountsCount = receivables.stream()
                .filter(r -> r.getStatus() == ReceivableStatus.ACTIVE)
                .count();

        // Overdue installments
        LocalDate today = LocalDate.now();
        List<ReceivableInstallment> overdueInstallments = receivableInstallmentRepository.findOverdueInstallments(today);
        if (storeId != null) {
            overdueInstallments = overdueInstallments.stream()
                    .filter(i -> i.getReceivable().getStore().getId().equals(storeId))
                    .toList();
        }
        BigDecimal overdueReceivablesAmount = overdueInstallments.stream()
                .map(i -> i.getAmountDue().subtract(i.getAmountPaid()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Stock units
        List<StockUnit> stockUnits = stockUnitRepository.search(storeId, null, null);
        long totalStockUnitsCount = stockUnits.size();
        long warehouseUnitsCount = stockUnits.stream()
                .filter(u -> u.getLocationType() == StockLocationType.WAREHOUSE)
                .count();
        long showroomUnitsCount = stockUnits.stream()
                .filter(u -> u.getLocationType() == StockLocationType.SHOWROOM)
                .count();
        long repairUnitsCount = stockUnits.stream()
                .filter(u -> u.getLocationType() == StockLocationType.REPAIR_AREA)
                .count();

        // Expenses
        List<Expense> expenses = storeId != null ? expenseRepository.findByStoreId(storeId) : expenseRepository.findAll();
        BigDecimal totalExpensesAmount = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalOverrunExpensesCount = expenses.stream()
                .filter(Expense::isOverrun)
                .count();

        return ExecutiveOverviewResponse.builder()
                .totalSalesAmount(totalSalesAmount)
                .totalOrdersCount(totalOrdersCount)
                .totalCashCollected(totalCashCollected)
                .totalOutstandingReceivables(totalOutstandingReceivables)
                .overdueReceivablesAmount(overdueReceivablesAmount)
                .activeCreditAccountsCount(activeCreditAccountsCount)
                .totalStockUnitsCount(totalStockUnitsCount)
                .warehouseUnitsCount(warehouseUnitsCount)
                .showroomUnitsCount(showroomUnitsCount)
                .repairUnitsCount(repairUnitsCount)
                .totalExpensesAmount(totalExpensesAmount)
                .totalOverrunExpensesCount(totalOverrunExpensesCount)
                .build();
    }

    public List<SalesPerformanceItem> getSalesPerformance(UUID storeId, LocalDate startDate, LocalDate endDate) {
        List<SalesOrder> orders = salesOrderRepository.search(storeId, null, null);

        Map<UUID, SalesPerformanceItem.SalesPerformanceItemBuilder> performanceMap = new HashMap<>();

        for (SalesOrder so : orders) {
            if (so.getStatus() == SalesOrderStatus.CONFIRMED || so.getStatus() == SalesOrderStatus.RELEASED) {
                if (startDate != null && so.getCreatedAt() != null &&
                        so.getCreatedAt().isBefore(startDate.atStartOfDay().toInstant(java.time.ZoneOffset.UTC))) {
                    continue;
                }
                if (endDate != null && so.getCreatedAt() != null &&
                        so.getCreatedAt().isAfter(endDate.plusDays(1).atStartOfDay().toInstant(java.time.ZoneOffset.UTC))) {
                    continue;
                }

                if (so.getSalesperson() == null) continue;
                UUID spId = so.getSalesperson().getId();

                List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(so.getId());
                BigDecimal orderTotal = BigDecimal.ZERO;
                for (SalesOrderItem item : items) {
                    orderTotal = orderTotal.add(item.getFinalPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                }

                final BigDecimal orderVolume = orderTotal;
                performanceMap.compute(spId, (k, current) -> {
                    if (current == null) {
                        return SalesPerformanceItem.builder()
                                .salespersonId(spId)
                                .salespersonName(so.getSalesperson().getFullName())
                                .salespersonCode(so.getSalesperson().getEmployeeNumber())
                                .confirmedOrdersCount(1)
                                .totalSalesVolume(orderVolume)
                                .estimatedCommission(orderVolume.multiply(BigDecimal.valueOf(0.03)));
                    } else {
                        SalesPerformanceItem old = current.build();
                        BigDecimal newVol = old.getTotalSalesVolume().add(orderVolume);
                        return SalesPerformanceItem.builder()
                                .salespersonId(spId)
                                .salespersonName(old.getSalespersonName())
                                .salespersonCode(old.getSalespersonCode())
                                .confirmedOrdersCount(old.getConfirmedOrdersCount() + 1)
                                .totalSalesVolume(newVol)
                                .estimatedCommission(newVol.multiply(BigDecimal.valueOf(0.03)));
                    }
                });
            }
        }

        List<SalesPerformanceItem> result = new ArrayList<>();
        for (SalesPerformanceItem.SalesPerformanceItemBuilder b : performanceMap.values()) {
            result.add(b.build());
        }
        result.sort(Comparator.comparing(SalesPerformanceItem::getTotalSalesVolume).reversed());
        return result;
    }

    public CollectionAgingSummaryResponse getCollectionAging(UUID storeId) {
        LocalDate today = LocalDate.now();
        List<Receivable> receivables = receivableRepository.search(storeId, null, null);

        BigDecimal totalReceivableBalance = BigDecimal.ZERO;
        long currentCount = 0;
        BigDecimal currentAmount = BigDecimal.ZERO;

        long pastDueCount = 0; // 1-30 days
        BigDecimal pastDueAmount = BigDecimal.ZERO;

        long delinquentCount = 0; // 31-60 days
        BigDecimal delinquentAmount = BigDecimal.ZERO;

        long defaultedCount = 0; // > 60 days
        BigDecimal defaultedAmount = BigDecimal.ZERO;

        for (Receivable r : receivables) {
            if (r.getStatus() == ReceivableStatus.SETTLED_REPOSSESSION) continue;
            totalReceivableBalance = totalReceivableBalance.add(r.getRemainingBalance());

            List<ReceivableInstallment> installments =
                    receivableInstallmentRepository.findByReceivableIdOrderByInstallmentNumberAsc(r.getId());

            for (ReceivableInstallment inst : installments) {
                if (inst.getStatus() == InstallmentStatus.PAID || inst.getStatus() == InstallmentStatus.FORGIVEN) {
                    continue;
                }
                BigDecimal balance = inst.getAmountDue().subtract(inst.getAmountPaid());
                if (balance.compareTo(BigDecimal.ZERO) <= 0) continue;

                long daysOverdue = ChronoUnit.DAYS.between(inst.getDueDate(), today);
                if (daysOverdue <= 0) {
                    currentCount++;
                    currentAmount = currentAmount.add(balance);
                } else if (daysOverdue <= 30) {
                    pastDueCount++;
                    pastDueAmount = pastDueAmount.add(balance);
                } else if (daysOverdue <= 60) {
                    delinquentCount++;
                    delinquentAmount = delinquentAmount.add(balance);
                } else {
                    defaultedCount++;
                    defaultedAmount = defaultedAmount.add(balance);
                }
            }
        }

        BigDecimal totalOutstanding = currentAmount.add(pastDueAmount).add(delinquentAmount).add(defaultedAmount);
        BigDecimal totalOverdue = pastDueAmount.add(delinquentAmount).add(defaultedAmount);

        List<CollectionAgingBucket> buckets = new ArrayList<>();
        buckets.add(createBucket("Current (0-30 days / upcoming)", currentCount, currentAmount, totalOutstanding));
        buckets.add(createBucket("Past Due (1-30 days)", pastDueCount, pastDueAmount, totalOutstanding));
        buckets.add(createBucket("Delinquent (31-60 days)", delinquentCount, delinquentAmount, totalOutstanding));
        buckets.add(createBucket("Default Risk (60+ days)", defaultedCount, defaultedAmount, totalOutstanding));

        List<CustomerPayment> payments = customerPaymentRepository.search(storeId, null);
        BigDecimal totalCollectedCash = payments.stream()
                .map(CustomerPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<PaymentCustody> custodies = paymentCustodyRepository.search(null, CustodyStatus.DISCREPANCY);
        if (storeId != null) {
            custodies = custodies.stream()
                    .filter(c -> c.getCustomerPayment().getStore().getId().equals(storeId))
                    .toList();
        }

        return CollectionAgingSummaryResponse.builder()
                .buckets(buckets)
                .totalReceivableBalance(totalReceivableBalance)
                .totalOverdueBalance(totalOverdue)
                .totalCollectedCash(totalCollectedCash)
                .custodyDiscrepanciesCount(custodies.size())
                .build();
    }

    private CollectionAgingBucket createBucket(String name, long count, BigDecimal amount, BigDecimal total) {
        double pct = 0.0;
        if (total.compareTo(BigDecimal.ZERO) > 0) {
            pct = amount.divide(total, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
        }
        return CollectionAgingBucket.builder()
                .bucketName(name)
                .installmentCount(count)
                .totalAmount(amount)
                .percentage(Math.round(pct * 10.0) / 10.0)
                .build();
    }

    public InventoryDistributionResponse getInventoryDistribution(UUID storeId) {
        List<StockUnit> units = stockUnitRepository.search(storeId, null, null);

        long warehouse = 0;
        long showroom = 0;
        long repairArea = 0;
        long inTransit = 0;
        long atCustomer = 0;

        long available = 0;
        long reserved = 0;
        long unavailable = 0;

        for (StockUnit u : units) {
            if (u.getLocationType() == StockLocationType.WAREHOUSE) warehouse++;
            else if (u.getLocationType() == StockLocationType.SHOWROOM) showroom++;
            else if (u.getLocationType() == StockLocationType.REPAIR_AREA) repairArea++;
            else if (u.getLocationType() == StockLocationType.IN_TRANSIT) inTransit++;
            else if (u.getLocationType() == StockLocationType.AT_CUSTOMER) atCustomer++;

            if (u.getAvailabilityStatus() == StockAvailability.AVAILABLE) available++;
            else if (u.getAvailabilityStatus() == StockAvailability.RESERVED) reserved++;
            else if (u.getAvailabilityStatus() == StockAvailability.UNAVAILABLE) unavailable++;
        }

        return InventoryDistributionResponse.builder()
                .totalUnits(units.size())
                .warehouseUnits(warehouse)
                .showroomUnits(showroom)
                .repairAreaUnits(repairArea)
                .inTransitUnits(inTransit)
                .atCustomerUnits(atCustomer)
                .availableUnits(available)
                .reservedUnits(reserved)
                .unavailableUnits(unavailable)
                .build();
    }

    public List<OperationalExceptionItem> getOperationalExceptions(UUID storeId) {
        List<OperationalExceptionItem> exceptions = new ArrayList<>();

        // 1. Budget overrun expenses
        List<Expense> expenses = storeId != null ? expenseRepository.findByStoreId(storeId) : expenseRepository.findAll();
        for (Expense e : expenses) {
            if (e.isOverrun()) {
                exceptions.add(OperationalExceptionItem.builder()
                        .exceptionType("BUDGET_OVERRUN")
                        .title("Expense Overrun Authorization Required")
                        .severity("HIGH")
                        .referenceCode(e.getExpenseNumber())
                        .details(String.format("Expense of Rp %s exceeds allocated monthly budget category '%s'",
                                e.getAmount(), e.getExpenseCategory().getName()))
                        .actionUrl("/expenses")
                        .build());
            }
        }

        // 2. Custody discrepancies
        List<PaymentCustody> discrepancies = paymentCustodyRepository.search(null, CustodyStatus.DISCREPANCY);
        for (PaymentCustody c : discrepancies) {
            if (storeId == null || c.getCustomerPayment().getStore().getId().equals(storeId)) {
                exceptions.add(OperationalExceptionItem.builder()
                        .exceptionType("CUSTODY_DISCREPANCY")
                        .title("Cash Custody Discrepancy")
                        .severity("HIGH")
                        .referenceCode(c.getCustomerPayment().getPaymentNumber())
                        .details(String.format("Discrepancy of Rp %s recorded during cashier verification handover",
                                c.getDiscrepancyAmount() != null ? c.getDiscrepancyAmount() : BigDecimal.ZERO))
                        .actionUrl("/finance")
                        .build());
            }
        }

        // 3. Severely overdue receivables (> 60 days)
        LocalDate today = LocalDate.now();
        List<ReceivableInstallment> overdue = receivableInstallmentRepository.findOverdueInstallments(today.minusDays(60));
        for (ReceivableInstallment inst : overdue) {
            if (storeId == null || inst.getReceivable().getStore().getId().equals(storeId)) {
                BigDecimal balance = inst.getAmountDue().subtract(inst.getAmountPaid());
                exceptions.add(OperationalExceptionItem.builder()
                        .exceptionType("DEFAULT_RISK")
                        .title("Default Risk Installment (> 60 Days Overdue)")
                        .severity("MEDIUM")
                        .referenceCode(inst.getReceivable().getReceivableNumber())
                        .details(String.format("Customer %s has unpaid installment #%d of Rp %s due on %s",
                                inst.getReceivable().getCustomer().getFullName(),
                                inst.getInstallmentNumber(),
                                balance,
                                inst.getDueDate()))
                        .actionUrl("/finance")
                        .build());
            }
        }

        return exceptions;
    }

    public String generateReceivablesReportCsv(UUID storeId) {
        StringBuilder csv = new StringBuilder();
        csv.append("Receivable Number,Customer Name,Phone,Store,Total Amount,Remaining Balance,Term Months,Status,First Due Date\n");

        List<Receivable> receivables = receivableRepository.search(storeId, null, null);
        for (Receivable r : receivables) {
            csv.append(escapeCsv(r.getReceivableNumber())).append(",")
                    .append(escapeCsv(r.getCustomer().getFullName())).append(",")
                    .append(escapeCsv(r.getCustomer().getPrimaryPhone())).append(",")
                    .append(escapeCsv(r.getStore().getName())).append(",")
                    .append(r.getTotalAmount()).append(",")
                    .append(r.getRemainingBalance()).append(",")
                    .append(r.getPaymentTermMonths()).append(",")
                    .append(r.getStatus()).append(",")
                    .append(r.getFirstDueDate() != null ? r.getFirstDueDate() : "").append("\n");
        }
        return csv.toString();
    }

    public String generateSalesReportCsv(UUID storeId, LocalDate startDate, LocalDate endDate) {
        StringBuilder csv = new StringBuilder();
        csv.append("Order Number,Date,Store,Customer Name,Salesperson,Status,Total Amount,Delivery Address\n");

        List<SalesOrder> orders = salesOrderRepository.search(storeId, null, null);
        for (SalesOrder so : orders) {
            if (so.getStatus() == SalesOrderStatus.CANCELLED) continue;
            List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(so.getId());
            BigDecimal total = BigDecimal.ZERO;
            for (SalesOrderItem item : items) {
                total = total.add(item.getFinalPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }

            csv.append(escapeCsv(so.getNumber() != null ? so.getNumber() : "DRAFT")).append(",")
                    .append(so.getCreatedAt() != null ? so.getCreatedAt().toString().substring(0, 10) : "").append(",")
                    .append(escapeCsv(so.getStore().getName())).append(",")
                    .append(escapeCsv(so.getCustomer().getFullName())).append(",")
                    .append(escapeCsv(so.getSalesperson() != null ? so.getSalesperson().getFullName() : "-")).append(",")
                    .append(so.getStatus()).append(",")
                    .append(total).append(",")
                    .append(escapeCsv(so.getDeliveryAddressSnapshot() != null ? so.getDeliveryAddressSnapshot() : "")).append("\n");
        }
        return csv.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
