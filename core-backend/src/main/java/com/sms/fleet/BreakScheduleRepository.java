package com.sms.fleet;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BreakScheduleRepository extends JpaRepository<BreakSchedule, UUID> {
    List<BreakSchedule> findByStoreIdAndActiveTrue(UUID storeId);
    List<BreakSchedule> findByActiveTrue();
}

