import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import type { Employee } from "./types";

const schema = z.object({
  employeeNumber: z.string().min(1, "Employee number is required"),
  fullName: z.string().min(1, "Full name is required"),
  nik: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  employmentType: z.enum(["PERMANENT", "FREELANCE"]),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  initial?: Employee | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

export default function EmployeeFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeNumber: initial?.employeeNumber ?? "",
      fullName: initial?.fullName ?? "",
      nik: initial?.nik ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      employmentType: initial?.employmentType ?? "PERMANENT",
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{initial ? "Edit Employee" : "New Employee"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Employee Number"
            fullWidth
            disabled={!!initial}
            {...register("employeeNumber")}
            error={!!errors.employeeNumber}
            helperText={errors.employeeNumber?.message}
          />
          <TextField
            label="Full Name"
            fullWidth
            {...register("fullName")}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
          />
          <TextField label="NIK" fullWidth {...register("nik")} />
          <TextField label="Phone" fullWidth {...register("phone")} />
          <TextField
            label="Email"
            fullWidth
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <Controller
            control={control}
            name="employmentType"
            render={({ field }) => (
              <TextField select label="Employment Type" fullWidth {...field}>
                <MenuItem value="PERMANENT">Permanent</MenuItem>
                <MenuItem value="FREELANCE">Freelance</MenuItem>
              </TextField>
            )}
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
