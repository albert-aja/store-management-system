import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import type { Store } from "./types";
import { t } from "../../lib/locale";

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  initial?: Store | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

export default function StoreFormDialog({
  open,
  initial,
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
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      address: initial?.address ?? "",
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{initial ? t("Edit Store") : t("New Store")}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label={t("Code")}
            fullWidth
            disabled={!!initial}
            {...register("code")}
            error={!!errors.code}
            helperText={errors.code?.message}
          />
          <TextField
            label={t("Name")}
            fullWidth
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label={t("Address")}
            fullWidth
            multiline
            rows={2}
            {...register("address")}
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
