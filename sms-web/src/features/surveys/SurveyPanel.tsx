import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useAuthStore } from "../../store/authStore";
import { useEmployees } from "../employees/hooks";
import {
  useAssignSurveyor,
  useCreateSurvey,
  useDecideSurvey,
  useSurvey,
  useUpdateAssessment,
} from "./hooks";
import type { AssessmentInput } from "./types";
import { t , localizeDisplayCode} from "../../lib/locale";

interface Props {
  salesOrderId: string;
}

export default function SurveyPanel({ salesOrderId }: Props) {
  const { data: survey, isError } = useSurvey(salesOrderId);
  const { data: employees } = useEmployees();
  const canManage = useAuthStore((s) => s.hasPermission("SURVEY_MANAGE"));
  const canDecide = useAuthStore((s) => s.hasPermission("SURVEY_DECIDE"));
  const { enqueueSnackbar } = useSnackbar();

  const createSurvey = useCreateSurvey(salesOrderId);
  const assignSurveyor = useAssignSurveyor(salesOrderId);
  const updateAssessment = useUpdateAssessment(salesOrderId);
  const decideSurvey = useDecideSurvey(salesOrderId);

  const [assessment, setAssessment] = useState<AssessmentInput>({});

  if (isError && !survey) {
    return canManage ? (
      <Button
        onClick={() =>
          createSurvey.mutate(undefined, {
            onError: () =>
              enqueueSnackbar(
                t("Could not start survey (SO must be Released and credit-based)"),
                { variant: "error" },
              ),
          })
        }
      >
        {t("Start Survey")}
      </Button>
    ) : (
      <Typography color="text.secondary">{t("No survey yet")}</Typography>
    );
  }

  if (!survey) return null;

  const surveyors = (employees ?? []).filter((e) =>
    e.roleCodes.includes("SURVEYOR"),
  );
  const isPending = survey.status === "PENDING";

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="subtitle1">{t("Survey")}</Typography>
        <Chip
          label={localizeDisplayCode(survey.status)}
          size="small"
          color={
            survey.status === "APPROVED"
              ? "success"
              : survey.status === "REJECTED"
                ? "error"
                : "default"
          }
        />
      </Box>
      {isPending && canManage && (
        <TextField
          select
          label={t("Surveyor")}
          size="small"
          fullWidth
          sx={{ mb: 1 }}
          value={survey.surveyorEmployeeId ?? ""}
          onChange={(e) => assignSurveyor.mutate(e.target.value)}
        >
          {surveyors.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.fullName}
            </MenuItem>
          ))}
        </TextField>
      )}
      {isPending && canManage && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1 }}>
          <TextField
            label={t("Monthly income")}
            size="small"
            type="number"
            defaultValue={survey.monthlyIncome ?? ""}
            onChange={(e) =>
              setAssessment((a) => ({
                ...a,
                monthlyIncome: Number(e.target.value),
              }))
            }
          />
          <TextField
            label={t("Ability to pay assessment")}
            size="small"
            multiline
            rows={2}
            defaultValue={survey.abilityToPayAssessment ?? ""}
            onChange={(e) =>
              setAssessment((a) => ({
                ...a,
                abilityToPayAssessment: e.target.value,
              }))
            }
          />
          <Button
            size="small"
            onClick={() => updateAssessment.mutate(assessment)}
          >
            {t("Save Assessment")}
          </Button>
        </Box>
      )}
      {isPending && canDecide && survey.surveyorEmployeeId && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            color="success"
            onClick={() => decideSurvey.mutate({ approve: true })}
          >
            {t("Approve")}
          </Button>
          <Button
            color="error"
            onClick={() =>
              decideSurvey.mutate({
                approve: false,
                notes: window.prompt(t("Rejection reason?")) ?? undefined,
              })
            }
          >
            {t("Reject")}
          </Button>
        </Box>
      )}
      {survey.decisionNotes && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {survey.decisionNotes}
        </Typography>
      )}
    </Box>
  );
}
