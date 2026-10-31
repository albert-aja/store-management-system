import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Visibility as PreviewIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  InsertDriveFile as GenericFileIcon,
} from "@mui/icons-material";
import { useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useDocuments, useUploadDocument } from "./hooks";
import { documentsApi } from "./api";
import DocumentPreviewModal, { detectDocumentCategory } from "./DocumentPreviewModal";
import type { DocumentRecord } from "./types";
import { formatDate , t} from "../../lib/locale";

interface Props {
  ownerType: string;
  ownerId: string;
  title?: string;
  readOnly?: boolean;
}

/** Reusable attachment list + universal previewer + upload control for any owner record. */
export default function DocumentsPanel({
  ownerType,
  ownerId,
  title = "Attached Documents",
  readOnly = false,
}: Props) {
  const { data, isLoading } = useDocuments(ownerType, ownerId);
  const upload = useUploadDocument(ownerType, ownerId);
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const documents = data ?? [];

  const handleOpenPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      await documentsApi.downloadDocument(doc);
    } catch {
      enqueueSnackbar(t("Failed to download document"), { variant: "error" });
    }
  };

  const renderFileIcon = (fileName: string, mimeType: string | null) => {
    const cat = detectDocumentCategory(fileName, mimeType);
    switch (cat) {
      case "pdf":
        return <PdfIcon color="error" />;
      case "image":
        return <ImageIcon color="primary" />;
      case "word":
        return <DocIcon color="info" />;
      default:
        return <GenericFileIcon color="action" />;
    }
  };

  return (
    <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip
            label={documents.length}
            size="small"
            color={documents.length > 0 ? "primary" : "default"}
            variant="outlined"
          />
        </Box>

        {!readOnly && (
          <Button
            variant="contained"
            size="small"
            startIcon={upload.isPending ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
            disabled={upload.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {upload.isPending ? t("Uploading...") : t("Upload Document")}
          </Button>
        )}
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.docx,.doc,.txt,.csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          upload.mutate(file, {
            onSuccess: () => {
              enqueueSnackbar(t("\"{name}\" uploaded successfully", undefined, { name: file.name }), { variant: "success" });
            },
            onError: (err: any) => {
              enqueueSnackbar(err?.message || t("Failed to upload document"), { variant: "error" });
            },
          });
          e.target.value = "";
        }}
      />

      {/* Loading state */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : documents.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: "center",
            bgcolor: "background.default",
            borderStyle: "dashed",
            borderRadius: 2,
          }}
        >
          <GenericFileIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {t("No document attachments found for this record.")}
          </Typography>
          {!readOnly && (
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("Upload Attachment Now")}
            </Button>
          )}
        </Paper>
      ) : (
        <List dense disablePadding>
          {documents.map((doc, index) => {
            const category = detectDocumentCategory(doc.fileName, doc.mimeType);
            return (
              <ListItem
                key={doc.id}
                divider={index < documents.length - 1}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {renderFileIcon(doc.fileName, doc.mimeType)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline", color: "primary.main" },
                        }}
                        onClick={() => handleOpenPreview(index)}
                      >
                        {doc.fileName}
                      </Typography>
                      <Chip
                        label={category.toUpperCase()}
                        size="small"
                        sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {doc.uploadedAt ? formatDate(new Date(doc.uploadedAt)) : t("Just now")} •{" "}
                      {doc.mimeType || "document"}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title={t("Preview Document")}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenPreview(index)}
                        aria-label={t("Preview document: {filename}", undefined, {
                          filename: doc.fileName,
                        })}
                      >
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("Download")}>
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(doc)}
                        aria-label={t("Download {filename}", undefined, {
                          filename: doc.fileName,
                        })}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      )}

      {/* Universal Document Preview Modal */}
      {previewOpen && documents.length > 0 && (
        <DocumentPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          items={documents}
          initialIndex={previewIndex}
        />
      )}
    </Card>
  );
}
