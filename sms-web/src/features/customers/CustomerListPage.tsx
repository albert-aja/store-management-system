import { useState } from "react";
import { Box, Button, Chip, Switch, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
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

function getSegmentChip(segment: string | undefined) {
  switch (segment) {
    case "VIP_CASH":
      return <Chip label="VIP Cash" size="small" color="warning" />;
    case "STAR_CREDIT":
      return <Chip label="Star Credit" size="small" color="secondary" />;
    case "HIGH_DELINQUENCY_RISK":
      return <Chip label="High Risk" size="small" color="error" />;
    default:
      return <Chip label="Standard" size="small" variant="outlined" />;
  }
}

function getCreditScoreBadge(grade: string | undefined, score: number | undefined) {
  const g = grade ?? "B";
  const color = g === "A" ? "success" : g === "B" ? "info" : g === "C" ? "warning" : "error";
  return (
    <Chip
      icon={<StarIcon style={{ fontSize: "0.85rem" }} />}
      label={`${g} (${score ?? 80})`}
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

  const filteredData = (data ?? []).filter((c) => {
    if (segmentFilter === "ALL") return true;
    return (c.segment ?? "STANDARD") === segmentFilter;
  });

  const columns: GridColDef<Customer>[] = [
    { field: "fullName", headerName: "Full Name", flex: 1.2 },
    { field: "nik", headerName: "NIK", width: 140 },
    { field: "primaryPhone", headerName: "Phone", width: 130 },
    {
      field: "segment",
      headerName: "CRM Segment",
      width: 130,
      renderCell: (params) => getSegmentChip(params.row.segment),
    },
    {
      field: "creditScoreGrade",
      headerName: "Credit Rating",
      width: 120,
      renderCell: (params) => getCreditScoreBadge(params.row.creditScoreGrade, params.row.creditScorePoints),
    },
    { field: "primaryEmail", headerName: "Email", flex: 1 },
    {
      field: "active",
      headerName: "Active",
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
            360 Profile
          </Button>
          {canManage && (
            <Button
              size="small"
              onClick={() => {
                setEditing(params.row);
                setDialogOpen(true);
              }}
            >
              Edit
            </Button>
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
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Customer Directory & CRM 360
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Master profil pelanggan, segmentasi perilaku, skoring kredit terintegrasi, dan riwayat omnichannel.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() =>
              exportToCsv(
                "customers_crm_directory",
                [
                  { key: "fullName", label: "Full Name" },
                  { key: "nik", label: "NIK" },
                  { key: "primaryPhone", label: "Phone" },
                  { key: "segment", label: "CRM Segment" },
                  { key: "creditScoreGrade", label: "Credit Grade" },
                  { key: "primaryEmail", label: "Email" },
                  { key: "active", label: "Active" },
                ],
                filteredData,
              )
            }
          >
            Export CSV
          </Button>
          {canManage && (
            <Button
              variant="contained"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              New Customer
            </Button>
          )}
        </Box>
      </Box>

      {/* Quick CRM Segment Filters */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", mr: 1 }}>
          Filter Segmen:
        </Typography>
        <Chip
          label="Semua Pelanggan"
          clickable
          color={segmentFilter === "ALL" ? "primary" : "default"}
          onClick={() => setSegmentFilter("ALL")}
          size="small"
        />
        <Chip
          label="VIP Cash Buyer"
          clickable
          color={segmentFilter === "VIP_CASH" ? "warning" : "default"}
          onClick={() => setSegmentFilter("VIP_CASH")}
          size="small"
        />
        <Chip
          label="Star Credit"
          clickable
          color={segmentFilter === "STAR_CREDIT" ? "secondary" : "default"}
          onClick={() => setSegmentFilter("STAR_CREDIT")}
          size="small"
        />
        <Chip
          label="High Delinquency Risk"
          clickable
          color={segmentFilter === "HIGH_DELINQUENCY_RISK" ? "error" : "default"}
          onClick={() => setSegmentFilter("HIGH_DELINQUENCY_RISK")}
          size="small"
        />
        <Chip
          label="Standard Account"
          clickable
          color={segmentFilter === "STANDARD" ? "primary" : "default"}
          onClick={() => setSegmentFilter("STANDARD")}
          size="small"
          variant="outlined"
        />
      </Box>

      <TextField
        label="Search by name, NIK, or phone"
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
        disableRowSelectionOnClick
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
            enqueueSnackbar(editing ? "Customer updated" : "Customer created", {
              variant: "success",
            });
            setDialogOpen(false);
          });
        }}
      />
    </Box>
  );
}
