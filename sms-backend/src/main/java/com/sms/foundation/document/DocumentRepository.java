package com.sms.foundation.document;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<DocumentRecord, UUID> {

    List<DocumentRecord> findByOwnerTypeAndOwnerId(String ownerType, UUID ownerId);
}
