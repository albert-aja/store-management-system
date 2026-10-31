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
import { t } from "../../lib/locale";

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
        <DialogTitle>
          {initial ? t("Edit Supplier") : t("New Supplier")}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label={t("Name")}
            required
            fullWidth
            {...register("name", { required: true })}
          />
          <TextField label={t("Code")} fullWidth {...register("code")} />
          <TextField label={t("Address")} fullWidth {...register("address")} />
          <TextField label={t("Notes")} fullWidth {...register("notes")} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("Cancel")}</Button>
          <Button type="submit" variant="contained">
            {t("Save")}</Button>
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
    { field: "code", headerName: t("Code"), width: 120 },
    { field: "name", headerName: t("Name"), flex: 1 },
    { field: "address", headerName: t("Address"), flex: 1 },
    {
      field: "active",
      headerName: t("Active"),
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
            {t("Open")}</Button>
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
        <Typography variant="h5">{t("Suppliers")}</Typography>
        {canManage && (
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            {t("New Supplier")}
          </Button>
        )}
      </Box>
      <TextField
        label={t("Search by name or code")}
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
                editing ? t("Supplier updated") : t("Supplier created"),
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
