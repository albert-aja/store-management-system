package com.sms.foundation.document;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.document.SupabaseStorageClient.SignedUploadUrl;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final SupabaseStorageClient storageClient;

    public record UploadTicket(DocumentRecord document, SignedUploadUrl uploadUrl) {
    }

    public UploadTicket requestUpload(String ownerType, UUID ownerId, String fileName, String mimeType, UUID uploadedBy) {
        String bucket = storageClient.defaultBucket();
        String path = "%s/%s/%s-%s".formatted(ownerType, ownerId, UUID.randomUUID(), fileName);

        DocumentRecord document = new DocumentRecord();
        document.setOwnerType(ownerType);
        document.setOwnerId(ownerId);
        document.setStorageBucket(bucket);
        document.setStoragePath(path);
        document.setFileName(fileName);
        document.setMimeType(mimeType);
        document.setUploadedBy(uploadedBy);
        document = documentRepository.save(document);

        SignedUploadUrl uploadUrl = storageClient.createSignedUploadUrl(bucket, path);
        return new UploadTicket(document, uploadUrl);
    }

    @Transactional(readOnly = true)
    public List<DocumentRecord> listForOwner(String ownerType, UUID ownerId) {
        return documentRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId);
    }

    @Transactional(readOnly = true)
    public DocumentRecord getDocument(UUID documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Document not found: " + documentId));
    }

    @Transactional(readOnly = true)
    public DocumentDownloadTicket getDownloadTicket(UUID documentId, int expiresInSeconds) {
        DocumentRecord doc = getDocument(documentId);
        int ttl = expiresInSeconds > 0 ? expiresInSeconds : 900;
        String signedUrl;
        try {
            signedUrl = storageClient.createSignedDownloadUrl(doc.getStorageBucket(), doc.getStoragePath(), ttl);
        } catch (Exception e) {
            signedUrl = "/api/documents/" + doc.getId() + "/download?direct=true";
        }
        return new DocumentDownloadTicket(doc.getId(), doc.getFileName(), doc.getMimeType(), signedUrl, ttl);
    }
}
