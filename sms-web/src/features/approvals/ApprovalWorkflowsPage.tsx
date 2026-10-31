import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Slider,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  MarkerType,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { useForm } from "react-hook-form";
import {
  useAddStep,
  useCreateWorkflow,
  useWorkflowSteps,
  useWorkflows,
} from "./hooks";
import { useRoles } from "../roles/hooks";
import type { ApprovalWorkflow } from "./types";
import ApprovalStepNode, { type ApprovalStepNodeData } from "./ApprovalStepNode";
import { t } from "../../lib/locale";

interface StepFormValues {
  stepOrder: number;
  name: string;
  approverRoleCode: string;
  description?: string;
}

const nodeTypes = {
  approvalStep: ApprovalStepNode,
};

export default function ApprovalWorkflowsPage() {
  const theme = useTheme();
  const { data: workflows = [] } = useWorkflows();
  const { data: roles = [] } = useRoles();
  const createWorkflow = useCreateWorkflow();
  const addStep = useAddStep();
  const [selected, setSelected] = useState<ApprovalWorkflow | null>(null);
  const { data: steps = [] } = useWorkflowSteps(selected?.id ?? null);
  const { register, handleSubmit, reset, setValue } = useForm<StepFormValues>();

  // Simulation state
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulatedDiscountPct, setSimulatedDiscountPct] = useState(15);

  // Active step count in simulation
  const activeStepCount = useMemo(() => {
    if (!simulationOpen) return steps.length;
    // e.g. discounts > 20% require all steps, <= 10% require only 1 step
    if (simulatedDiscountPct <= 10) return Math.min(1, steps.length);
    if (simulatedDiscountPct <= 20) return Math.min(2, steps.length);
    return steps.length;
  }, [simulationOpen, simulatedDiscountPct, steps.length]);

  const { nodes, edges } = useMemo(() => {
    const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const nodes: Node<ApprovalStepNodeData>[] = sorted.map((step, index) => ({
      id: step.id,
      type: "approvalStep",
      position: { x: index * 280 + 40, y: 120 },
      data: {
        stepOrder: step.stepOrder,
        name: step.name,
        approverRoleCode: step.approverRoleCode,
        description: step.description,
        isActive: index < activeStepCount,
      },
    }));

    const edges: Edge[] = sorted.slice(1).map((step, index) => ({
      id: `${sorted[index].id}-${step.id}`,
      source: sorted[index].id,
      target: step.id,
      animated: index + 1 < activeStepCount,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color:
          index + 1 < activeStepCount
            ? theme.palette.secondary.main
            : theme.palette.primary.main,
      },
      style: {
        stroke:
          index + 1 < activeStepCount
            ? theme.palette.secondary.main
            : theme.palette.divider,
        strokeWidth: 2,
      },
    }));

    return { nodes, edges };
  }, [steps, activeStepCount, theme]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Title & Info */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t("Approval Workflows Engine")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("Visual multistep approval designer with role gating and step snapshotting")}
          </Typography>
        </Box>
        {selected && (
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={() => setSimulationOpen(true)}
          >
            {t("Simulate Workflow Chain")}
          </Button>
        )}
      </Box>

      {/* Main Workspace */}
      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" }, height: { xs: "auto", md: "72vh" } }}>
        {/* Workflows Sidebar */}
        <Paper
          variant="outlined"
          sx={{
            width: { xs: "100%", md: 280 },
            flexShrink: 0,
            maxHeight: { xs: 320, md: "none" },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 2,
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t("Workflows Directory")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Select a workflow to edit its chain")}
            </Typography>
          </Box>

          <List sx={{ flex: 1, overflow: "auto", p: 1 }}>
            {workflows.map((wf) => (
              <ListItem key={wf.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={selected?.id === wf.id}
                  onClick={() => {
                    setSelected(wf);
                    setValue("stepOrder", (steps.length ?? 0) + 1);
                  }}
                  sx={{
                    borderRadius: 1.5,
                    backgroundColor:
                      selected?.id === wf.id
                        ? theme.palette.mode === "dark"
                          ? "rgba(56, 189, 248, 0.12)"
                          : "rgba(2, 132, 199, 0.08)"
                        : "transparent",
                  }}
                >
                  <AccountTreeIcon
                    fontSize="small"
                    color={selected?.id === wf.id ? "primary" : "action"}
                    sx={{ mr: 1.5 }}
                  />
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {wf.name}
                      </Typography>
                    }
                    secondary={
                      <Chip
                        label={wf.code}
                        size="small"
                        sx={{ fontSize: "0.65rem", height: 18, mt: 0.5 }}
                      />
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />

          <Box sx={{ p: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                const code = window.prompt(
                  t("Workflow Code (e.g. PRICE_OVERRIDE_TIER2, EXPENSE_OVERRUN):"),
                );
                if (code) {
                  const name = window.prompt(t("Workflow Display Name:"));
                  if (name) createWorkflow.mutate({ code, name });
                }
              }}
            >
              {t("New Workflow")}
            </Button>
          </Box>
        </Paper>

        {/* React Flow Visual Canvas */}
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: { xs: 480, md: 0 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 2,
            position: "relative",
          }}
        >
          {selected ? (
            <>
              {/* Canvas Area */}
              <Box sx={{ flex: 1, position: "relative" }}>
                <ReactFlow
                  colorMode={theme.palette.mode}
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Background gap={18} size={1} />
                  <Controls position="bottom-left" />
                  <MiniMap
                    position="bottom-right"
                    nodeColor={() => theme.palette.primary.main}
                    style={{
                      borderRadius: 8,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Panel position="top-left">
                    <Paper
                      elevation={2}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(17, 24, 39, 0.9)"
                            : "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {t("Active Chain:")}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {selected.name} ({steps.length}{" "}
                        {t(steps.length === 1 ? "Step" : "Steps")})
                      </Typography>
                    </Paper>
                  </Panel>
                </ReactFlow>
              </Box>

              {/* Add Step Action Bar */}
              <Divider />
              <Box
                component="form"
                sx={{
                  display: "flex",
                  gap: 1.5,
                  p: 2,
                  alignItems: "center",
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(0,0,0,0.02)",
                }}
                onSubmit={handleSubmit((values) => {
                  addStep.mutate({
                    workflowId: selected.id,
                    input: {
                      stepOrder: values.stepOrder || steps.length + 1,
                      name: values.name,
                      approverRoleCode: values.approverRoleCode,
                      description: values.description,
                    },
                  });
                  reset();
                })}
              >
                <TextField
                  label={t("Order")}
                  type="number"
                  size="small"
                  sx={{ width: 90 }}
                  defaultValue={steps.length + 1}
                  {...register("stepOrder", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
                <TextField
                  label={t("Step Name (e.g. Manager Review)")}
                  size="small"
                  sx={{ flex: 1 }}
                  {...register("name", { required: true })}
                />
                <TextField
                  select
                  label={t("Approver Role")}
                  size="small"
                  sx={{ width: 220 }}
                  defaultValue=""
                  {...register("approverRoleCode", { required: true })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.code} value={role.code}>
                      {role.name} ({role.code})
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={t("Optional Guidance")}
                  size="small"
                  sx={{ flex: 1 }}
                  {...register("description")}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ minWidth: 120 }}
                >
                  {t("Add Step")}
                </Button>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 4,
              }}
            >
              <AccountTreeIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {t("Select a workflow from the left sidebar")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("You can design, reorder, and simulate approval chains visually.")}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Simulation Modal */}
      <Dialog
        open={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("Simulate Approval Workflow Execution")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t("Test how different discount thresholds activate sequential approval gates in this chain.")}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {t("Simulated Price Discount:")} {simulatedDiscountPct}%
            </Typography>
            <Slider
              value={simulatedDiscountPct}
              onChange={(_e, val) => setSimulatedDiscountPct(val as number)}
              min={0}
              max={40}
              step={5}
              marks={[
                { value: 0, label: "0%" },
                { value: 10, label: "10%" },
                { value: 20, label: "20%" },
                { value: 40, label: "40%" },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.03)",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {t("Simulation Result:")}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
              {t("Requires")} {activeStepCount} {t("of")}{steps.length}{" "}
              {t(steps.length === 1 ? "approval step" : "approval steps")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Active gates are highlighted in emerald with animated stroke flow on canvas.")}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSimulationOpen(false)} variant="contained">
            {t("Close Simulation")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
