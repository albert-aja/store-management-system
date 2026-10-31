import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import type { Brand, Category, Product } from "./types";
import { t } from "../../lib/locale";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  initial?: Product | null;
  categories?: Category[];
  brands?: Brand[];
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

export default function ProductFormDialog({
  open,
  initial,
  categories = [],
  brands = [],
  onClose,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      categoryId: initial?.categoryId ?? "",
      brandId: initial?.brandId ?? "",
      description: initial?.description ?? "",
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{initial ? t("Edit Product") : t("New Product")}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label={t("Name")}
            fullWidth
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            select
            label={t("Category")}
            fullWidth
            defaultValue={initial?.categoryId ?? ""}
            {...register("categoryId")}
          >
            <MenuItem value="">{t("None")}</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("Brand")}
            fullWidth
            defaultValue={initial?.brandId ?? ""}
            {...register("brandId")}
          >
            <MenuItem value="">{t("None")}</MenuItem>
            {brands.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t("Description")}
            fullWidth
            multiline
            rows={3}
            {...register("description")}
          />
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
