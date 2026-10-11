import { useState } from "react";
import { Box, Button, Switch, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import ProductFormDialog from "./ProductFormDialog";
import {
  useBrands,
  useCategories,
  useCreateProduct,
  useProductSearch,
  useSetProductActive,
  useUpdateProduct,
} from "./hooks";
import type { Product } from "./types";

export default function ProductListPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useProductSearch(query);
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const setActive = useSetProductActive();
  const canManage = useAuthStore((s) => s.hasPermission("PRODUCT_MANAGE"));
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const columns: GridColDef<Product>[] = [
    { field: "code", headerName: "Code", width: 120 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "categoryName", headerName: "Category", width: 150 },
    { field: "brandName", headerName: "Brand", width: 150 },
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
      renderCell: (params: { row: Product }) => (
        <>
          <Button
            size="small"
            onClick={() => navigate(`/products/${params.row.id}`)}
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
        <Typography variant="h5">Products</Typography>
        {canManage && (
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New Product
          </Button>
        )}
      </Box>
      <TextField
        label="Search by name, code, category, or brand"
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
      <ProductFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        initial={editing}
        categories={categories}
        brands={brands}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values) => {
          const input = {
            ...values,
            categoryId: values.categoryId || undefined,
            brandId: values.brandId || undefined,
            description: values.description || undefined,
          };
          const action = editing
            ? updateProduct.mutateAsync({ id: editing.id, input })
            : createProduct.mutateAsync(input);
          action.then(() => {
            enqueueSnackbar(editing ? "Product updated" : "Product created", {
              variant: "success",
            });
            setDialogOpen(false);
          });
        }}
      />
    </Box>
  );
}
