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
import type { Customer } from "./types";

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  nik: z.string().optional(),
  primaryPhone: z.string().optional(),
  primaryEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  initial?: Customer | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

export default function CustomerFormDialog({
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
      fullName: initial?.fullName ?? "",
      nik: initial?.nik ?? "",
      primaryPhone: initial?.primaryPhone ?? "",
      primaryEmail: initial?.primaryEmail ?? "",
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{initial ? "Edit Customer" : "New Customer"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Full Name"
            fullWidth
            {...register("fullName")}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
          />
          <TextField label="NIK" fullWidth {...register("nik")} />
          <TextField
            label="Primary Phone"
            fullWidth
            {...register("primaryPhone")}
          />
          <TextField
            label="Primary Email"
            fullWidth
            {...register("primaryEmail")}
            error={!!errors.primaryEmail}
            helperText={errors.primaryEmail?.message}
          />
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
