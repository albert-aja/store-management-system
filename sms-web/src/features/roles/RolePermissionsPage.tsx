import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useAuthStore } from "../../store/authStore";
import RoleFormDialog from "./RoleFormDialog";
import {
  useCreateRole,
  usePermissions,
  useRolePermissions,
  useRoles,
  useTogglePermission,
} from "./hooks";
import type { Role } from "./types";
import { t } from "../../lib/locale";

export default function RolePermissionsPage() {
  const { data: roles } = useRoles();
  const { data: permissions } = usePermissions();
  const [selected, setSelected] = useState<Role | null>(null);
  const { data: assigned } = useRolePermissions(selected?.id ?? null);
  const togglePermission = useTogglePermission();
  const createRole = useCreateRole();
  const canManage = useAuthStore((s) => s.hasPermission("ROLE_MANAGE"));
  const { enqueueSnackbar } = useSnackbar();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
      <Paper variant="outlined" sx={{ width: { xs: "100%", md: 260 }, p: 1, borderRadius: 2, flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ p: 1 }}>
          {t("Roles")}</Typography>
        <List>
          {(roles ?? []).map((role) => (
            <ListItem key={role.id} disablePadding>
              <ListItemButton
                selected={selected?.id === role.id}
                onClick={() => setSelected(role)}
              >
                <ListItemText primary={role.name} secondary={role.code} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {canManage && (
          <Button fullWidth onClick={() => setFormOpen(true)}>
            {t("New Role")}
          </Button>
        )}
      </Paper>
      <Paper variant="outlined" sx={{ flex: 1, p: 3, borderRadius: 2, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {selected
            ? t("Permissions for {role}", undefined, { role: selected.name })
            : t("Select a role")}
        </Typography>
        {selected &&
          (permissions ?? []).map((permission) => {
            const isAssigned = (assigned ?? []).some(
              (p) => p.id === permission.id,
            );
            return (
              <FormControlLabel
                key={permission.id}
                control={
                  <Checkbox
                    checked={isAssigned}
                    onChange={(e) =>
                      togglePermission.mutate({
                        roleId: selected.id,
                        permissionId: permission.id,
                        assign: e.target.checked,
                      })
                    }
                  />
                }
                label={permission.code}
                sx={{ display: "block", overflowWrap: "anywhere" }}
              />
            );
          })}
      </Paper>
      <RoleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => {
          createRole.mutateAsync(values).then(() => {
            enqueueSnackbar(t("Role created"), { variant: "success" });
            setFormOpen(false);
          });
        }}
      />
    </Box>
  );
}
