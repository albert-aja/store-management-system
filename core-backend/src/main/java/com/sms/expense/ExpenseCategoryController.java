package com.sms.expense;

import com.sms.expense.dto.CreateExpenseCategoryRequest;
import com.sms.expense.dto.ExpenseCategoryResponse;
import com.sms.expense.dto.UpdateExpenseCategoryRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/expense-categories")
@RequiredArgsConstructor
public class ExpenseCategoryController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<ExpenseCategoryResponse>> listCategories(
            @RequestParam(name = "activeOnly", defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(expenseService.listCategories(activeOnly));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseCategoryResponse> getCategory(@PathVariable UUID id) {
        return ResponseEntity.ok(expenseService.getCategory(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EXPENSE_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<ExpenseCategoryResponse> createCategory(
            @Valid @RequestBody CreateExpenseCategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.createCategory(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EXPENSE_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<ExpenseCategoryResponse> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExpenseCategoryRequest req) {
        return ResponseEntity.ok(expenseService.updateCategory(id, req));
    }
}
