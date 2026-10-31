import { t } from "./locale";
import type { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { exportToExcel, type ExcelColumn } from "./exportExcel";
import { exportToCsv } from "./exportCsv";

export function extractSelectedRowIds(
  model: GridRowSelectionModel | (string | number)[] | undefined,
  allRows?: { id?: string | number }[],
): (string | number)[] {
  if (!model) return [];
  if (Array.isArray(model)) return model;
  if ("type" in model && model.type === "include") {
    return Array.from(model.ids) as (string | number)[];
  }
  if ("type" in model && model.type === "exclude" && allRows) {
    return allRows
      .map((r) => r.id!)
      .filter((id) => id != null && !model.ids.has(id));
  }
  if ("ids" in model && model.ids instanceof Set) {
    return Array.from(model.ids) as (string | number)[];
  }
  return [];
}

export function getSelectedRowCount(
  model: GridRowSelectionModel | (string | number)[] | undefined,
  totalRowCount?: number,
): number {
  if (!model) return 0;
  if (Array.isArray(model)) return model.length;
  if ("type" in model && model.type === "include") {
    return model.ids.size;
  }
  if ("type" in model && model.type === "exclude" && totalRowCount !== undefined) {
    return Math.max(0, totalRowCount - model.ids.size);
  }
  if ("ids" in model && model.ids instanceof Set) {
    return model.ids.size;
  }
  return 0;
}

export interface ExportDataGridOptions<T extends object> {
  filename: string;
  title?: string;
  columns: GridColDef<T>[];
  rows: T[];
  selectedRowIds?: GridRowSelectionModel | (string | number)[];
  format: "xlsx" | "csv";
  getRowId?: (row: T) => string | number;
}

export function exportDataGrid<T extends object>({
  filename,
  title,
  columns,
  rows,
  selectedRowIds,
  format,
  getRowId = (r: any) => r.id,
}: ExportDataGridOptions<T>): void {
  // 1. Determine which rows to export
  let targetRows = rows;
  const selectedIdsArray = extractSelectedRowIds(selectedRowIds, rows as any);
  if (selectedIdsArray.length > 0) {
    const selectedSet = new Set(selectedIdsArray);
    targetRows = rows.filter((r) => selectedSet.has(getRowId(r)));
  }

  if (targetRows.length === 0) {
    alert(t("Tidak ada data untuk diekspor (No data to export)."));
    return;
  }

  // 2. Filter out action / checkbox columns
  const exportableCols = columns.filter((col) => {
    if (col.field === "actions" || col.field === "__check__") return false;
    if (!col.headerName || col.headerName.trim() === "") return false;
    return true;
  });

  // 3. Map columns to Excel / CSV formatters
  const excelColumns: ExcelColumn<T>[] = exportableCols.map((col) => ({
    key: col.field,
    label: col.headerName ?? col.field,
    width: typeof col.width === "number" ? Math.max(Math.round(col.width / 8), 12) : 20,
    format: (val: unknown, item: T) => {
      if (typeof col.valueGetter === "function") {
        try {
          return (col.valueGetter as any)(val, item, col, {});
        } catch {
          return val != null ? String(val) : "";
        }
      }
      return val != null ? (val as any) : "";
    },
  }));

  const timestamp = new Date().toISOString().substring(0, 10).replace(/-/g, "");
  const fullFilename = `${filename}_${timestamp}`;

  if (format === "xlsx") {
    exportToExcel<T>({
      filename: fullFilename,
      sheetName: title ? title.slice(0, 31) : "Data",
      title: title ?? "STORE MANAGEMENT SYSTEM EXPORT",
      columns: excelColumns,
      data: targetRows,
    });
  } else {
    // For CSV, format each row value beforehand
    const csvColumns = exportableCols.map((col) => ({
      key: col.field,
      label: col.headerName ?? col.field,
    }));

    const formattedData = targetRows.map((item) => {
      const formattedItem: Record<string, unknown> = {};
      exportableCols.forEach((col) => {
        const rawVal = (item as any)[col.field];
        if (typeof col.valueGetter === "function") {
          try {
            formattedItem[col.field] = (col.valueGetter as any)(rawVal, item, col, {});
          } catch {
            formattedItem[col.field] = rawVal ?? "";
          }
        } else {
          formattedItem[col.field] = rawVal ?? "";
        }
      });
      return formattedItem as T;
    });

    exportToCsv(fullFilename, csvColumns, formattedData);
  }
}
