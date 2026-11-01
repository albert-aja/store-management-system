package com.sms.task;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OperationalTaskRepository extends JpaRepository<OperationalTask, UUID> {

    @Query("""
        SELECT t FROM OperationalTask t
        WHERE (:storeId IS NULL OR t.storeId = :storeId)
          AND (:status IS NULL OR t.status = :status)
          AND (:priority IS NULL OR t.priority = :priority)
          AND (:category IS NULL OR t.category = :category)
          AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId)
          AND (:assignerId IS NULL OR t.assigner.id = :assignerId)
          AND (:overdueOnly IS NULL OR :overdueOnly = false OR (t.dueDate IS NOT NULL AND t.dueDate < :now AND t.status NOT IN ('COMPLETED', 'CANCELLED')))
          AND (:search IS NULL OR :search = '' OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.taskNumber) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY
          CASE WHEN t.status = 'PENDING' THEN 1 WHEN t.status = 'IN_PROGRESS' THEN 2 ELSE 3 END ASC,
          t.dueDate ASC NULLS LAST,
          t.createdAt DESC
    """)
    List<OperationalTask> findFilteredTasks(
            @Param("storeId") UUID storeId,
            @Param("status") TaskStatus status,
            @Param("priority") TaskPriority priority,
            @Param("category") TaskCategory category,
            @Param("assigneeId") UUID assigneeId,
            @Param("assignerId") UUID assignerId,
            @Param("overdueOnly") Boolean overdueOnly,
            @Param("search") String search,
            @Param("now") Instant now
    );

    long countByStatus(TaskStatus status);

    @Query("SELECT COUNT(t) FROM OperationalTask t WHERE (:storeId IS NULL OR t.storeId = :storeId)")
    long countTotal(@Param("storeId") UUID storeId);

    @Query("SELECT COUNT(t) FROM OperationalTask t WHERE (:storeId IS NULL OR t.storeId = :storeId) AND t.status = :status")
    long countByStoreAndStatus(@Param("storeId") UUID storeId, @Param("status") TaskStatus status);

    @Query("""
        SELECT COUNT(t) FROM OperationalTask t
        WHERE (:storeId IS NULL OR t.storeId = :storeId)
          AND t.dueDate IS NOT NULL
          AND t.dueDate < :now
          AND t.status NOT IN ('COMPLETED', 'CANCELLED')
    """)
    long countOverdue(@Param("storeId") UUID storeId, @Param("now") Instant now);

    @Query("""
        SELECT COUNT(t) FROM OperationalTask t
        WHERE t.assignee.id = :assigneeId
          AND t.status IN ('PENDING', 'IN_PROGRESS')
    """)
    long countMyPending(@Param("assigneeId") UUID assigneeId);
}

