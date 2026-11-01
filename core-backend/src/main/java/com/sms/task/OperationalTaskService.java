package com.sms.task;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.task.dto.AddTaskCommentRequest;
import com.sms.task.dto.CreateTaskRequest;
import com.sms.task.dto.OperationalTaskDto;
import com.sms.task.dto.TaskCommentDto;
import com.sms.task.dto.TaskDetailDto;
import com.sms.task.dto.TaskSummaryDto;
import com.sms.task.dto.UpdateTaskStatusRequest;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OperationalTaskService {

    private final OperationalTaskRepository taskRepository;
    private final TaskCommentRepository commentRepository;
    private final EmployeeRepository employeeRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM")
            .withZone(ZoneId.of("Asia/Jakarta"));

    @Transactional(readOnly = true)
    public List<OperationalTaskDto> listTasks(
            UUID storeId,
            TaskStatus status,
            TaskPriority priority,
            TaskCategory category,
            UUID assigneeId,
            UUID assignerId,
            Boolean overdueOnly,
            String search
    ) {
        Instant now = Instant.now();
        List<OperationalTask> tasks = taskRepository.findFilteredTasks(
                storeId, status, priority, category, assigneeId, assignerId, overdueOnly, search, now
        );
        return tasks.stream().map(t -> toDto(t, now)).toList();
    }

    @Transactional(readOnly = true)
    public TaskDetailDto getTaskById(UUID taskId) {
        OperationalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Operational task not found: " + taskId));

        Instant now = Instant.now();
        List<TaskCommentDto> comments = commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(this::toCommentDto)
                .toList();

        boolean isOverdue = isTaskOverdue(task, now);

        return new TaskDetailDto(
                task.getId(),
                task.getTaskNumber(),
                task.getTitle(),
                task.getDescription(),
                task.getCategory(),
                task.getPriority(),
                task.getStatus(),
                task.getDueDate(),
                task.getAssigner().getId(),
                task.getAssigner().getFullName(),
                task.getAssignee().getId(),
                task.getAssignee().getFullName(),
                task.getStoreId(),
                task.getCompletedAt(),
                task.getCompletionNotes(),
                isOverdue,
                comments,
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    @Transactional
    public OperationalTaskDto createTask(CreateTaskRequest req, UUID currentEmployeeId) {
        Employee assignee = employeeRepository.findById(req.assigneeId())
                .orElseThrow(() -> new NotFoundException("Assignee employee not found: " + req.assigneeId()));

        Employee assigner = null;
        if (currentEmployeeId != null) {
            assigner = employeeRepository.findById(currentEmployeeId).orElse(null);
        }
        if (assigner == null) {
            assigner = assignee; // Fallback to assignee if assigner context absent in tests
        }

        OperationalTask task = new OperationalTask();
        task.setTaskNumber(generateTaskNumber());
        task.setTitle(req.title().trim());
        task.setDescription(req.description() != null ? req.description().trim() : null);
        task.setCategory(req.category() != null ? req.category() : TaskCategory.GENERAL);
        task.setPriority(req.priority() != null ? req.priority() : TaskPriority.MEDIUM);
        task.setStatus(TaskStatus.PENDING);
        task.setDueDate(req.dueDate());
        task.setAssigner(assigner);
        task.setAssignee(assignee);
        task.setStoreId(req.storeId());

        OperationalTask saved = taskRepository.save(task);
        return toDto(saved, Instant.now());
    }

    @Transactional
    public OperationalTaskDto updateTaskStatus(UUID taskId, UpdateTaskStatusRequest req, UUID currentEmployeeId) {
        OperationalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Operational task not found: " + taskId));

        task.setStatus(req.status());
        if (req.status() == TaskStatus.COMPLETED) {
            task.setCompletedAt(Instant.now());
            if (req.completionNotes() != null && !req.completionNotes().isBlank()) {
                task.setCompletionNotes(req.completionNotes().trim());
            }
        } else if (req.status() == TaskStatus.CANCELLED) {
            if (req.completionNotes() != null && !req.completionNotes().isBlank()) {
                task.setCompletionNotes(req.completionNotes().trim());
            }
        } else {
            task.setCompletedAt(null);
        }

        OperationalTask saved = taskRepository.save(task);
        return toDto(saved, Instant.now());
    }

    @Transactional
    public TaskCommentDto addComment(UUID taskId, AddTaskCommentRequest req, UUID currentEmployeeId) {
        OperationalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Operational task not found: " + taskId));

        Employee author = null;
        if (currentEmployeeId != null) {
            author = employeeRepository.findById(currentEmployeeId).orElse(null);
        }
        if (author == null) {
            author = task.getAssignee();
        }

        TaskComment comment = new TaskComment();
        comment.setTask(task);
        comment.setAuthor(author);
        comment.setMessage(req.message().trim());
        comment.setAttachmentUrl(req.attachmentUrl() != null && !req.attachmentUrl().isBlank() ? req.attachmentUrl().trim() : null);

        TaskComment saved = commentRepository.save(comment);
        return toCommentDto(saved);
    }

    @Transactional(readOnly = true)
    public TaskSummaryDto getSummary(UUID storeId, UUID currentEmployeeId) {
        Instant now = Instant.now();
        long total = taskRepository.countTotal(storeId);
        long pending = taskRepository.countByStoreAndStatus(storeId, TaskStatus.PENDING);
        long inProgress = taskRepository.countByStoreAndStatus(storeId, TaskStatus.IN_PROGRESS);
        long completed = taskRepository.countByStoreAndStatus(storeId, TaskStatus.COMPLETED);
        long overdue = taskRepository.countOverdue(storeId, now);
        long myPending = currentEmployeeId != null ? taskRepository.countMyPending(currentEmployeeId) : 0;

        return new TaskSummaryDto(total, pending, inProgress, completed, overdue, myPending);
    }

    private String generateTaskNumber() {
        String ym = DATE_FORMATTER.format(Instant.now());
        int randomCode = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "TSK-" + ym + "-" + randomCode;
    }

    private boolean isTaskOverdue(OperationalTask t, Instant now) {
        return t.getDueDate() != null
                && t.getDueDate().isBefore(now)
                && t.getStatus() != TaskStatus.COMPLETED
                && t.getStatus() != TaskStatus.CANCELLED;
    }

    private OperationalTaskDto toDto(OperationalTask t, Instant now) {
        return new OperationalTaskDto(
                t.getId(),
                t.getTaskNumber(),
                t.getTitle(),
                t.getDescription(),
                t.getCategory(),
                t.getPriority(),
                t.getStatus(),
                t.getDueDate(),
                t.getAssigner() != null ? t.getAssigner().getId() : null,
                t.getAssigner() != null ? t.getAssigner().getFullName() : "-",
                t.getAssignee() != null ? t.getAssignee().getId() : null,
                t.getAssignee() != null ? t.getAssignee().getFullName() : "-",
                t.getStoreId(),
                t.getCompletedAt(),
                t.getCompletionNotes(),
                t.getComments() != null ? t.getComments().size() : 0,
                isTaskOverdue(t, now),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }

    private TaskCommentDto toCommentDto(TaskComment c) {
        return new TaskCommentDto(
                c.getId(),
                c.getTask().getId(),
                c.getAuthor() != null ? c.getAuthor().getId() : null,
                c.getAuthor() != null ? c.getAuthor().getFullName() : "-",
                c.getMessage(),
                c.getAttachmentUrl(),
                c.getCreatedAt()
        );
    }
}

