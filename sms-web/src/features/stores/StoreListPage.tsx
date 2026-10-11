import { useState } from "react";
import { Box, Button, Switch, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useSnackbar } from "notistack";
import { useAuthStore } from "../../store/authStore";
import {
  useCreateStore,
  useSetStoreActive,
  useStores,
  useUpdateStore,
} from "./hooks";
import StoreFormDialog from "./StoreFormDialog";
import type { Store } from "./types";

export default function StoreListPage() {
  const { data, isLoading } = useStores();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();
  const setActive = useSetStoreActive();
  const canManage = useAuthStore((s) => s.hasPermission("STORE_MANAGE"));
  const { enqueueSnackbar } = useSnackbar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  const columns: GridColDef<Store>[] = [
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
    ...(canManage
      ? [
          {
            field: "actions",
            headerName: "",
            width: 100,
            renderCell: (params: { row: Store }) => (
              <Button
                size="small"
                onClick={() => {
                  setEditing(params.row);
                  setDialogOpen(true);
                }}
              >
                Edit
              </Button>
            ),
          },
        ]
      : []),
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
        <Typography variant="h5">Stores</Typography>
        {canManage && (
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New Store
          </Button>
        )}
      </Box>
      <DataGrid
        rows={data ?? []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        autoHeight
        disableRowSelectionOnClick
      />
      <StoreFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values) => {
          const action = editing
            ? updateStore.mutateAsync({ id: editing.id, input: values })
            : createStore.mutateAsync(values);
          action.then(() => {
            enqueueSnackbar(editing ? "Store updated" : "Store created", {
              variant: "success",
            });
            setDialogOpen(false);
          });
        }}
      />
    </Box>
  );
}
