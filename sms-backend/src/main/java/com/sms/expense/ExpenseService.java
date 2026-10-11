package com.sms.expense;

import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.expense.dto.ApproveBudgetRequest;
import com.sms.expense.dto.ApproveExpenseRequest;
import com.sms.expense.dto.BudgetConsumptionResponse;
import com.sms.expense.dto.BudgetRequestResponse;
import com.sms.expense.dto.CreateBudgetRequest;
import com.sms.expense.dto.CreateExpenseCategoryRequest;
import com.sms.expense.dto.CreateExpenseRequest;
import com.sms.expense.dto.ExpenseCategoryResponse;
import com.sms.expense.dto.ExpenseResponse;
import com.sms.expense.dto.UpdateExpenseCategoryRequest;
import com.sms.foundation.numbering.DocumentNumberingService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private static final String DOC_TYPE_BUDGET = "BUDGET_REQUEST";
    private static final String DOC_TYPE_EXPENSE = "EXPENSE";

    private final ExpenseCategoryRepository categoryRepository;
    private final BudgetRequestRepository budgetRequestRepository;
    private final ExpenseRepository expenseRepository;
    private final StoreRepository storeRepository;
    private final EmployeeRepository employeeRepository;
    private final DocumentNumberingService numberingService;

    // --- 1. Expense Categories ---

    @Transactional
    public ExpenseCategoryResponse createCategory(CreateExpenseCategoryRequest req) {
        if (categoryRepository.findByCode(req.getCode().trim().toUpperCase()).isPresent()) {
            throw new ConflictException("Expense category code already exists: " + req.getCode());
        }

        ExpenseCategory cat = new ExpenseCategory();
        cat.setCode(req.getCode().trim().toUpperCase());
        cat.setName(req.getName().trim());
        cat.setDescription(req.getDescription());
        cat.setMonthlyLimit(req.getMonthlyLimit());
        cat.setRequiresReceipt(req.isRequiresReceipt());
        cat.setActive(true);

        ExpenseCategory saved = categoryRepository.save(cat);
        return ExpenseCategoryResponse.from(saved);
    }

    @Transactional
    public ExpenseCategoryResponse updateCategory(UUID id, UpdateExpenseCategoryRequest req) {
        ExpenseCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Expense category not found: " + id));

        if (req.getName() != null) {
            cat.setName(req.getName().trim());
        }
        if (req.getDescription() != null) {
            cat.setDescription(req.getDescription());
        }
        if (req.getMonthlyLimit() != null) {
            cat.setMonthlyLimit(req.getMonthlyLimit());
        }
        if (req.getRequiresReceipt() != null) {
            cat.setRequiresReceipt(req.getRequiresReceipt());
        }
        if (req.getActive() != null) {
            cat.setActive(req.getActive());
        }

        ExpenseCategory saved = categoryRepository.save(cat);
        return ExpenseCategoryResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ExpenseCategoryResponse> listCategories(boolean activeOnly) {
        List<ExpenseCategory> list = activeOnly
                ? categoryRepository.findByActiveTrue()
                : categoryRepository.findAll();
        return list.stream().map(ExpenseCategoryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ExpenseCategoryResponse getCategory(UUID id) {
        ExpenseCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Expense category not found: " + id));
        return ExpenseCategoryResponse.from(cat);
    }

    // --- 2. Budget Requests ---

    @Transactional
    public BudgetRequestResponse createBudgetRequest(CreateBudgetRequest req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + req.getStoreId()));
        ExpenseCategory cat = categoryRepository.findById(req.getExpenseCategoryId())
                .orElseThrow(() -> new NotFoundException("Expense category not found: " + req.getExpenseCategoryId()));
        Employee requester = employeeRepository.findById(req.getRequestedById())
                .orElseThrow(() -> new NotFoundException("Requester employee not found: " + req.getRequestedById()));

        budgetRequestRepository.findByStoreIdAndExpenseCategoryIdAndPeriodMonthAndPeriodYear(
                store.getId(), cat.getId(), req.getPeriodMonth(), req.getPeriodYear()
        ).ifPresent(existing -> {
            throw new ConflictException("Budget request already exists for this store, category and period");
        });

        String docNumber = numberingService.nextNumber(store.getId(), DOC_TYPE_BUDGET);

        BudgetRequest b = new BudgetRequest();
        b.setRequestNumber(docNumber);
        b.setStore(store);
        b.setExpenseCategory(cat);
        b.setPeriodMonth(req.getPeriodMonth());
        b.setPeriodYear(req.getPeriodYear());
        b.setRequestedAmount(req.getRequestedAmount());
        b.setApprovedAmount(BigDecimal.ZERO);
        b.setStatus(BudgetRequestStatus.SUBMITTED);
        b.setRequestedBy(requester);
        b.setJustification(req.getJustification());
        b.setNotes(req.getNotes());

        BudgetRequest saved = budgetRequestRepository.save(b);
        return BudgetRequestResponse.from(saved);
    }

    @Transactional
    public BudgetRequestResponse approveBudgetRequest(UUID id, ApproveBudgetRequest req) {
        BudgetRequest b = budgetRequestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Budget request not found: " + id));
        Employee approver = employeeRepository.findById(req.getApprovedById())
                .orElseThrow(() -> new NotFoundException("Approver employee not found: " + req.getApprovedById()));

        if (req.isApproved()) {
            b.setStatus(BudgetRequestStatus.APPROVED);
            b.setApprovedAmount(req.getApprovedAmount() != null ? req.getApprovedAmount() : b.getRequestedAmount());
        } else {
            b.setStatus(BudgetRequestStatus.REJECTED);
            b.setApprovedAmount(BigDecimal.ZERO);
        }
        b.setApprovedBy(approver);
        if (req.getNotes() != null) {
            b.setNotes(req.getNotes());
        }

        BudgetRequest saved = budgetRequestRepository.save(b);
        return BudgetRequestResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<BudgetRequestResponse> listBudgetRequests(UUID storeId, Integer year, Integer month) {
        List<BudgetRequest> list;
        if (storeId != null && year != null && month != null) {
            list = budgetRequestRepository.findByStoreIdAndPeriodYearAndPeriodMonth(storeId, year, month);
        } else if (storeId != null) {
            list = budgetRequestRepository.findByStoreId(storeId);
        } else {
            list = budgetRequestRepository.findAll();
        }
        return list.stream().map(BudgetRequestResponse::from).toList();
    }

    // --- 3. Expenses ---

    @Transactional
    public ExpenseResponse createExpense(CreateExpenseRequest req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + req.getStoreId()));
        ExpenseCategory cat = categoryRepository.findById(req.getExpenseCategoryId())
                .orElseThrow(() -> new NotFoundException("Expense category not found: " + req.getExpenseCategoryId()));
        Employee creator = employeeRepository.findById(req.getCreatedById())
                .orElseThrow(() -> new NotFoundException("Creator employee not found: " + req.getCreatedById()));

        int month = req.getExpenseDate().getMonthValue();
        int year = req.getExpenseDate().getYear();

        YearMonth ym = YearMonth.of(year, month);
        LocalDate startOfMonth = ym.atDay(1);
        LocalDate endOfMonth = ym.atEndOfMonth();

        // 1. Calculate spent to date in this month for this category
        List<Expense> committed = expenseRepository.findCommittedExpenses(
                store.getId(), cat.getId(), startOfMonth, endOfMonth
        );
        BigDecimal currentSpent = committed.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Identify effective monthly budget
        Optional<BudgetRequest> budgetOpt = budgetRequestRepository
                .findByStoreIdAndExpenseCategoryIdAndPeriodMonthAndPeriodYear(
                        store.getId(), cat.getId(), month, year
                );

        BigDecimal effectiveBudget = null;
        BudgetRequest linkedBudget = null;
        if (budgetOpt.isPresent() && budgetOpt.get().getStatus() == BudgetRequestStatus.APPROVED) {
            effectiveBudget = budgetOpt.get().getApprovedAmount();
            linkedBudget = budgetOpt.get();
        } else if (cat.getMonthlyLimit() != null) {
            effectiveBudget = cat.getMonthlyLimit();
        }

        // 3. Overrun protection check (README 14 & 22)
        boolean isOverrun = false;
        if (effectiveBudget != null) {
            BigDecimal totalWithNew = currentSpent.add(req.getAmount());
            if (totalWithNew.compareTo(effectiveBudget) > 0) {
                isOverrun = true;
            }
        }

        String docNumber = numberingService.nextNumber(store.getId(), DOC_TYPE_EXPENSE);

        Expense expense = new Expense();
        expense.setExpenseNumber(docNumber);
        expense.setStore(store);
        expense.setExpenseCategory(cat);
        expense.setBudgetRequest(linkedBudget);
        expense.setAmount(req.getAmount());
        expense.setExpenseDate(req.getExpenseDate());
        expense.setPaymentMethod(req.getPaymentMethod());
        expense.setPayeeName(req.getPayeeName());
        expense.setDescription(req.getDescription());
        expense.setReceiptUrl(req.getReceiptUrl());
        expense.setOverrun(isOverrun);
        // Overrun triggers mandatory pending approval workflow
        expense.setStatus(isOverrun ? ExpenseStatus.PENDING_APPROVAL : ExpenseStatus.APPROVED);
        expense.setSubmittedBy(creator);
        expense.setActivityType(req.getActivityType());
        expense.setReferenceId(req.getReferenceId());
        expense.setNotes(req.getNotes());

        Expense saved = expenseRepository.save(expense);
        return ExpenseResponse.from(saved);
    }

    @Transactional
    public ExpenseResponse approveExpense(UUID id, ApproveExpenseRequest req) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Expense not found: " + id));
        Employee approver = employeeRepository.findById(req.getApprovedById())
                .orElseThrow(() -> new NotFoundException("Approver employee not found: " + req.getApprovedById()));

        if (req.isApproved()) {
            expense.setStatus(ExpenseStatus.APPROVED);
        } else {
            expense.setStatus(ExpenseStatus.REJECTED);
        }
        expense.setApprovedBy(approver);
        if (req.getNotes() != null) {
            expense.setNotes(req.getNotes());
        }

        Expense saved = expenseRepository.save(expense);
        return ExpenseResponse.from(saved);
    }

    @Transactional
    public ExpenseResponse payExpense(UUID id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Expense not found: " + id));

        if (expense.getStatus() != ExpenseStatus.APPROVED) {
            throw new ConflictException("Expense must be APPROVED before disbursement. Current status: " + expense.getStatus());
        }

        expense.setStatus(ExpenseStatus.PAID);
        Expense saved = expenseRepository.save(expense);
        return ExpenseResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(UUID storeId, ExpenseStatus status, LocalDate startDate, LocalDate endDate) {
        List<Expense> list;
        if (storeId != null && startDate != null && endDate != null) {
            list = expenseRepository.findByStoreAndDateRange(storeId, startDate, endDate);
            if (status != null) {
                list = list.stream().filter(e -> e.getStatus() == status).toList();
            }
        } else if (storeId != null && status != null) {
            list = expenseRepository.findByStoreIdAndStatus(storeId, status);
        } else if (storeId != null) {
            list = expenseRepository.findByStoreId(storeId);
        } else {
            list = expenseRepository.findAll();
        }
        return list.stream().map(ExpenseResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<BudgetConsumptionResponse> getBudgetConsumption(UUID storeId, int year, int month) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));

        YearMonth ym = YearMonth.of(year, month);
        LocalDate startOfMonth = ym.atDay(1);
        LocalDate endOfMonth = ym.atEndOfMonth();

        List<ExpenseCategory> categories = categoryRepository.findByActiveTrue();
        List<BudgetConsumptionResponse> result = new ArrayList<>();

        for (ExpenseCategory cat : categories) {
            List<Expense> committed = expenseRepository.findCommittedExpenses(
                    store.getId(), cat.getId(), startOfMonth, endOfMonth
            );
            BigDecimal totalSpent = committed.stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Optional<BudgetRequest> bOpt = budgetRequestRepository
                    .findByStoreIdAndExpenseCategoryIdAndPeriodMonthAndPeriodYear(
                            store.getId(), cat.getId(), month, year
                    );

            BigDecimal allocated = BigDecimal.ZERO;
            if (bOpt.isPresent() && bOpt.get().getStatus() == BudgetRequestStatus.APPROVED) {
                allocated = bOpt.get().getApprovedAmount();
            } else if (cat.getMonthlyLimit() != null) {
                allocated = cat.getMonthlyLimit();
            }

            BigDecimal remaining = allocated.subtract(totalSpent);
            boolean isOverrun = remaining.compareTo(BigDecimal.ZERO) < 0;

            double percent = 0.0;
            if (allocated.compareTo(BigDecimal.ZERO) > 0) {
                percent = totalSpent.divide(allocated, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue();
            }

            result.add(BudgetConsumptionResponse.builder()
                    .categoryId(cat.getId())
                    .categoryCode(cat.getCode())
                    .categoryName(cat.getName())
                    .periodMonth(month)
                    .periodYear(year)
                    .allocatedBudget(allocated)
                    .totalSpent(totalSpent)
                    .remainingBudget(remaining)
                    .overrun(isOverrun)
                    .consumptionPercent(percent)
                    .build());
        }

        return result;
    }
}
