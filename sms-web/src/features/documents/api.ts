import { apiClient } from "../../lib/apiClient";
import type { DocumentRecord, UploadTicket, DocumentDownloadTicket } from "./types";

export const documentsApi = {
  list: (ownerType: string, ownerId: string) =>
    apiClient
      .get<DocumentRecord[]>("/api/documents", { params: { ownerType, ownerId } })
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
      headers: { "Content-Type": file.type || "application/octet-stream" },
    }),

  getDownloadTicket: (id: string, expiresInSeconds = 900) =>
    apiClient
      .get<DocumentDownloadTicket>(`/api/documents/${id}/download-ticket`, {
        params: { expiresInSeconds },
      })
      .then((r) => r.data),

  downloadDocument: async (doc: { id?: string; fileName: string; url?: string }) => {
    let downloadUrl = doc.url;
    if (!downloadUrl && doc.id) {
      try {
        const ticket = await documentsApi.getDownloadTicket(doc.id);
        downloadUrl = ticket.downloadUrl;
      } catch {
        downloadUrl = `/api/documents/${doc.id}/download`;
      }
    }

    if (!downloadUrl) {
      throw new Error("Unable to obtain download URL for document");
    }

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = doc.fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};
