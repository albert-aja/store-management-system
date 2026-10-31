package com.sms.foundation.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.document.SupabaseStorageClient.SignedUploadUrl;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private SupabaseStorageClient storageClient;

    @InjectMocks
    private DocumentService documentService;

    @Test
    void requestUpload_savesRecordAndGeneratesTicket() {
        UUID ownerId = UUID.randomUUID();
        UUID uploadedBy = UUID.randomUUID();
        UUID generatedId = UUID.randomUUID();

        when(storageClient.defaultBucket()).thenReturn("sms-documents");
        when(storageClient.createSignedUploadUrl(eq("sms-documents"), any())).thenReturn(
                new SignedUploadUrl("https://supabase.co/upload/sign", "mock-token"));
        when(documentRepository.save(any(DocumentRecord.class))).thenAnswer(inv -> {
            DocumentRecord record = inv.getArgument(0);
            ReflectionTestUtils.setField(record, "id", generatedId);
            return record;
        });

        DocumentService.UploadTicket ticket = documentService.requestUpload(
                "CUSTOMER", ownerId, "ktp_card.pdf", "application/pdf", uploadedBy);

        assertThat(ticket).isNotNull();
        assertThat(ticket.document().getId()).isEqualTo(generatedId);
        assertThat(ticket.document().getOwnerType()).isEqualTo("CUSTOMER");
        assertThat(ticket.document().getOwnerId()).isEqualTo(ownerId);
        assertThat(ticket.document().getFileName()).isEqualTo("ktp_card.pdf");
        assertThat(ticket.document().getMimeType()).isEqualTo("application/pdf");
        assertThat(ticket.uploadUrl().signedUrl()).isEqualTo("https://supabase.co/upload/sign");
        verify(documentRepository).save(any(DocumentRecord.class));
    }

    @Test
    void listForOwner_returnsMatchingDocuments() {
        UUID ownerId = UUID.randomUUID();
        DocumentRecord doc = new DocumentRecord();
        ReflectionTestUtils.setField(doc, "id", UUID.randomUUID());
        doc.setOwnerType("CUSTOMER");
        doc.setOwnerId(ownerId);
        doc.setFileName("contract.docx");

        when(documentRepository.findByOwnerTypeAndOwnerId("CUSTOMER", ownerId)).thenReturn(List.of(doc));

        List<DocumentRecord> results = documentService.listForOwner("CUSTOMER", ownerId);
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getFileName()).isEqualTo("contract.docx");
    }

    @Test
    void getDocument_found_returnsDocument() {
        UUID docId = UUID.randomUUID();
        DocumentRecord doc = new DocumentRecord();
        ReflectionTestUtils.setField(doc, "id", docId);
        doc.setFileName("receipt.png");

        when(documentRepository.findById(docId)).thenReturn(Optional.of(doc));

        DocumentRecord result = documentService.getDocument(docId);
        assertThat(result.getId()).isEqualTo(docId);
        assertThat(result.getFileName()).isEqualTo("receipt.png");
    }

    @Test
    void getDocument_notFound_throwsException() {
        UUID docId = UUID.randomUUID();
        when(documentRepository.findById(docId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> documentService.getDocument(docId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Document not found");
    }

    @Test
    void getDownloadTicket_generatesSignedDownloadUrl() {
        UUID docId = UUID.randomUUID();
        DocumentRecord doc = new DocumentRecord();
        ReflectionTestUtils.setField(doc, "id", docId);
        doc.setFileName("salary_slip.pdf");
        doc.setMimeType("application/pdf");
        doc.setStorageBucket("sms-documents");
        doc.setStoragePath("CUSTOMER/123/salary_slip.pdf");

        when(documentRepository.findById(docId)).thenReturn(Optional.of(doc));
        when(storageClient.createSignedDownloadUrl("sms-documents", "CUSTOMER/123/salary_slip.pdf", 900))
                .thenReturn("https://supabase.co/storage/v1/object/sign/sms-documents/CUSTOMER/123/salary_slip.pdf?token=xyz");

        DocumentDownloadTicket ticket = documentService.getDownloadTicket(docId, 900);

        assertThat(ticket).isNotNull();
        assertThat(ticket.id()).isEqualTo(docId);
        assertThat(ticket.fileName()).isEqualTo("salary_slip.pdf");
        assertThat(ticket.mimeType()).isEqualTo("application/pdf");
        assertThat(ticket.downloadUrl()).contains("https://supabase.co");
        assertThat(ticket.expiresInSeconds()).isEqualTo(900);
    }

    @Test
    void getDownloadTicket_fallsBackOnStorageException() {
        UUID docId = UUID.randomUUID();
        DocumentRecord doc = new DocumentRecord();
        ReflectionTestUtils.setField(doc, "id", docId);
        doc.setFileName("furniture_specs.docx");
        doc.setMimeType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        doc.setStorageBucket("sms-documents");
        doc.setStoragePath("CUSTOMER/123/furniture_specs.docx");

        when(documentRepository.findById(docId)).thenReturn(Optional.of(doc));
        when(storageClient.createSignedDownloadUrl(any(), any(), eq(900)))
                .thenThrow(new RuntimeException("Supabase unavailable"));

        DocumentDownloadTicket ticket = documentService.getDownloadTicket(docId, 900);

        assertThat(ticket).isNotNull();
        assertThat(ticket.id()).isEqualTo(docId);
        assertThat(ticket.downloadUrl()).isEqualTo("/api/documents/" + docId + "/download?direct=true");
    }
}
