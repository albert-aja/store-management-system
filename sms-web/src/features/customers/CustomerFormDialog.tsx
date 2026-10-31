import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { Customer, DuplicateCheckInput, DuplicateMatchResultItem } from "./types";
import { formatNumber, t } from "../../lib/locale";

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  nik: z.string().optional(),
  primaryPhone: z.string().optional(),
  primaryEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  motherMaidenName: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  initial?: Customer | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
  onCheckDuplicate?: (input: DuplicateCheckInput) => Promise<DuplicateMatchResultItem[]>;
}

export default function CustomerFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
  onCheckDuplicate,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: initial?.fullName ?? "",
      nik: initial?.nik ?? "",
      primaryPhone: initial?.primaryPhone ?? "",
      primaryEmail: initial?.primaryEmail ?? "",
      motherMaidenName: initial?.motherMaidenName ?? "",
      birthDate: initial?.birthDate ?? "",
      birthPlace: initial?.birthPlace ?? "",
    },
  });

  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatchResultItem[]>([]);
  const [checked, setChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const watchFullName = watch("fullName");
  const watchPhone = watch("primaryPhone");
  const watchNik = watch("nik");
  const watchMother = watch("motherMaidenName");

  const handleRunDuplicateCheck = async () => {
    if (!onCheckDuplicate) return;
    if (!watchFullName && !watchPhone && !watchNik) return;
    setIsChecking(true);
    try {
      const results = await onCheckDuplicate({
        currentCustomerId: initial?.id,
        fullName: watchFullName,
        phone: watchPhone,
        nik: watchNik,
        motherMaidenName: watchMother,
      });
      setDuplicateMatches(results ?? []);
      setChecked(true);
    } catch {
      // ignore
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{initial ? t("Edit Customer") : t("New Customer")}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label={t("Full Name")}
            fullWidth
            {...register("fullName")}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
          />
          <TextField label={t("NIK")} fullWidth {...register("nik")} />
          <TextField
            label={t("Primary Phone")}
            fullWidth
            {...register("primaryPhone")}
          />
          <TextField
            label={t("Primary Email")}
            fullWidth
            {...register("primaryEmail")}
            error={!!errors.primaryEmail}
            helperText={errors.primaryEmail?.message}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={t("Mother's Maiden Name")}
              fullWidth
              size="small"
              {...register("motherMaidenName")}
              helperText={t("Verifikasi duplikasi & PDP (J.4)")}
            />
            <TextField
              label={t("Birth Place")}
              fullWidth
              size="small"
              {...register("birthPlace")}
            />
          </Box>
          <TextField
            label={t("Date of Birth")}
            type="date"
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            {...register("birthDate")}
          />

          {/* J.4 Fuzzy Duplicate Detector Widget */}
          {onCheckDuplicate && (
            <Box sx={{ border: "1px dashed #94a3b8", borderRadius: 1.5, p: 1.5, bgcolor: "#f8fafc" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>
                  {t("Pemeriksaan Duplikasi Otomatis (J.4)")}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={handleRunDuplicateCheck}
                  disabled={isChecking}
                >
                  {isChecking ? t("Memeriksa...") : t("Cek Duplikasi")}
                </Button>
              </Box>

              <Collapse in={checked}>
                {duplicateMatches.length === 0 ? (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    {t("Tidak ditemukan pelanggan ganda. Data aman untuk disimpan.")}
                  </Alert>
                ) : (
                  <Alert
                    severity="warning"
                    icon={<WarningAmberIcon />}
                    sx={{ mt: 1 }}
                  >
                    <AlertTitle sx={{ fontWeight: 700 }}>
                      {t("Perhatian: Ditemukan")} {duplicateMatches.length} {t("Data Mirip!")}
                    </AlertTitle>
                    {duplicateMatches.map((m) => (
                      <Box key={m.matchedCustomerId} sx={{ mt: 1, p: 1, bgcolor: "rgba(255,255,255,0.7)", borderRadius: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {m.matchedCustomerName}
                          </Typography>
                          <Chip
                            label={t("{percent}% Match", undefined, {
                              percent: formatNumber(m.matchScorePercent),
                            })}
                            color={m.matchScorePercent >= 80 ? "error" : "warning"}
                            size="small"
                          />
                        </Box>
                        <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                          {t("NIK:")} {m.matchedNik ?? "—"} {t("• Telp:")} {m.matchedPhone ?? "—"}
                        </Typography>
                        <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {m.matchReasons.map((r, idx) => (
                            <Chip key={idx} label={r} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Alert>
                )}
              </Collapse>
            </Box>
          )}
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
