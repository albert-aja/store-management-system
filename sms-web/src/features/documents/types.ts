export interface DocumentRecord {
  id: string;
  ownerType: string;
  ownerId: string;
  storageBucket: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

export interface UploadTicket {
  document: DocumentRecord;
  signedUrl: string;
  token: string;
}
