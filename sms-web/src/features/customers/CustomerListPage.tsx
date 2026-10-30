import { useState } from "react";
import { Box, Button, Switch, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useSnackbar } from "notistack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { exportToCsv } from "../../lib/exportCsv";
import CustomerFormDialog from "./CustomerFormDialog";
import {
  useCreateCustomer,
  useCustomerSearch,
  useSetCustomerActive,
  useUpdateCustomer,
} from "./hooks";
import type { Customer } from "./types";

export default function CustomerListPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useCustomerSearch(query);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const setActive = useSetCustomerActive();
  const canManage = useAuthStore((s) => s.hasPermission("CUSTOMER_MANAGE"));
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const columns: GridColDef<Customer>[] = [
    { field: "fullName", headerName: "Full Name", flex: 1 },
    { field: "nik", headerName: "NIK", width: 150 },
    { field: "primaryPhone", headerName: "Phone", width: 150 },
    { field: "primaryEmail", headerName: "Email", flex: 1 },
    {
      field: "active",
      headerName: "Active",
      width: 100,
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
      width: 180,
      renderCell: (params: { row: Customer }) => (
        <>
          <Button
            size="small"
            onClick={() => navigate(`/customers/${params.row.id}`)}
          >
            Open
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
        <Typography variant="h5">Customers</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() =>
              exportToCsv(
                "customers_directory",
                [
                  { key: "fullName", label: "Full Name" },
                  { key: "nik", label: "NIK" },
                  { key: "primaryPhone", label: "Phone" },
                  { key: "primaryEmail", label: "Email" },
                  { key: "active", label: "Active" },
                ],
                data ?? [],
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
      <TextField
        label="Search by name, NIK, or phone"
        fullWidth
        sx={{ mb: 2 }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <DataGrid
        rows={data ?? []}
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
        onSubmit={(values) => {
          const input = {
            ...values,
            primaryEmail: values.primaryEmail || undefined,
            nik: values.nik || undefined,
            primaryPhone: values.primaryPhone || undefined,
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
