import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import OperationalTasksPage from "./OperationalTasksPage";
import { operationalTaskApi } from "./api";
import { employeesApi } from "../employees/api";
import { storesApi } from "../stores/api";
import type { OperationalTask, TaskDetail, TaskSummary } from "./types";

vi.mock("./api", () => ({
  operationalTaskApi: {
    listTasks: vi.fn(),
    getSummary: vi.fn(),
    getTaskById: vi.fn(),
    createTask: vi.fn(),
    updateStatus: vi.fn(),
    addComment: vi.fn(),
  },
}));

vi.mock("../employees/api", () => ({
  employeesApi: {
    list: vi.fn(),
  },
}));

vi.mock("../stores/api", () => ({
  storesApi: {
    list: vi.fn(),
  },
}));

const mockTasks: OperationalTask[] = [
  {
    id: "tsk-001",
    taskNumber: "TSK-202611-1001",
    title: "Persiapan Display Sofa L-Shape",
    description: "Tata unit display sofa baru di area depan showroom",
    category: "SHOWROOM_DISPLAY",
    priority: "HIGH",
    status: "PENDING",
    dueDate: "2026-11-05T00:00:00Z",
    assignerId: "emp-001",
    assignerName: "Supervisor Budi",
    assigneeId: "emp-002",
    assigneeName: "Staff Siti",
    storeId: "store-001",
    commentCount: 2,
    isOverdue: false,
    createdAt: "2026-11-01T08:00:00Z",
    updatedAt: "2026-11-01T08:00:00Z",
  },
  {
    id: "tsk-002",
    taskNumber: "TSK-202611-1002",
    title: "Audit Stok Meja Makan",
    description: "Hitung fisik meja makan 6 kursi di gudang B",
    category: "STOCK_AUDIT",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    dueDate: "2026-10-30T00:00:00Z",
    assignerId: "emp-001",
    assignerName: "Supervisor Budi",
    assigneeId: "emp-003",
    assigneeName: "Staff Joko",
    storeId: "store-001",
    commentCount: 0,
    isOverdue: true,
    createdAt: "2026-10-28T08:00:00Z",
    updatedAt: "2026-10-29T08:00:00Z",
  },
];

const mockSummary: TaskSummary = {
  totalTasks: 2,
  pendingTasks: 1,
  inProgressTasks: 1,
  completedTasks: 0,
  overdueTasks: 1,
  myPendingTasks: 1,
};

const mockTaskDetail: TaskDetail = {
  ...mockTasks[0],
  comments: [
    {
      id: "comm-001",
      taskId: "tsk-001",
      authorId: "emp-001",
      authorName: "Supervisor Budi",
      message: "Tolong pastikan cushion dipasang rapi",
      createdAt: "2026-11-01T08:30:00Z",
    },
  ],
};

describe("OperationalTasksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(operationalTaskApi.listTasks).mockResolvedValue({ data: mockTasks } as any);
    vi.mocked(operationalTaskApi.getSummary).mockResolvedValue({ data: mockSummary } as any);
    vi.mocked(operationalTaskApi.getTaskById).mockResolvedValue({ data: mockTaskDetail } as any);
    vi.mocked(employeesApi.list).mockResolvedValue([
      { id: "emp-002", fullName: "Staff Siti", email: "siti@sms.id" } as any,
    ]);
    vi.mocked(storesApi.list).mockResolvedValue([
      { id: "store-001", name: "Showroom Jakarta Barat" } as any,
    ]);
  });

  it("renders page header, KPI summary cards, and tasks list", async () => {
    render(<OperationalTasksPage />);

    expect(screen.getByText("Operational Tasks")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("TSK-202611-1001")).toBeInTheDocument();
      expect(screen.getByText("Persiapan Display Sofa L-Shape")).toBeInTheDocument();
      expect(screen.getByText("Audit Stok Meja Makan")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Tasks")).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("opens create task dialog and verifies inputs", async () => {
    render(<OperationalTasksPage />);

    await waitFor(() => {
      expect(screen.getByText("Persiapan Display Sofa L-Shape")).toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", { name: /Create Task/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Select Assignee Employee/i).length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByLabelText(/Task Title/i), {
      target: { value: "Perbaikan Display Lampu" },
    });

    expect(screen.getByDisplayValue("Perbaikan Display Lampu")).toBeInTheDocument();
  });

  it("opens task detail modal, displays comments, and posts new comment", async () => {
    vi.mocked(operationalTaskApi.addComment).mockResolvedValue({
      data: {
        id: "comm-002",
        taskId: "tsk-001",
        authorId: "emp-002",
        authorName: "Staff Siti",
        message: "Siap, cushion sudah dipasang",
        createdAt: "2026-11-01T09:15:00Z",
      },
    } as any);

    render(<OperationalTasksPage />);

    await waitFor(() => {
      expect(screen.getByText("Persiapan Display Sofa L-Shape")).toBeInTheDocument();
    });

    // Click on task row
    fireEvent.click(screen.getByText("Persiapan Display Sofa L-Shape"));

    await waitFor(() => {
      expect(screen.getByText(/Task Details & Collaboration/i)).toBeInTheDocument();
      expect(screen.getByText("Tolong pastikan cushion dipasang rapi")).toBeInTheDocument();
    });

    // Type and post new comment
    const commentInput = screen.getByPlaceholderText(/Type a comment or status update.../i);
    fireEvent.change(commentInput, { target: { value: "Siap, cushion sudah dipasang" } });

    const postBtn = screen.getByRole("button", { name: /Post Comment/i });
    fireEvent.click(postBtn);

    await waitFor(() => {
      expect(operationalTaskApi.addComment).toHaveBeenCalledWith("tsk-001", {
        message: "Siap, cushion sudah dipasang",
      });
      expect(screen.getByText("Siap, cushion sudah dipasang")).toBeInTheDocument();
    });
  });

  it("allows updating task status", async () => {
    vi.mocked(operationalTaskApi.updateStatus).mockResolvedValue({
      data: {
        ...mockTaskDetail,
        status: "COMPLETED",
        completedAt: "2026-11-01T10:00:00Z",
        completionNotes: "Display selesai dan rapi",
      },
    } as any);

    render(<OperationalTasksPage />);

    await waitFor(() => {
      expect(screen.getByText("Persiapan Display Sofa L-Shape")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Persiapan Display Sofa L-Shape"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Mark Completed/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Mark Completed/i }));

    const notesInput = screen.getByPlaceholderText(/Enter completion notes.../i);
    fireEvent.change(notesInput, { target: { value: "Display selesai dan rapi" } });

    const saveBtn = screen.getByRole("button", { name: /Save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(operationalTaskApi.updateStatus).toHaveBeenCalledWith("tsk-001", {
        status: "COMPLETED",
        completionNotes: "Display selesai dan rapi",
      });
    });
  });
});
