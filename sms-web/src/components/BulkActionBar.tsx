import { formatNumber, t } from "../lib/locale";
import { useState, type ReactNode } from "react";
import {
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Slide,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditNoteIcon from "@mui/icons-material/EditNote";
import PrintIcon from "@mui/icons-material/Print";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import BulkStatusUpdateDialog, { type StatusOption } from "./BulkStatusUpdateDialog";
import { exportDataGrid, extractSelectedRowIds, getSelectedRowCount } from "../lib/exportDataGrid";

export interface BulkPrintOption {
  type: string;
  label: string;
}

export interface BulkCustomAction {
  label: string;
  icon?: ReactNode;
  onClick: (selectedIds: (string | number)[]) => void;
  disabled?: boolean;
  color?: "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning";
}

export interface BulkActionBarProps<T extends object = any> {
  selectedRowIds: GridRowSelectionModel | (string | number)[];
  totalCount?: number;
  onClearSelection: () => void;
  columns?: GridColDef<T>[];
  rows?: T[];
  exportFilename?: string;
  exportTitle?: string;
  statusUpdate?: {
    title?: string;
    statusOptions: StatusOption[];
    onConfirm: (targetStatus: string, reason?: string) => Promise<void>;
    requireReason?: boolean;
    reasonLabel?: string;
  };
  printOptions?: BulkPrintOption[];
  onPrint?: (printType: string, selectedIds: (string | number)[]) => void;
  customActions?: BulkCustomAction[];
}

export default function BulkActionBar<T extends object = any>({
  selectedRowIds,
  totalCount,
  onClearSelection,
  columns,
  rows,
  exportFilename = "export_data",
  exportTitle,
  statusUpdate,
  printOptions,
  onPrint,
  customActions = [],
}: BulkActionBarProps<T>) {
  const selectedCount = getSelectedRowCount(selectedRowIds, totalCount);
  const isVisible = selectedCount > 0;
  const selectedIdsArray = extractSelectedRowIds(selectedRowIds, rows as any);

  // Status update modal state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Export menu anchor
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

  // Print menu anchor
  const [printAnchorEl, setPrintAnchorEl] = useState<null | HTMLElement>(null);

  const handleExport = (format: "xlsx" | "csv", onlySelected: boolean) => {
    setExportAnchorEl(null);
    if (!columns || !rows) return;
    exportDataGrid({
      filename: exportFilename,
      title: exportTitle,
      columns,
      rows,
      selectedRowIds: onlySelected ? selectedRowIds : undefined,
      format,
    });
  };

  const handleTriggerPrint = (printType: string) => {
    setPrintAnchorEl(null);
    if (onPrint) {
      onPrint(printType, selectedIdsArray);
    } else {
      const idsParam = selectedIdsArray.join(",");
      const printUrl = `/api/documents/print/bulk?type=${encodeURIComponent(printType)}&ids=${encodeURIComponent(idsParam)}`;
      window.open(printUrl, "_blank");
    }
  };

  return (
    <>
      <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%) !important",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2.5,
            py: 1.2,
            borderRadius: 8,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "#1e293b" : "#0f172a",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
            maxWidth: "95vw",
            overflowX: "auto",
          }}
        >
          {/* Badge & counter */}
          <Chip
            label={t("{count} selected", undefined, {
              count: formatNumber(selectedCount),
            })}
            size="small"
            color="primary"
            sx={{ fontWeight: 700, px: 0.5 }}
          />

          <Typography variant="body2" sx={{ color: "#cbd5e1", whiteSpace: "nowrap" }}>
            {t("Aksi Massal:")}
          </Typography>

          {/* Bulk Status Update */}
          {statusUpdate && (
            <Button
              variant="contained"
              size="small"
              color="info"
              startIcon={<EditNoteIcon />}
              onClick={() => setStatusDialogOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              {t("Ubah Status")}
            </Button>
          )}

          {/* Bulk Document Print */}
          {printOptions && printOptions.length > 0 && (
            <>
              {printOptions.length === 1 ? (
                <Button
                  variant="outlined"
                  size="small"
                  color="inherit"
                  startIcon={<PrintIcon />}
                  onClick={() => handleTriggerPrint(printOptions[0].type)}
                  sx={{ textTransform: "none", fontWeight: 600, borderColor: "#475569", whiteSpace: "nowrap" }}
                >
                  {printOptions[0].label}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    color="inherit"
                    startIcon={<PrintIcon />}
                    endIcon={<KeyboardArrowDownIcon />}
                    onClick={(e) => setPrintAnchorEl(e.currentTarget)}
                    sx={{ textTransform: "none", fontWeight: 600, borderColor: "#475569", whiteSpace: "nowrap" }}
                  >
                    {t("Cetak Dokumen")}
                  </Button>
                  <Menu
                    anchorEl={printAnchorEl}
                    open={Boolean(printAnchorEl)}
                    onClose={() => setPrintAnchorEl(null)}
                  >
                    {printOptions.map((opt) => (
                      <MenuItem key={opt.type} onClick={() => handleTriggerPrint(opt.type)}>
                        {opt.label} ({selectedCount} {t("dokumen)")}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
            </>
          )}

          {/* Bulk Export Menu */}
          {columns && rows && (
            <>
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                startIcon={<FileDownloadIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                onClick={(e) => setExportAnchorEl(e.currentTarget)}
                sx={{ textTransform: "none", fontWeight: 600, borderColor: "#475569", whiteSpace: "nowrap" }}
              >
                {t("Ekspor")}
              </Button>
              <Menu
                anchorEl={exportAnchorEl}
                open={Boolean(exportAnchorEl)}
                onClose={() => setExportAnchorEl(null)}
              >
                <MenuItem onClick={() => handleExport("xlsx", true)}>
                  {t("Ekspor Terpilih ke Excel (.xlsx) (")}{selectedCount} {t("baris)")}
                </MenuItem>
                <MenuItem onClick={() => handleExport("csv", true)}>
                  {t("Ekspor Terpilih ke CSV (.csv) (")}{selectedCount} {t("baris)")}
                </MenuItem>
                {totalCount !== undefined && totalCount > selectedCount && (
                  <>
                    <MenuItem onClick={() => handleExport("xlsx", false)}>
                      {t("Ekspor Semua ke Excel (.xlsx) (")}{totalCount} {t("baris)")}
                    </MenuItem>
                    <MenuItem onClick={() => handleExport("csv", false)}>
                      {t("Ekspor Semua ke CSV (.csv) (")}{totalCount} {t("baris)")}
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          )}

          {/* Custom Actions */}
          {customActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outlined"
              size="small"
              color={action.color || "inherit"}
              startIcon={action.icon}
              disabled={action.disabled}
              onClick={() => action.onClick(selectedIdsArray)}
              sx={{ textTransform: "none", fontWeight: 600, borderColor: "#475569", whiteSpace: "nowrap" }}
            >
              {action.label}
            </Button>
          ))}

          {/* Clear selection button */}
          <Tooltip title={t("Batalkan Pilihan (Deselect All)")}>
            <IconButton
              size="small"
              onClick={onClearSelection}
              sx={{ color: "#94a3b8", "&:hover": { color: "#ffffff" }, ml: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      </Slide>

      {/* Bulk Status Update Dialog */}
      {statusUpdate && (
        <BulkStatusUpdateDialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          onConfirm={statusUpdate.onConfirm}
          selectedCount={selectedCount}
          title={statusUpdate.title}
          statusOptions={statusUpdate.statusOptions}
          requireReason={statusUpdate.requireReason}
          reasonLabel={statusUpdate.reasonLabel}
        />
      )}
    </>
  );
}
