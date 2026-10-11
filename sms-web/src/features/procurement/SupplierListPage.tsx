import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useForm } from "react-hook-form";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  useCreateSupplier,
  useSetSupplierActive,
  useSupplierSearch,
  useUpdateSupplier,
} from "./hooks";
import type { Supplier, SupplierInput } from "./types";

function SupplierDialog({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Supplier | null;
  onClose: () => void;
  onSubmit: (input: SupplierInput) => void;
}) {
  const { register, handleSubmit } = useForm<SupplierInput>({
    defaultValues: {
      name: initial?.name ?? "",
      code: initial?.code ?? "",
      address: initial?.address ?? "",
      notes: initial?.notes ?? "",
    },
  });
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{initial ? "Edit Supplier" : "New Supplier"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Name"
            required
            fullWidth
            {...register("name", { required: true })}
          />
          <TextField label="Code" fullWidth {...register("code")} />
          <TextField label="Address" fullWidth {...register("address")} />
          <TextField label="Notes" fullWidth {...register("notes")} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function SupplierListPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useSupplierSearch(query);
  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const setActive = useSetSupplierActive();
  const canManage = useAuthStore((s) => s.hasPermission("PROCUREMENT_MANAGE"));
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const columns: GridColDef<Supplier>[] = [
    { field: "code", headerName: "Code", width: 120 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "address", headerName: "Address", flex: 1 },
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
      renderCell: (params: { row: Supplier }) => (
        <>
          <Button
            size="small"
            onClick={() => navigate(`/suppliers/${params.row.id}`)}
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
        <Typography variant="h5">Suppliers</Typography>
        {canManage && (
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New Supplier
          </Button>
        )}
      </Box>
      <TextField
        label="Search by name or code"
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
      {dialogOpen && (
        <SupplierDialog
          initial={editing}
          onClose={() => setDialogOpen(false)}
          onSubmit={(values) => {
            const input = {
              ...values,
              code: values.code || undefined,
              address: values.address || undefined,
              notes: values.notes || undefined,
            };
            const action = editing
              ? update.mutateAsync({ id: editing.id, input })
              : create.mutateAsync(input);
            action.then(() => {
              enqueueSnackbar(
                editing ? "Supplier updated" : "Supplier created",
                { variant: "success" },
              );
              setDialogOpen(false);
            });
          }}
        />
      )}
    </Box>
  );
}
