import { t } from "../../lib/locale";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useRoles } from "../roles/hooks";
import { useStores } from "../stores/hooks";
import {
  useAssignRole,
  useAssignStore,
  useEmployees,
  useSetSupervisor,
} from "./hooks";
import type { Employee } from "./types";

interface Props {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
}

export default function EmployeeAssignmentsDialog({
  open,
  employee,
  onClose,
}: Props) {
  const { data: roles } = useRoles();
  const { data: stores } = useStores();
  const { data: employees } = useEmployees();
  const assignRole = useAssignRole();
  const assignStore = useAssignStore();
  const setSupervisor = useSetSupervisor();
  const [roleToAdd, setRoleToAdd] = useState("");
  const [storeToAdd, setStoreToAdd] = useState("");

  if (!employee) return null;

  const supervisorCandidates = (employees ?? []).filter(
    (e) => e.id !== employee.id,
  );
  const currentSupervisor = supervisorCandidates.find(
    (e) => e.id === employee.supervisorEmployeeId,
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("Assignments —")} {employee.fullName}</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}
      >
        <div>
          <TextField
            select
            label={t("Add role")}
            fullWidth
            value={roleToAdd}
            onChange={(e) => {
              setRoleToAdd(e.target.value);
              assignRole.mutate({ id: employee.id, roleId: e.target.value });
            }}
          >
            {(roles ?? []).map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </TextField>
          <List dense>
            {employee.roleCodes.map((code) => (
              <ListItem key={code}>
                <ListItemText primary={code} />
              </ListItem>
            ))}
          </List>
        </div>
        <div>
          <TextField
            select
            label={t("Add store")}
            fullWidth
            value={storeToAdd}
            onChange={(e) => {
              setStoreToAdd(e.target.value);
              assignStore.mutate({ id: employee.id, storeId: e.target.value });
            }}
          >
            {(stores ?? []).map((store) => (
              <MenuItem key={store.id} value={store.id}>
                {store.name}
              </MenuItem>
            ))}
          </TextField>
          <List dense>
            {employee.storeIds.map((id) => (
              <ListItem key={id}>
                <ListItemText
                  primary={(stores ?? []).find((s) => s.id === id)?.name ?? id}
                />
              </ListItem>
            ))}
          </List>
        </div>
        <div>
          <TextField
            select
            label={t("Reporting supervisor")}
            fullWidth
            value={employee.supervisorEmployeeId ?? ""}
            onChange={(e) =>
              setSupervisor.mutate({
                id: employee.id,
                supervisorId: e.target.value,
              })
            }
          >
            {supervisorCandidates.map((candidate) => (
              <MenuItem key={candidate.id} value={candidate.id}>
                {candidate.fullName}
              </MenuItem>
            ))}
          </TextField>
          {currentSupervisor && (
            <List dense>
              <ListItem>
                <ListItemText
                  primary={currentSupervisor.fullName}
                  secondary="Current supervisor"
                />
              </ListItem>
            </List>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
