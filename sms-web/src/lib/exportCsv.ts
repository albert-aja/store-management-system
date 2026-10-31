import { t } from "./locale";
/**
 * Helper to export tabular data to a downloadable CSV file.
 * Automatically adds UTF-8 BOM so Indonesian characters and Microsoft Excel display properly.
 */
export function exportToCsv<T extends object>(
  filename: string,
  columns: { key: keyof T | string; label: string }[],
  data: T[],
) {
  if (!data || data.length === 0) {
    alert(t("No data available to export."));
    return;
  }

  const headerRow = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(",");

  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const val = (item as Record<string, unknown>)[col.key as string];
        if (val === null || val === undefined) return '""';
        if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  const csvContent = "\uFEFF" + [headerRow, ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
