import { useMemo, useState } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useForm } from "react-hook-form";
import {
  useAddStep,
  useCreateWorkflow,
  useWorkflowSteps,
  useWorkflows,
} from "./hooks";
import { useRoles } from "../roles/hooks";
import type { ApprovalWorkflow } from "./types";

interface StepFormValues {
  stepOrder: number;
  name: string;
  approverRoleCode: string;
}

export default function ApprovalWorkflowsPage() {
  const { data: workflows } = useWorkflows();
  const { data: roles } = useRoles();
  const createWorkflow = useCreateWorkflow();
  const addStep = useAddStep();
  const [selected, setSelected] = useState<ApprovalWorkflow | null>(null);
  const { data: steps } = useWorkflowSteps(selected?.id ?? null);
  const { register, handleSubmit, reset } = useForm<StepFormValues>();

  const { nodes, edges } = useMemo(() => {
    const sorted = [...(steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);
    const nodes: Node[] = sorted.map((step, index) => ({
      id: step.id,
      position: { x: index * 220, y: 0 },
      data: {
        label: `${step.stepOrder}. ${step.name}\n(${step.approverRoleCode})`,
      },
      style: { whiteSpace: "pre-line", width: 180 },
    }));
    const edges: Edge[] = sorted.slice(1).map((step, index) => ({
      id: `${sorted[index].id}-${step.id}`,
      source: sorted[index].id,
      target: step.id,
    }));
    return { nodes, edges };
  }, [steps]);

  return (
    <Box sx={{ display: "flex", gap: 3, height: "70vh" }}>
      <Paper sx={{ width: 280, p: 1, overflow: "auto" }}>
        <Typography variant="subtitle1" sx={{ p: 1 }}>
          Approval Workflows
        </Typography>
        <List>
          {(workflows ?? []).map((workflow) => (
            <ListItem key={workflow.id} disablePadding>
              <ListItemButton
                selected={selected?.id === workflow.id}
                onClick={() => setSelected(workflow)}
              >
                <ListItemText
                  primary={workflow.name}
                  secondary={workflow.code}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Button
          fullWidth
          onClick={() => {
            const code = window.prompt(
              "Workflow code (e.g. PRICE_NEGOTIATION)",
            );
            const name = code && window.prompt("Workflow name");
            if (code && name) createWorkflow.mutate({ code, name });
          }}
        >
          New Workflow
        </Button>
      </Paper>
      <Paper sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {selected ? (
          <>
            <Box sx={{ flex: 1 }}>
              <ReactFlow nodes={nodes} edges={edges} fitView />
            </Box>
            <Box
              component="form"
              sx={{ display: "flex", gap: 1, p: 2 }}
              onSubmit={handleSubmit((values) => {
                addStep.mutate({ workflowId: selected.id, input: values });
                reset();
              })}
            >
              <TextField
                label="Order"
                type="number"
                size="small"
                sx={{ width: 100 }}
                {...register("stepOrder", {
                  valueAsNumber: true,
                  required: true,
                })}
              />
              <TextField
                label="Step name"
                size="small"
                fullWidth
                {...register("name", { required: true })}
              />
              <TextField
                select
                label="Approver role"
                size="small"
                sx={{ width: 200 }}
                {...register("approverRoleCode", { required: true })}
              >
                {(roles ?? []).map((role) => (
                  <MenuItem key={role.code} value={role.code}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button type="submit" variant="contained">
                Add Step
              </Button>
            </Box>
          </>
        ) : (
          <Typography sx={{ p: 2 }}>
            Select a workflow to view/edit its steps.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
