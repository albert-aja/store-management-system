import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "./api";
import type { DocumentRecord } from "./types";

const documentsKey = (ownerType: string, ownerId: string) => [
  "documents",
  ownerType,
  ownerId,
];

export function useDocuments(ownerType: string, ownerId: string | null) {
  return useQuery({
    queryKey: documentsKey(ownerType, ownerId ?? ""),
    queryFn: () => documentsApi.list(ownerType, ownerId as string),
    enabled: !!ownerId,
  });
}

export function useUploadDocument(ownerType: string, ownerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const ticket = await documentsApi.requestUpload(
        ownerType,
        ownerId,
        file.name,
        file.type || "application/octet-stream",
      );
      await documentsApi.uploadToSignedUrl(ticket, file);
      return ticket.document;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: documentsKey(ownerType, ownerId),
      }),
  });
}

export function useDocumentDownloadTicket(documentId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["document-download-ticket", documentId],
    queryFn: () => (documentId ? documentsApi.getDownloadTicket(documentId) : null),
    enabled: !!documentId && enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

export function useDownloadDocumentMutation() {
  return useMutation({
    mutationFn: (doc: DocumentRecord | { id?: string; fileName: string; url?: string }) =>
      documentsApi.downloadDocument(doc),
  });
}
