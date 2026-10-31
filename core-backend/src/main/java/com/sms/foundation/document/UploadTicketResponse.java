package com.sms.foundation.document;

public record UploadTicketResponse(DocumentResponse document, String signedUrl, String token) {

    public static UploadTicketResponse from(DocumentService.UploadTicket ticket) {
        return new UploadTicketResponse(DocumentResponse.from(ticket.document()),
                ticket.uploadUrl().signedUrl(), ticket.uploadUrl().token());
    }
}
