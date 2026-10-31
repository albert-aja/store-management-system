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
  fileSize?: number;
}

export interface UploadTicket {
  document: DocumentRecord;
  signedUrl: string;
  token: string;
}

export interface DocumentDownloadTicket {
  id: string;
  fileName: string;
  mimeType: string | null;
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface DocumentPreviewItem {
  id?: string;
  title?: string;
  fileName: string;
  mimeType?: string | null;
  url?: string;
  blob?: Blob | File;
  storageBucket?: string;
  storagePath?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  fileSize?: number;
}
