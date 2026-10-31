import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  RestartAlt as ResetIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  InsertDriveFile as GenericFileIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useEffect, useState, useMemo, useCallback } from "react";
import { convertDocxToHtml } from "./docxParser";
import { documentsApi } from "./api";
import type { DocumentPreviewItem, DocumentRecord } from "./types";
import { formatDate, formatNumber, t } from "../../lib/locale";

export interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  items: (DocumentPreviewItem | DocumentRecord)[];
  initialIndex?: number;
}

export type DocumentCategory = "pdf" | "image" | "word" | "text" | "other";

export function detectDocumentCategory(fileName: string, mimeType?: string | null): DocumentCategory {
  const mime = (mimeType || "").toLowerCase();
  const ext = fileName.toLowerCase().split(".").pop() || "";

  if (mime.includes("pdf") || ext === "pdf") {
    return "pdf";
  }
  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)
  ) {
    return "image";
  }
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml") ||
    ["docx", "doc", "rtf"].includes(ext)
  ) {
    return "word";
  }
  if (
    mime.startsWith("text/") ||
    ["txt", "csv", "json", "md", "xml", "log"].includes(ext)
  ) {
    return "text";
  }
  return "other";
}

export default function DocumentPreviewModal({
  open,
  onClose,
  items,
  initialIndex = 0,
}: DocumentPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Content fetching states
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxWarning, setDocxWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync index when initialIndex or items change
  useEffect(() => {
    if (open) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      setZoom(100);
      setRotation(0);
    }
  }, [open, initialIndex, items.length]);

  const currentItem = items[currentIndex];

  const category = useMemo(() => {
    if (!currentItem) return "other";
    return detectDocumentCategory(currentItem.fileName, currentItem.mimeType);
  }, [currentItem]);

  // Reset zoom & rotation when switching documents
  useEffect(() => {
    setZoom(100);
    setRotation(0);
    setError(null);
  }, [currentIndex]);

  // Load document content / signed download URL
  useEffect(() => {
    if (!open || !currentItem) {
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;

    async function loadResource() {
      setLoading(true);
      setError(null);
      setDocxHtml(null);
      setDocxWarning(null);
      setTextContent(null);

      try {
        let activeUrl = (currentItem as DocumentPreviewItem).url;
        let blob = (currentItem as DocumentPreviewItem).blob;

        // If neither url nor blob exists, but ID is present, fetch signed download ticket
        if (!activeUrl && !blob && currentItem.id) {
          try {
            const ticket = await documentsApi.getDownloadTicket(currentItem.id);
            activeUrl = ticket.downloadUrl;
          } catch {
            activeUrl = `/api/documents/${currentItem.id}/download`;
          }
        }

        // If we have a blob
        if (blob) {
          createdUrl = URL.createObjectURL(blob);
          if (isMounted) setBlobUrl(createdUrl);

          if (category === "word") {
            const res = await convertDocxToHtml(blob);
            if (isMounted) {
              if (res.isSuccess) {
                setDocxHtml(res.html);
              } else {
                setDocxWarning(res.error || t("Could not parse document inline"));
              }
            }
          } else if (category === "text") {
            const text = await blob.text();
            if (isMounted) setTextContent(text);
          }
          return;
        }

        // If we have a URL
        if (activeUrl) {
          if (isMounted) setBlobUrl(activeUrl);

          if (category === "word") {
            try {
              const fetched = await fetch(activeUrl);
              if (!fetched.ok) throw new Error(`HTTP ${fetched.status}: ${fetched.statusText}`);
              const buffer = await fetched.arrayBuffer();
              const res = await convertDocxToHtml(buffer);
              if (isMounted) {
                if (res.isSuccess) {
                  setDocxHtml(res.html);
                } else {
                  setDocxWarning(res.error || "Could not parse document inline");
                }
              }
            } catch (fetchErr: unknown) {
              const msg = fetchErr instanceof Error ? fetchErr.message : t("Error fetching Word file");
              if (isMounted) setDocxWarning(msg);
            }
          } else if (category === "text") {
            try {
              const fetched = await fetch(activeUrl);
              const text = await fetched.text();
              if (isMounted) setTextContent(text);
            } catch {
              // fallback to iframe/embed if text fetch fails
            }
          }
        } else {
          throw new Error("No URL, Blob, or ID available to preview this document.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t("Failed to load document preview");
        if (isMounted) setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadResource();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [open, currentItem, category]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, items.length]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Download handler
  const handleDownload = () => {
    if (!currentItem) return;
    documentsApi.downloadDocument({
      id: currentItem.id,
      fileName: currentItem.fileName,
      url: blobUrl ?? (currentItem as DocumentPreviewItem).url,
    });
  };

  // Print handler
  const handlePrint = () => {
    if (category === "image" && blobUrl) {
      const win = window.open("");
      if (win) {
        win.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;"><img src="${blobUrl}" style="max-width:100%;" onload="window.print();window.close();"/></body></html>`);
        win.document.close();
      }
    } else if (category === "word" && docxHtml) {
      const win = window.open("");
      if (win) {
        win.document.write(`<html><head><title>${currentItem?.fileName}</title><style>body{font-family:sans-serif;padding:30px;line-height:1.6;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}</style></head><body>${docxHtml}</body></html>`);
        win.document.close();
        win.print();
      }
    } else if (blobUrl) {
      const win = window.open(blobUrl, "_blank");
      win?.print();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleResetZoom();
      if (e.key.toLowerCase() === "r") handleRotate();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrev, handleNext, onClose]);

  if (!currentItem) return null;

  const renderCategoryIcon = () => {
    switch (category) {
      case "pdf":
        return <PdfIcon color="error" />;
      case "image":
        return <ImageIcon color="primary" />;
      case "word":
        return <DocIcon color="primary" />;
      default:
        return <GenericFileIcon color="action" />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isFullscreen}
      maxWidth="xl"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            height: isFullscreen ? "100vh" : "90vh",
            maxHeight: isFullscreen ? "100vh" : "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.paper",
          },
        },
      }}
    >
      {/* Universal Header Bar */}
      <Box
        sx={{
          py: 1.25,
          px: 2,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Document Info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          {renderCategoryIcon()}
          <Box sx={{ minWidth: 0, overflow: "hidden" }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600 }}
              noWrap
              title={currentItem.fileName}
            >
              {currentItem.fileName}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={category.toUpperCase()}
                size="small"
                color={
                  category === "pdf"
                    ? "error"
                    : category === "word"
                      ? "info"
                      : category === "image"
                        ? "primary"
                        : "default"
                }
                variant="outlined"
                sx={{ height: 18, fontSize: "0.68rem", fontWeight: 700 }}
              />
              {currentItem.mimeType && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {currentItem.mimeType}
                </Typography>
              )}
            </Box>
          </Box>
          {items.length > 1 && (
            <Chip
              label={t("{current} of {total}", undefined, {
                current: formatNumber(currentIndex + 1),
                total: formatNumber(items.length),
              })}
              size="small"
              sx={{ height: 20, fontSize: "0.75rem", ml: 1 }}
            />
          )}
        </Box>

        {/* Center: Viewer Controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title={t("Zoom Out (-)")}>
            <span>
              <IconButton
                size="small"
                onClick={handleZoomOut}
                disabled={zoom <= 25}
                aria-label={t("Zoom Out")}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 42, textAlign: "center", fontWeight: 600 }}>
            {zoom}%
          </Typography>
          <Tooltip title={t("Zoom In (+)")}>
            <span>
              <IconButton
                size="small"
                onClick={handleZoomIn}
                disabled={zoom >= 400}
                aria-label={t("Zoom In")}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t("Reset Zoom (0)")}>
            <IconButton size="small" onClick={handleResetZoom} aria-label={t("Reset Zoom")}>
              <ResetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
          <Tooltip title={t("Rotate 90° (R)")}>
            <IconButton size="small" onClick={handleRotate} aria-label={t("Rotate 90°")}>
              <RotateRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? t("Exit Fullscreen") : t("Fullscreen")}>
            <IconButton
              size="small"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label={isFullscreen ? t("Exit Fullscreen") : t("Fullscreen")}
            >
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right: Actions & Close */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title={t("Print Document")}>
            <IconButton size="small" onClick={handlePrint} aria-label={t("Print Document")}>
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Download Document")}>
            <IconButton size="small" onClick={handleDownload} color="primary" aria-label={t("Download Document")}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {blobUrl && (
            <Tooltip title={t("Open in New Tab")}>
              <IconButton
                size="small"
                component="a"
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("Open in New Tab")}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
          <Tooltip title={t("Close (Esc)")}>
            <IconButton size="small" onClick={onClose} edge="end" aria-label={t("Close (Esc)")}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content Area */}
      <DialogContent
        sx={{
          p: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: (theme) => (theme.palette.mode === "dark" ? "#121212" : "#525659"),
          position: "relative",
          overflow: "auto",
        }}
      >
        {/* Navigation arrows overlay when gallery */}
        {items.length > 1 && (
          <>
            <Box
              sx={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            >
              <Tooltip title={t("Previous (Left Arrow)")}>
                <span>
                  <IconButton
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    sx={{
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                      "&.Mui-disabled": { bgcolor: "rgba(0,0,0,0.15)", color: "rgba(255,255,255,0.3)" },
                    }}
                  >
                    <PrevIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Box
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            >
              <Tooltip title={t("Next (Right Arrow)")}>
                <span>
                  <IconButton
                    onClick={handleNext}
                    disabled={currentIndex === items.length - 1}
                    sx={{
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                      "&.Mui-disabled": { bgcolor: "rgba(0,0,0,0.15)", color: "rgba(255,255,255,0.3)" },
                    }}
                  >
                    <NextIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </>
        )}

        {/* Loading Spinner */}
        {loading && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              gap: 2,
            }}
          >
            <CircularProgress color="inherit" />
            <Typography variant="body2">{t("Loading document preview...")}</Typography>
          </Box>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
            <Paper sx={{ p: 3, maxWidth: 500, width: "100%", bgcolor: "background.paper" }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {t("The attachment could not be loaded for inline preview. You may download it directly instead.")}
              </Typography>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload} fullWidth>
                {t("Download Document")}
              </Button>
            </Paper>
          </Box>
        )}

        {/* Render Viewers by Category */}
        {!loading && !error && (
          <Box
            sx={{
              flex: 1,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "auto",
              p: 2,
            }}
          >
            {/* 1. PDF VIEWER */}
            {category === "pdf" && blobUrl && (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s ease",
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <object
                  data={blobUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  style={{ borderRadius: 4, border: "none" }}
                >
                  <Box
                    sx={{
                      p: 4,
                      textAlign: "center",
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      maxWidth: 480,
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {t("PDF Inline Preview")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t("Your browser does not support embedding PDFs directly. You can view or download it using the buttons below.")}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                      <Button variant="outlined" component="a" href={blobUrl} target="_blank">
                        {t("Open in New Tab")}
                      </Button>
                      <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload}>
                        {t("Download")}
                      </Button>
                    </Box>
                  </Box>
                </object>
              </Box>
            )}

            {/* 2. IMAGE VIEWER */}
            {category === "image" && blobUrl && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "100%",
                  width: "100%",
                  overflow: "auto",
                }}
              >
                <Box
                  component="img"
                  src={blobUrl}
                  alt={currentItem.fileName}
                  sx={{
                    maxWidth: zoom <= 100 ? "90%" : "none",
                    maxHeight: zoom <= 100 ? "85vh" : "none",
                    objectFit: "contain",
                    borderRadius: 1,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    transition: "transform 0.15s ease",
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                />
              </Box>
            )}

            {/* 3. WORD DOCUMENT VIEWER (.docx inline rendered) */}
            {category === "word" && (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: 3,
                }}
              >
                {docxWarning && (
                  <Alert severity="warning" sx={{ mb: 2, maxWidth: 840, width: "100%" }}>
                    {docxWarning} {t("— Formatting may be approximate. You can also")}{" "}
                    <Button size="small" onClick={handleDownload} sx={{ p: 0, textTransform: "none", textDecoration: "underline" }}>
                      {t("download the original .docx file")}
                    </Button>.
                  </Alert>
                )}

                {docxHtml ? (
                  <Paper
                    elevation={4}
                    sx={{
                      width: "100%",
                      maxWidth: 840,
                      minHeight: 1100,
                      bgcolor: "#ffffff",
                      color: "#1c1c1c",
                      p: { xs: 3, md: 6 },
                      borderRadius: 1,
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: "top center",
                      transition: "transform 0.15s ease",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                      "& table": {
                        borderCollapse: "collapse",
                        width: "100%",
                        my: 2,
                      },
                      "& th, & td": {
                        border: "1px solid #d1d5db",
                        padding: "8px 12px",
                        textAlign: "left",
                      },
                      "& th": {
                        bgcolor: "#f3f4f6",
                        fontWeight: 600,
                      },
                      "& h1": { fontSize: "1.75rem", mt: 2, mb: 1.5, color: "#111827" },
                      "& h2": { fontSize: "1.4rem", mt: 2, mb: 1, color: "#1f2937" },
                      "& h3": { fontSize: "1.15rem", mt: 1.5, mb: 0.5, color: "#374151" },
                      "& p": { lineHeight: 1.7, my: 1 },
                      "& ul, & ol": { pl: 3, my: 1 },
                      "& img": { maxWidth: "100%", height: "auto", my: 1 },
                    }}
                    dangerouslySetInnerHTML={{ __html: docxHtml }}
                  />
                ) : (
                  <Paper sx={{ p: 4, maxWidth: 500, textAlign: "center", borderRadius: 2 }}>
                    <DocIcon sx={{ fontSize: 56, color: "primary.main", mb: 1 }} />
                    <Typography variant="h6" gutterBottom>
                      {t("Word Document")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t("This document (")}{currentItem.fileName}{t(") could not be parsed for direct inline HTML preview.")}
                    </Typography>
                    <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload}>
                      {t("Download Word Document")}
                    </Button>
                  </Paper>
                )}
              </Box>
            )}

            {/* 4. TEXT / CODE VIEWER */}
            {category === "text" && (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 900,
                  height: "100%",
                  overflow: "auto",
                  p: 2,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Paper
                  sx={{
                    width: "100%",
                    p: 3,
                    bgcolor: (theme) => (theme.palette.mode === "dark" ? "#1e1e1e" : "#f8f9fa"),
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    borderRadius: 2,
                    fontSize: `${(zoom / 100) * 0.9}rem`,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                >
                  {textContent || "Loading text content..."}
                </Paper>
              </Box>
            )}

            {/* 5. FALLBACK / OTHER FILE TYPES */}
            {category === "other" && (
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  maxWidth: 480,
                  width: "100%",
                  textAlign: "center",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                }}
              >
                <GenericFileIcon sx={{ fontSize: 64, color: "text.secondary", mb: 1.5 }} />
                <Typography variant="h6" gutterBottom>
                  {currentItem.fileName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t("This file type cannot be rendered inline in the previewer. Download the file to view it using an appropriate desktop application.")}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                  <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload}>
                    {t("Download Attachment")}
                  </Button>
                  {blobUrl && (
                    <Button variant="outlined" component="a" href={blobUrl} target="_blank">
                      {t("Open Externally")}
                    </Button>
                  )}
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Universal Footer Bar */}
      <Box
        sx={{
          py: 1,
          px: 2,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            <strong>{t("File:")}</strong> {currentItem.fileName}
          </Typography>
          {currentItem.uploadedAt && (
            <Typography variant="caption" color="text.secondary">
              <strong>{t("Uploaded:")}</strong> {formatDate(new Date(currentItem.uploadedAt), undefined, { dateStyle: "medium", timeStyle: "short" })}
            </Typography>
          )}
        </Box>

        {items.length > 1 && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              size="small"
              startIcon={<PrevIcon />}
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              {t("Previous")}</Button>
            <Typography variant="caption" sx={{ px: 1, fontWeight: 600 }}>
              {currentIndex + 1} / {items.length}
            </Typography>
            <Button
              size="small"
              endIcon={<NextIcon />}
              onClick={handleNext}
              disabled={currentIndex === items.length - 1}
            >
              {t("Next")}</Button>
          </Box>
        )}

        <Button size="small" variant="outlined" onClick={onClose}>
          {t("Close")}</Button>
      </Box>
    </Dialog>
  );
}
