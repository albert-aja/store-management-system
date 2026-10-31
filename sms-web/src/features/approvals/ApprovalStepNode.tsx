import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Box, Chip, Paper, Typography, useTheme } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { formatNumber, t } from "../../lib/locale";

export interface ApprovalStepNodeData extends Record<string, unknown> {
  stepOrder: number;
  name: string;
  approverRoleCode: string;
  description?: string | null;
  isActive?: boolean;
}

export default function ApprovalStepNode({
  data,
}: NodeProps & { data: ApprovalStepNodeData }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={data.isActive ? 4 : 2}
      sx={{
        p: 2,
        minWidth: 200,
        maxWidth: 240,
        borderRadius: 2.5,
        backgroundColor: theme.palette.background.paper,
        border: data.isActive
          ? `2px solid ${theme.palette.secondary.main}`
          : `1px solid ${theme.palette.divider}`,
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: 6,
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: theme.palette.primary.main,
          width: 10,
          height: 10,
          borderRadius: "50%",
        }}
      />

      {/* Step Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Chip
          label={t("Step #{stepOrder}", undefined, {
            stepOrder: formatNumber(data.stepOrder),
          })}
          size="small"
          color="primary"
          sx={{ fontSize: "0.7rem", height: 20, fontWeight: 700 }}
        />
        {data.isActive && (
          <CheckCircleIcon
            color="secondary"
            sx={{ fontSize: 16 }}
          />
        )}
      </Box>

      {/* Step Name */}
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}
      >
        {data.name}
      </Typography>

      {/* Approver Role Badge */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <PersonIcon fontSize="inherit" color="action" />
        <Chip
          label={data.approverRoleCode}
          size="small"
          variant="outlined"
          sx={{
            fontSize: "0.7rem",
            height: 20,
            fontWeight: 600,
            borderColor: theme.palette.primary.light,
            color: theme.palette.primary.main,
          }}
        />
      </Box>

      {data.description && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1, fontStyle: "italic" }}
        >
          {data.description}
        </Typography>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: theme.palette.secondary.main,
          width: 10,
          height: 10,
          borderRadius: "50%",
        }}
      />
    </Paper>
  );
}
