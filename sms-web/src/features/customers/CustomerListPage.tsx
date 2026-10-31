import { useState } from "react";
import { Box, Button, Chip, Switch, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef, type GridRowSelectionModel } from "@mui/x-data-grid";
import BulkActionBar from "../../components/BulkActionBar";
import { useSnackbar } from "notistack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { exportToCsv } from "../../lib/exportCsv";
import CustomerFormDialog from "./CustomerFormDialog";
import {
  useCheckFuzzyDuplicate,
  useCreateCustomer,
  useCustomerSearch,
  useSetCustomerActive,
  useUpdateCustomer,
} from "./hooks";
import type { Customer } from "./types";
import { formatNumber, t } from "../../lib/locale";

const INITIAL_SELECTION: GridRowSelectionModel = { type: "include", ids: new Set() };

function getSegmentChip(segment: string | undefined) {
  switch (segment) {
    case "VIP_CASH":
      return <Chip label={t("VIP Cash")} size="small" color="warning" />;
    case "STAR_CREDIT":
      return <Chip label={t("Star Credit")} size="small" color="secondary" />;
    case "HIGH_DELINQUENCY_RISK":
      return <Chip label={t("High Risk")} size="small" color="error" />;
    default:
      return <Chip label={t("Standard")} size="small" variant="outlined" />;
  }
}

function getCreditScoreBadge(grade: string | undefined, score: number | undefined) {
  const g = grade ?? "B";
  const color = g === "A" ? "success" : g === "B" ? "info" : g === "C" ? "warning" : "error";
  return (
    <Chip
      icon={<StarIcon style={{ fontSize: "0.85rem" }} />}
      label={`${g} (${formatNumber(score ?? 80)})`}
      size="small"
      color={color}
      variant="outlined"
    />
  );
}

export default function CustomerListPage() {
  const [query, setQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("ALL");
  const { data, isLoading } = useCustomerSearch(query);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const setActive = useSetCustomerActive();
  const checkDuplicate = useCheckFuzzyDuplicate();
  const canManage = useAuthStore((s) => s.hasPermission("CUSTOMER_MANAGE"));
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowSelectionModel>(INITIAL_SELECTION);

  const filteredData = (data ?? []).filter((c) => {
    if (segmentFilter === "ALL") return true;
    return (c.segment ?? "STANDARD") === segmentFilter;
  });

  const columns: GridColDef<Customer>[] = [
    { field: "fullName", headerName: t("Full Name"), flex: 1.2 },
    { field: "nik", headerName: t("NIK"), width: 140 },
    { field: "primaryPhone", headerName: t("Phone"), width: 130 },
    {
      field: "segment",
      headerName: t("CRM Segment"),
      width: 130,
      renderCell: (params) => getSegmentChip(params.row.segment),
    },
    {
      field: "creditScoreGrade",
      headerName: t("Credit Rating"),
      width: 120,
      renderCell: (params) => getCreditScoreBadge(params.row.creditScoreGrade, params.row.creditScorePoints),
    },
    { field: "primaryEmail", headerName: t("Email"), flex: 1 },
    {
      field: "active",
      headerName: t("Active"),
      width: 90,
      renderCell: (params) => (
        <Switch
          checked={params.row.active}
          disabled={!canManage}
          onChange={(e) =>
            setActive.mutate({ id: params.row.id, active: e.target.checked })
          }
        />
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 170,
      renderCell: (params: { row: Customer }) => (
        <>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/customers/${params.row.id}`)}
          >
            {t("360 Profile")}
          </Button>
          {canManage && (
            <Button
              size="small"
              onClick={() => {
                setEditing(params.row);
                setDialogOpen(true);
              }}
            >
              {t("Edit")}</Button>
          )}
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t("Customer Directory & CRM 360")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("Master profil pelanggan, segmentasi perilaku, skoring kredit terintegrasi, dan riwayat omnichannel.")}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() =>
              exportToCsv(
                "customers_crm_directory",
                [
                  { key: "fullName", label: t("Full Name") },
                  { key: "nik", label: t("NIK") },
                  { key: "primaryPhone", label: t("Phone") },
                  { key: "segment", label: t("CRM Segment") },
                  { key: "creditScoreGrade", label: t("Credit Grade") },
                  { key: "primaryEmail", label: t("Email") },
                  { key: "active", label: t("Active") },
                ],
                filteredData,
              )
            }
          >
            {t("Export CSV")}
          </Button>
          {canManage && (
            <Button
              variant="contained"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              {t("New Customer")}
            </Button>
          )}
        </Box>
      </Box>

      {/* Quick CRM Segment Filters */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", mr: 1 }}>
          {t("Filter Segmen:")}
        </Typography>
        <Chip
          label={t("Semua Pelanggan")}
          clickable
          color={segmentFilter === "ALL" ? "primary" : "default"}
          onClick={() => setSegmentFilter("ALL")}
          size="small"
        />
        <Chip
          label={t("VIP Cash Buyer")}
          clickable
          color={segmentFilter === "VIP_CASH" ? "warning" : "default"}
          onClick={() => setSegmentFilter("VIP_CASH")}
          size="small"
        />
        <Chip
          label={t("Star Credit")}
          clickable
          color={segmentFilter === "STAR_CREDIT" ? "secondary" : "default"}
          onClick={() => setSegmentFilter("STAR_CREDIT")}
          size="small"
        />
        <Chip
          label={t("High Delinquency Risk")}
          clickable
          color={segmentFilter === "HIGH_DELINQUENCY_RISK" ? "error" : "default"}
          onClick={() => setSegmentFilter("HIGH_DELINQUENCY_RISK")}
          size="small"
        />
        <Chip
          label={t("Standard Account")}
          clickable
          color={segmentFilter === "STANDARD" ? "primary" : "default"}
          onClick={() => setSegmentFilter("STANDARD")}
          size="small"
          variant="outlined"
        />
      </Box>

      <TextField
        label={t("Search by name, NIK, or phone")}
        fullWidth
        sx={{ mb: 2 }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <DataGrid
        rows={filteredData}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        autoHeight
        checkboxSelection
        rowSelectionModel={selectedRowIds}
        onRowSelectionModelChange={(newModel) => setSelectedRowIds(newModel)}
        disableRowSelectionOnClick
      />
      <BulkActionBar
        selectedRowIds={selectedRowIds}
        totalCount={filteredData.length}
        onClearSelection={() => setSelectedRowIds(INITIAL_SELECTION)}
        columns={columns}
        rows={filteredData}
        exportFilename="customers_master"
        exportTitle="DATABASE MASTER PELANGGAN (CUSTOMER 360)"
      />
      <CustomerFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onCheckDuplicate={(input) => checkDuplicate.mutateAsync(input)}
        onSubmit={(values) => {
          const input = {
            ...values,
            primaryEmail: values.primaryEmail || undefined,
            nik: values.nik || undefined,
            primaryPhone: values.primaryPhone || undefined,
            motherMaidenName: values.motherMaidenName || undefined,
            birthDate: values.birthDate || undefined,
            birthPlace: values.birthPlace || undefined,
          };
          const action = editing
            ? updateCustomer.mutateAsync({ id: editing.id, input })
            : createCustomer.mutateAsync(input);
          action.then(() => {
            enqueueSnackbar(editing ? t("Customer updated") : t("Customer created"), {
              variant: "success",
            });
            setDialogOpen(false);
          });
        }}
      />
    </Box>
  );
}
