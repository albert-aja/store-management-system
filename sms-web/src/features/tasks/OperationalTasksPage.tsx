import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CancelIcon from "@mui/icons-material/Cancel";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";

import { useT } from "../../lib/locale";
import { operationalTaskApi } from "./api";
import { employeesApi } from "../employees/api";
import { storesApi } from "../stores/api";
import type {
  OperationalTask,
  TaskDetail,
  TaskSummary,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  CreateTaskRequest,
} from "./types";
import type { Employee } from "../employees/types";
import type { Store } from "../stores/types";

export default function OperationalTasksPage() {
  const t = useT();

  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters
  const [storeFilter, setStoreFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Create Task Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCategory, setCreateCategory] = useState<TaskCategory>("GENERAL");
  const [createPriority, setCreatePriority] = useState<TaskPriority>("MEDIUM");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createAssigneeId, setCreateAssigneeId] = useState("");
  const [createStoreId, setCreateStoreId] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Detail Modal & Comments
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Status Change Dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>("COMPLETED");
  const [completionNotes, setCompletionNotes] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, summaryRes] = await Promise.all([
        operationalTaskApi.listTasks({
          storeId: storeFilter || undefined,
          status: (statusFilter as TaskStatus) || undefined,
          priority: (priorityFilter as TaskPriority) || undefined,
          category: (categoryFilter as TaskCategory) || undefined,
          search: search || undefined,
        }),
        operationalTaskApi.getSummary(storeFilter || undefined),
      ]);
      setTasks(tasksRes.data);
      setSummary(summaryRes.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load operational tasks");
    } finally {
      setLoading(false);
    }
  }, [storeFilter, statusFilter, priorityFilter, categoryFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    employeesApi.list().then(setEmployees).catch(() => {});
    storesApi.list().then(setStores).catch(() => {});
  }, []);

  const handleOpenDetail = async (task: OperationalTask) => {
    setLoadingDetail(true);
    setDetailModalOpen(true);
    try {
      const res = await operationalTaskApi.getTaskById(task.id);
      setSelectedTask(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load task details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createAssigneeId) return;

    setSubmittingCreate(true);
    try {
      const payload: CreateTaskRequest = {
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        category: createCategory,
        priority: createPriority,
        dueDate: createDueDate ? new Date(createDueDate).toISOString() : undefined,
        assigneeId: createAssigneeId,
        storeId: createStoreId || undefined,
      };
      await operationalTaskApi.createTask(payload);
      setCreateDialogOpen(false);
      setCreateTitle("");
      setCreateDescription("");
      setCreateDueDate("");
      setCreateAssigneeId("");
      setCreateStoreId("");
      setSuccessBanner(t("Create Task") + ": " + t("Completed"));
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await operationalTaskApi.addComment(selectedTask.id, {
        message: commentText.trim(),
      });
      setSelectedTask({
        ...selectedTask,
        comments: [...selectedTask.comments, res.data],
        commentCount: selectedTask.commentCount + 1,
      });
      setCommentText("");
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleOpenStatusDialog = (status: TaskStatus) => {
    setTargetStatus(status);
    setCompletionNotes("");
    setStatusDialogOpen(true);
  };

  const handleUpdateStatusConfirm = async () => {
    if (!selectedTask) return;
    setSubmittingStatus(true);
    try {
      const res = await operationalTaskApi.updateStatus(selectedTask.id, {
        status: targetStatus,
        completionNotes: completionNotes.trim() || undefined,
      });
      setSelectedTask({
        ...selectedTask,
        status: res.data.status,
        completedAt: res.data.completedAt,
        completionNotes: res.data.completionNotes,
      });
      setStatusDialogOpen(false);
      setSuccessBanner(t("Status") + ": " + t(targetStatus === "COMPLETED" ? "Completed" : targetStatus === "IN_PROGRESS" ? "In Progress" : "Cancel Task"));
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getPriorityColor = (p: TaskPriority): "error" | "warning" | "info" | "default" => {
    switch (p) {
      case "URGENT":
        return "error";
      case "HIGH":
        return "error";
      case "MEDIUM":
        return "warning";
      case "LOW":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusColor = (s: TaskStatus): "success" | "primary" | "warning" | "default" => {
    switch (s) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "primary";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "default";
      default:
        return "default";
    }
  };

  const formatCategory = (cat: TaskCategory): string => {
    switch (cat) {
      case "SHOWROOM_DISPLAY":
        return t("Showroom Display");
      case "STOCK_AUDIT":
        return t("Stock Audit");
      case "CUSTOMER_SERVICE":
        return t("Customer Service");
      case "DOCUMENTATION":
        return t("Documentation");
      case "MAINTENANCE":
        return t("Maintenance");
      default:
        return t("General");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon color="primary" fontSize="large" />
            {t("Operational Tasks")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("Employee-to-employee task assignment, due-date tracking & collaboration hub.")}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <IconButton onClick={loadData} aria-label={t("Actions")}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {t("Create Task")}
          </Button>
        </Box>
      </Box>

      {/* Banners */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successBanner && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessBanner(null)}>
          {successBanner}
        </Alert>
      )}

      {/* KPI Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card variant="outlined">
              <CardContent sx={{ pb: "16px !important" }}>
                <Typography variant="caption" color="text.secondary">
                  {t("Total Tasks")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {summary.totalTasks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card variant="outlined" sx={{ borderLeft: "4px solid #ed6c02" }}>
              <CardContent sx={{ pb: "16px !important" }}>
                <Typography variant="caption" color="text.secondary">
                  {t("Pending")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#ed6c02" }}>
                  {summary.pendingTasks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card variant="outlined" sx={{ borderLeft: "4px solid #0288d1" }}>
              <CardContent sx={{ pb: "16px !important" }}>
                <Typography variant="caption" color="text.secondary">
                  {t("In Progress")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#0288d1" }}>
                  {summary.inProgressTasks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card variant="outlined" sx={{ borderLeft: "4px solid #2e7d32" }}>
              <CardContent sx={{ pb: "16px !important" }}>
                <Typography variant="caption" color="text.secondary">
                  {t("Completed")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2e7d32" }}>
                  {summary.completedTasks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card variant="outlined" sx={{ borderLeft: "4px solid #d32f2f" }}>
              <CardContent sx={{ pb: "16px !important" }}>
                <Typography variant="caption" color="text.secondary">
                  {t("Overdue")}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#d32f2f" }}>
                  {summary.overdueTasks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={t("Search task number or title...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t("Category")}</InputLabel>
              <Select
                value={categoryFilter}
                label={t("Category")}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">{t("All Categories")}</MenuItem>
                <MenuItem value="SHOWROOM_DISPLAY">{t("Showroom Display")}</MenuItem>
                <MenuItem value="STOCK_AUDIT">{t("Stock Audit")}</MenuItem>
                <MenuItem value="CUSTOMER_SERVICE">{t("Customer Service")}</MenuItem>
                <MenuItem value="DOCUMENTATION">{t("Documentation")}</MenuItem>
                <MenuItem value="MAINTENANCE">{t("Maintenance")}</MenuItem>
                <MenuItem value="GENERAL">{t("General")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t("Status")}</InputLabel>
              <Select
                value={statusFilter}
                label={t("Status")}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">{t("All Statuses")}</MenuItem>
                <MenuItem value="PENDING">{t("Pending")}</MenuItem>
                <MenuItem value="IN_PROGRESS">{t("In Progress")}</MenuItem>
                <MenuItem value="COMPLETED">{t("Completed")}</MenuItem>
                <MenuItem value="CANCELLED">{t("Cancel Task")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t("Priority")}</InputLabel>
              <Select
                value={priorityFilter}
                label={t("Priority")}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="">{t("All Priorities")}</MenuItem>
                <MenuItem value="URGENT">{t("Urgent")}</MenuItem>
                <MenuItem value="HIGH">{t("High")}</MenuItem>
                <MenuItem value="MEDIUM">{t("Medium")}</MenuItem>
                <MenuItem value="LOW">{t("Low")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>{t("Select Store")}</InputLabel>
              <Select
                value={storeFilter}
                label={t("Select Store")}
                onChange={(e) => setStoreFilter(e.target.value)}
              >
                <MenuItem value="">{t("All Stores")}</MenuItem>
                {stores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tasks Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : tasks.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">{t("No operational tasks found")}</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("Task Number")}</TableCell>
                <TableCell>{t("Task Title")}</TableCell>
                <TableCell>{t("Category")}</TableCell>
                <TableCell>{t("Priority")}</TableCell>
                <TableCell>{t("Status")}</TableCell>
                <TableCell>{t("Assignee")}</TableCell>
                <TableCell>{t("Due Date")}</TableCell>
                <TableCell align="center">{t("Comments")}</TableCell>
                <TableCell align="right">{t("Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleOpenDetail(task)}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                    {task.taskNumber}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260, display: "block" }}>
                        {task.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={formatCategory(task.category)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(task.priority === "URGENT" ? "Urgent" : task.priority === "HIGH" ? "High" : task.priority === "MEDIUM" ? "Medium" : "Low")}
                      size="small"
                      color={getPriorityColor(task.priority)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(task.status === "COMPLETED" ? "Completed" : task.status === "IN_PROGRESS" ? "In Progress" : task.status === "PENDING" ? "Pending" : "Cancel Task")}
                      size="small"
                      color={getStatusColor(task.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{task.assigneeName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("Assigner")}: {task.assignerName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {task.isOverdue && <WarningAmberIcon color="error" fontSize="small" />}
                        <Typography
                          variant="body2"
                          sx={{
                            color: task.isOverdue ? "error.main" : "text.primary",
                            fontWeight: task.isOverdue ? "bold" : "normal",
                          }}
                        >
                          {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<ChatIcon fontSize="small" />}
                      label={task.commentCount}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); handleOpenDetail(task); }}>
                      {t("Actions")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateTask}>
          <DialogTitle>{t("Create Task")}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
            <TextField
              required
              fullWidth
              label={t("Task Title")}
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label={t("Documentation")}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>{t("Category")}</InputLabel>
                  <Select
                    value={createCategory}
                    label={t("Category")}
                    onChange={(e) => setCreateCategory(e.target.value as TaskCategory)}
                  >
                    <MenuItem value="SHOWROOM_DISPLAY">{t("Showroom Display")}</MenuItem>
                    <MenuItem value="STOCK_AUDIT">{t("Stock Audit")}</MenuItem>
                    <MenuItem value="CUSTOMER_SERVICE">{t("Customer Service")}</MenuItem>
                    <MenuItem value="DOCUMENTATION">{t("Documentation")}</MenuItem>
                    <MenuItem value="MAINTENANCE">{t("Maintenance")}</MenuItem>
                    <MenuItem value="GENERAL">{t("General")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>{t("Priority")}</InputLabel>
                  <Select
                    value={createPriority}
                    label={t("Priority")}
                    onChange={(e) => setCreatePriority(e.target.value as TaskPriority)}
                  >
                    <MenuItem value="URGENT">{t("Urgent")}</MenuItem>
                    <MenuItem value="HIGH">{t("High")}</MenuItem>
                    <MenuItem value="MEDIUM">{t("Medium")}</MenuItem>
                    <MenuItem value="LOW">{t("Low")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>{t("Select Assignee Employee")}</InputLabel>
                  <Select
                    value={createAssigneeId}
                    label={t("Select Assignee Employee")}
                    onChange={(e) => setCreateAssigneeId(e.target.value)}
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t("Select Store")}</InputLabel>
                  <Select
                    value={createStoreId}
                    label={t("Select Store")}
                    onChange={(e) => setCreateStoreId(e.target.value)}
                  >
                    <MenuItem value="">{t("All Stores")}</MenuItem>
                    {stores.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              type="date"
              fullWidth
              label={t("Due Date")}
              slotProps={{ inputLabel: { shrink: true } }}
              value={createDueDate}
              onChange={(e) => setCreateDueDate(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateDialogOpen(false)}>{t("Cancel")}</Button>
            <Button type="submit" variant="contained" disabled={submittingCreate}>
              {submittingCreate ? <CircularProgress size={20} /> : t("Create Task")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Task Detail & Collaboration Drawer/Dialog */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {selectedTask?.taskNumber}: {selectedTask?.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Task Details & Collaboration")}
            </Typography>
          </Box>
          {selectedTask && (
            <Chip
              label={t(selectedTask.status === "COMPLETED" ? "Completed" : selectedTask.status === "IN_PROGRESS" ? "In Progress" : selectedTask.status === "PENDING" ? "Pending" : "Cancel Task")}
              color={getStatusColor(selectedTask.status)}
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetail || !selectedTask ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {/* Task Metadata */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">{t("Category")}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCategory(selectedTask.category)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">{t("Priority")}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t(selectedTask.priority === "URGENT" ? "Urgent" : selectedTask.priority === "HIGH" ? "High" : selectedTask.priority === "MEDIUM" ? "Medium" : "Low")}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">{t("Due Date")}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: selectedTask.isOverdue ? "error.main" : "text.primary" }}>
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "-"}
                    {selectedTask.isOverdue ? ` (${t("Overdue")})` : ""}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">{t("Assignee")}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTask.assigneeName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">{t("Assigner")}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTask.assignerName}</Typography>
                </Grid>
              </Grid>

              {/* Description */}
              {selectedTask.description && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fafafa" }}>
                  <Typography variant="caption" color="text.secondary">{t("Documentation")}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                    {selectedTask.description}
                  </Typography>
                </Paper>
              )}

              {/* Completion Notes */}
              {selectedTask.completionNotes && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f1f8e9", borderLeft: "4px solid #2e7d32" }}>
                  <Typography variant="caption" color="text.secondary">{t("Completion Notes")}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: "#2e7d32", fontWeight: 500 }}>
                    {selectedTask.completionNotes}
                  </Typography>
                </Paper>
              )}

              {/* Status Action Buttons */}
              <Box sx={{ display: "flex", gap: 1, py: 1 }}>
                {selectedTask.status === "PENDING" && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleOpenStatusDialog("IN_PROGRESS")}
                  >
                    {t("Start Task")}
                  </Button>
                )}
                {(selectedTask.status === "PENDING" || selectedTask.status === "IN_PROGRESS") && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleOpenStatusDialog("COMPLETED")}
                  >
                    {t("Mark Completed")}
                  </Button>
                )}
                {selectedTask.status !== "CANCELLED" && selectedTask.status !== "COMPLETED" && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleOpenStatusDialog("CANCELLED")}
                  >
                    {t("Cancel Task")}
                  </Button>
                )}
              </Box>

              <Divider />

              {/* Collaboration & Comments Feed */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <ChatIcon fontSize="small" color="primary" />
                  {t("Collaboration & Discussion")} ({selectedTask.comments?.length || 0})
                </Typography>

                <Box sx={{ maxHeight: 260, overflowY: "auto", mb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                      {t("No operational tasks found")}
                    </Typography>
                  ) : (
                    selectedTask.comments.map((c) => (
                      <Paper key={c.id} variant="outlined" sx={{ p: 1.5, bgcolor: "#fbfbfb" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                            {c.authorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{c.message}</Typography>
                        {c.attachmentUrl && (
                          <Typography variant="caption" color="primary" sx={{ display: "block", mt: 0.5 }}>
                            {c.attachmentUrl}
                          </Typography>
                        )}
                      </Paper>
                    ))
                  )}
                </Box>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={t("Type a comment or status update...")}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      endIcon={<SendIcon />}
                      disabled={submittingComment || !commentText.trim()}
                    >
                      {t("Post Comment")}
                    </Button>
                  </Box>
                </form>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailModalOpen(false)}>{t("Close")}</Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {targetStatus === "COMPLETED" ? t("Mark Completed") : targetStatus === "IN_PROGRESS" ? t("Start Task") : t("Cancel Task")}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t("Completion Notes")}
            placeholder={t("Enter completion notes...")}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStatusDialogOpen(false)}>{t("Cancel")}</Button>
          <Button
            variant="contained"
            color={targetStatus === "COMPLETED" ? "success" : targetStatus === "IN_PROGRESS" ? "primary" : "error"}
            onClick={handleUpdateStatusConfirm}
            disabled={submittingStatus}
          >
            {submittingStatus ? <CircularProgress size={20} /> : t("Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
