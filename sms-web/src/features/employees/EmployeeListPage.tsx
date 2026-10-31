import { useState } from "react";
import { Box, Button, Chip, Switch, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useSnackbar } from "notistack";
import { useAuthStore } from "../../store/authStore";
import EmployeeAssignmentsDialog from "./EmployeeAssignmentsDialog";
import EmployeeFormDialog from "./EmployeeFormDialog";
import {
  useCreateEmployee,
  useEmployees,
  useSetEmployeeActive,
  useUpdateEmployee,
} from "./hooks";
import type { Employee } from "./types";
import { t } from "../../lib/locale";

export default function EmployeeListPage() {
  const { data, isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const setActive = useSetEmployeeActive();
  const canManage = useAuthStore((s) => s.hasPermission("EMPLOYEE_MANAGE"));
  const { enqueueSnackbar } = useSnackbar();

  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const columns: GridColDef<Employee>[] = [
    { field: "employeeNumber", headerName: t("Employee #"), width: 130 },
    { field: "fullName", headerName: t("Full Name"), flex: 1 },
    {
      field: "roleCodes",
      headerName: t("Roles"),
      flex: 1,
      renderCell: (params) =>
        params.row.roleCodes.map((code) => (
          <Chip key={code} label={code} size="small" sx={{ mr: 0.5 }} />
        )),
    },
    {
      field: "employmentStatus",
      headerName: t("Active"),
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.row.employmentStatus === "ACTIVE"}
          disabled={!canManage}
          onChange={(e) =>
            setActive.mutate({ id: params.row.id, active: e.target.checked })
          }
        />
      ),
    },
    ...(canManage
      ? [
          {
            field: "actions",
            headerName: "",
            width: 220,
            renderCell: (params: { row: Employee }) => (
              <>
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(params.row);
                    setFormOpen(true);
                  }}
                >
                  {t("Edit")}</Button>
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(params.row);
                    setAssignOpen(true);
                  }}
                >
                  {t("Assignments")}
                </Button>
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h5">{t("Employees")}</Typography>
        {canManage && (
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            {t("New Employee")}
          </Button>
        )}
      </Box>
      <DataGrid
        rows={data ?? []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        autoHeight
        disableRowSelectionOnClick
      />
      <EmployeeFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => {
          const input = {
            ...values,
            email: values.email || undefined,
            nik: values.nik || undefined,
            phone: values.phone || undefined,
          };
          const action = editing
            ? updateEmployee.mutateAsync({ id: editing.id, input })
            : createEmployee.mutateAsync(input);
          action.then(() => {
            enqueueSnackbar(editing ? t("Employee updated") : t("Employee created"), {
              variant: "success",
            });
            setFormOpen(false);
          });
        }}
      />
      <EmployeeAssignmentsDialog
        open={assignOpen}
        employee={editing}
        onClose={() => setAssignOpen(false)}
      />
    </Box>
  );
}
