import { render, screen } from "@testing-library/react";
import { Button, Card, CssBaseline, TextField, ThemeProvider } from "@mui/material";
import { describe, expect, it } from "vitest";
import { getAppTheme } from "./theme";

describe("management design", () => {
  it.each(["light", "dark"] as const)("keeps readable %s surfaces, calm typography, and dense tables", (mode) => {
    const theme = getAppTheme(mode);
    expect(theme.palette.mode).toBe(mode);
    expect(theme.palette.background.default).not.toBe(theme.palette.background.paper);
    expect(theme.typography.h5.fontWeight).toBe(600);
    expect(theme.components?.MuiDataGrid?.defaultProps?.rowHeight).toBe(56);
    expect(theme.components?.MuiTabs?.defaultProps?.variant).toBe("scrollable");
  });

  it("uses Indonesian or English Material and Data Grid locale packs", () => {
    const idTheme = getAppTheme("light", "id");
    const enTheme = getAppTheme("light", "en");
    expect(idTheme.components?.MuiTablePagination?.defaultProps?.labelRowsPerPage).toBe("Baris per halaman:");
    expect(enTheme.components?.MuiTablePagination?.defaultProps?.labelRowsPerPage).toBeUndefined();
    expect(idTheme.components?.MuiDataGrid?.defaultProps?.localeText?.noRowsLabel).toBe("Tidak ad abaris");
    expect(enTheme.components?.MuiDataGrid?.defaultProps?.localeText?.noRowsLabel).toBe("No rows");
  });

  it("renders modern cards and controls through shared theme", () => {
    render(<ThemeProvider theme={getAppTheme("light")}><CssBaseline />
      <Card data-testid="card"><Button variant="contained">Save</Button><TextField label="Name" /></Card>
    </ThemeProvider>);
    expect(screen.getByTestId("card")).toHaveStyle({ borderRadius: "16px", boxShadow: "none" });
    expect(screen.getByRole("button", { name: "Save" })).toHaveStyle({ minHeight: "40px", borderRadius: "10px" });
    expect(screen.getByRole("textbox", { name: "Name" }).closest(".MuiOutlinedInput-root")).toHaveStyle({ borderRadius: "10px" });
  });
});
