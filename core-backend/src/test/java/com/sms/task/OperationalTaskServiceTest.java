package com.sms.task;

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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OperationalTaskServiceTest {

    @Mock
    private OperationalTaskRepository taskRepository;

    @Mock
    private TaskCommentRepository commentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private OperationalTaskService taskService;

    private Employee assigner;
    private Employee assignee;
    private UUID storeId;

    @BeforeEach
    void setUp() {
        assigner = new Employee();
        assigner.setFullName("Supervisor Budi");

        assignee = new Employee();
        assignee.setFullName("Staff Siti");

        storeId = UUID.randomUUID();
    }

    @Test
    void createTask_generatesNumberAndSetsPendingStatus() {
        UUID assigneeId = UUID.randomUUID();
        UUID assignerId = UUID.randomUUID();

        when(employeeRepository.findById(assigneeId)).thenReturn(Optional.of(assignee));
        when(employeeRepository.findById(assignerId)).thenReturn(Optional.of(assigner));
        when(taskRepository.save(any(OperationalTask.class))).thenAnswer(invocation -> {
            OperationalTask task = invocation.getArgument(0);
            return task;
        });

        CreateTaskRequest request = new CreateTaskRequest(
                "Persiapan Display Sofa L-Shape",
                "Tata unit display sofa baru di area depan showroom",
                TaskCategory.SHOWROOM_DISPLAY,
                TaskPriority.HIGH,
                Instant.now().plus(2, ChronoUnit.DAYS),
                assigneeId,
                storeId
        );

        OperationalTaskDto result = taskService.createTask(request, assignerId);

        assertThat(result).isNotNull();
        assertThat(result.title()).isEqualTo("Persiapan Display Sofa L-Shape");
        assertThat(result.taskNumber()).startsWith("TSK-");
        assertThat(result.category()).isEqualTo(TaskCategory.SHOWROOM_DISPLAY);
        assertThat(result.priority()).isEqualTo(TaskPriority.HIGH);
        assertThat(result.status()).isEqualTo(TaskStatus.PENDING);
        assertThat(result.assigneeName()).isEqualTo("Staff Siti");
        assertThat(result.assignerName()).isEqualTo("Supervisor Budi");
        assertThat(result.isOverdue()).isFalse();

        verify(taskRepository).save(any(OperationalTask.class));
    }

    @Test
    void updateTaskStatus_completed_setsCompletedAtAndNotes() {
        UUID taskId = UUID.randomUUID();
        OperationalTask existing = new OperationalTask();
        existing.setTitle("Audit Stok Meja Makan");
        existing.setStatus(TaskStatus.IN_PROGRESS);
        existing.setAssigner(assigner);
        existing.setAssignee(assignee);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(OperationalTask.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest(
                TaskStatus.COMPLETED,
                "Selesai fisik 12 unit cocok dengan kartu stok"
        );

        OperationalTaskDto result = taskService.updateTaskStatus(taskId, request, UUID.randomUUID());

        assertThat(result.status()).isEqualTo(TaskStatus.COMPLETED);
        assertThat(result.completedAt()).isNotNull();
        assertThat(result.completionNotes()).isEqualTo("Selesai fisik 12 unit cocok dengan kartu stok");
    }

    @Test
    void addComment_appendsToTaskThread() {
        UUID taskId = UUID.randomUUID();
        OperationalTask task = new OperationalTask();
        task.setTitle("Pengecekan Lemari Rusak");
        task.setAssigner(assigner);
        task.setAssignee(assignee);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(employeeRepository.findById(any(UUID.class))).thenReturn(Optional.of(assignee));
        when(commentRepository.save(any(TaskComment.class))).thenAnswer(inv -> {
            TaskComment c = inv.getArgument(0);
            return c;
        });

        AddTaskCommentRequest request = new AddTaskCommentRequest(
                "Engsel pintu kiri sudah diganti dari cadangan sparepart",
                "https://storage.sms.id/photos/hinge_fix.jpg"
        );

        TaskCommentDto comment = taskService.addComment(taskId, request, UUID.randomUUID());

        assertThat(comment.message()).isEqualTo("Engsel pintu kiri sudah diganti dari cadangan sparepart");
        assertThat(comment.attachmentUrl()).isEqualTo("https://storage.sms.id/photos/hinge_fix.jpg");
        assertThat(comment.authorName()).isEqualTo("Staff Siti");
    }

    @Test
    void getTaskById_returnsTaskWithCommentsAndOverdueFlag() {
        UUID taskId = UUID.randomUUID();
        OperationalTask task = new OperationalTask();
        task.setTaskNumber("TSK-202611-1001");
        task.setTitle("Perbaikan Display AC Showroom");
        task.setCategory(TaskCategory.MAINTENANCE);
        task.setPriority(TaskPriority.URGENT);
        task.setStatus(TaskStatus.PENDING);
        task.setDueDate(Instant.now().minus(1, ChronoUnit.DAYS)); // Past due date
        task.setAssigner(assigner);
        task.setAssignee(assignee);

        TaskComment comment = new TaskComment();
        comment.setTask(task);
        comment.setAuthor(assigner);
        comment.setMessage("Tolong dikerjakan pagi ini sebelum toko buka");

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)).thenReturn(List.of(comment));

        TaskDetailDto detail = taskService.getTaskById(taskId);

        assertThat(detail.title()).isEqualTo("Perbaikan Display AC Showroom");
        assertThat(detail.isOverdue()).isTrue();
        assertThat(detail.comments()).hasSize(1);
        assertThat(detail.comments().get(0).message()).isEqualTo("Tolong dikerjakan pagi ini sebelum toko buka");
    }

    @Test
    void getSummary_returnsCorrectMetricCounts() {
        UUID currentEmployeeId = UUID.randomUUID();

        when(taskRepository.countTotal(storeId)).thenReturn(25L);
        when(taskRepository.countByStoreAndStatus(storeId, TaskStatus.PENDING)).thenReturn(10L);
        when(taskRepository.countByStoreAndStatus(storeId, TaskStatus.IN_PROGRESS)).thenReturn(8L);
        when(taskRepository.countByStoreAndStatus(storeId, TaskStatus.COMPLETED)).thenReturn(7L);
        when(taskRepository.countOverdue(eq(storeId), any(Instant.class))).thenReturn(3L);
        when(taskRepository.countMyPending(currentEmployeeId)).thenReturn(4L);

        TaskSummaryDto summary = taskService.getSummary(storeId, currentEmployeeId);

        assertThat(summary.totalTasks()).isEqualTo(25L);
        assertThat(summary.pendingTasks()).isEqualTo(10L);
        assertThat(summary.inProgressTasks()).isEqualTo(8L);
        assertThat(summary.completedTasks()).isEqualTo(7L);
        assertThat(summary.overdueTasks()).isEqualTo(3L);
        assertThat(summary.myPendingTasks()).isEqualTo(4L);
    }
}

