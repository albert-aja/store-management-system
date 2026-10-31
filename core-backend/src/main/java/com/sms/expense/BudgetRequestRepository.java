package com.sms.expense;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetRequestRepository extends JpaRepository<BudgetRequest, UUID> {
    List<BudgetRequest> findByStoreIdAndPeriodYearAndPeriodMonth(UUID storeId, int periodYear, int periodMonth);
    Optional<BudgetRequest> findByStoreIdAndExpenseCategoryIdAndPeriodMonthAndPeriodYear(
            UUID storeId, UUID categoryId, int periodMonth, int periodYear);
    List<BudgetRequest> findByStoreId(UUID storeId);
}
