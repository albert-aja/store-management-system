package com.sms.expense;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findByStoreId(UUID storeId);
    List<Expense> findByStoreIdAndStatus(UUID storeId, ExpenseStatus status);

    @Query("SELECT e FROM Expense e WHERE e.store.id = :storeId AND e.expenseCategory.id = :categoryId " +
           "AND e.expenseDate >= :startDate AND e.expenseDate <= :endDate " +
           "AND e.status IN ('APPROVED', 'PAID')")
    List<Expense> findCommittedExpenses(
            @Param("storeId") UUID storeId,
            @Param("categoryId") UUID categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM Expense e WHERE e.store.id = :storeId " +
           "AND e.expenseDate >= :startDate AND e.expenseDate <= :endDate")
    List<Expense> findByStoreAndDateRange(
            @Param("storeId") UUID storeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
