import { apiClient } from "../../lib/apiClient";
import type { DocumentRecord, UploadTicket } from "./types";

export const documentsApi = {
  list: (ownerType: string, ownerId: string) =>
    apiClient
      .get<
        DocumentRecord[]
      >("/api/documents", { params: { ownerType, ownerId } })
      .then((r) => r.data),
  requestUpload: (
    ownerType: string,
    ownerId: string,
    fileName: string,
    mimeType: string,
  ) =>
    apiClient
      .post<UploadTicket>("/api/documents/upload-ticket", {
        ownerType,
        ownerId,
        fileName,
        mimeType,
      })
      .then((r) => r.data),
  uploadToSignedUrl: (ticket: UploadTicket, file: File) =>
    fetch(ticket.signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    }),
};
