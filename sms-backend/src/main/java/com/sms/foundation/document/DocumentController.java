package com.sms.foundation.document;

import com.sms.common.security.SmsUserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload-ticket")
    public UploadTicketResponse requestUpload(@Valid @RequestBody RequestUploadRequest request,
                                               @AuthenticationPrincipal SmsUserPrincipal principal) {
        return UploadTicketResponse.from(documentService.requestUpload(request.ownerType(), request.ownerId(),
                request.fileName(), request.mimeType(), principal.employeeId()));
    }

    @GetMapping
    public List<DocumentResponse> list(@RequestParam String ownerType, @RequestParam UUID ownerId) {
        return documentService.listForOwner(ownerType, ownerId).stream().map(DocumentResponse::from).toList();
    }
}
