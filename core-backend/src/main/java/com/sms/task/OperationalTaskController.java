package com.sms.task;

import com.sms.common.security.SmsUserPrincipal;
import com.sms.task.dto.AddTaskCommentRequest;
import com.sms.task.dto.CreateTaskRequest;
import com.sms.task.dto.OperationalTaskDto;
import com.sms.task.dto.TaskCommentDto;
import com.sms.task.dto.TaskDetailDto;
import com.sms.task.dto.TaskSummaryDto;
import com.sms.task.dto.UpdateTaskStatusRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class OperationalTaskController {

    private final OperationalTaskService taskService;

    @GetMapping
    public ResponseEntity<List<OperationalTaskDto>> listTasks(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) TaskCategory category,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) UUID assignerId,
            @RequestParam(required = false) Boolean overdueOnly,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(taskService.listTasks(
                storeId, status, priority, category, assigneeId, assignerId, overdueOnly, search
        ));
    }

    @GetMapping("/summary")
    public ResponseEntity<TaskSummaryDto> getSummary(
            @RequestParam(required = false) UUID storeId,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID currentEmployeeId = principal != null ? principal.employeeId() : null;
        return ResponseEntity.ok(taskService.getSummary(storeId, currentEmployeeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDetailDto> getTaskById(@PathVariable UUID id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PostMapping
    public ResponseEntity<OperationalTaskDto> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID currentEmployeeId = principal != null ? principal.employeeId() : null;
        OperationalTaskDto created = taskService.createTask(request, currentEmployeeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OperationalTaskDto> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID currentEmployeeId = principal != null ? principal.employeeId() : null;
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request, currentEmployeeId));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TaskCommentDto> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody AddTaskCommentRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID currentEmployeeId = principal != null ? principal.employeeId() : null;
        TaskCommentDto created = taskService.addComment(id, request, currentEmployeeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}

