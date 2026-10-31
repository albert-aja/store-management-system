import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OverviewCharts from "./OverviewCharts";

describe("overview chart states", () => {
  it("shows a loading surface without inventing chart data", () => {
    render(<OverviewCharts loading />);
    expect(screen.getByLabelText("Loading overview charts")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("reports failed data explicitly", () => {
    render(<OverviewCharts failed />);
    expect(screen.getByRole("alert")).toHaveTextContent("Overview charts could not load");
  });

  it("does not treat unavailable metrics as zero", () => {
    render(<OverviewCharts />);
    expect(screen.getByRole("alert")).toHaveTextContent("reporting data is available");
    expect(screen.queryByText("No stock units recorded.")).not.toBeInTheDocument();
  });
});
