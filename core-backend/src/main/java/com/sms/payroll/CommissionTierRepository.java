package com.sms.payroll;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommissionTierRepository extends JpaRepository<CommissionTier, UUID> {
    List<CommissionTier> findAllByIsActiveTrueOrderByMinSalesVolumeAsc();
    List<CommissionTier> findAllByOrderByDisplayOrderAscMinSalesVolumeAsc();
    List<CommissionTier> findAllByStoreIdAndIsActiveTrueOrderByMinSalesVolumeAsc(UUID storeId);
}
