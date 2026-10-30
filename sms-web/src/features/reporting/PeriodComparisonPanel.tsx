import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import DateRangeComparisonPicker, {
  computePresetDates,
  type DateRangeComparisonValues,
} from "./DateRangeComparisonPicker";
import { usePeriodComparison } from "./hooks";
import { exportToCsv } from "../../lib/exportCsv";

interface PeriodComparisonPanelProps {
  storeId?: string;
}

export default function PeriodComparisonPanel({ storeId }: PeriodComparisonPanelProps) {
  const theme = useTheme();

  // Initial date comparison state
  const [dates, setDates] = useState<DateRangeComparisonValues>(() => {
    const preset = "last_30_vs_prior_30";
    const initial = computePresetDates(preset);
    return { ...initial, preset };
  });

  const [chartMetric, setChartMetric] = useState<"sales" | "collections">("sales");

  const { data: comp, isLoading } = usePeriodComparison(
    storeId,
    dates.primaryStart,
    dates.primaryEnd,
    dates.compareStart,
    dates.compareEnd,
  );

  const handleExport = () => {
    if (!comp) return;

    // Export Daily Comparison
    exportToCsv(
      `comparative-analytics-${dates.primaryStart}-to-${dates.primaryEnd}`,
      [
        { key: "day", label: "Timeline Day" },
        { key: "primarySales", label: `Primary Sales (${comp.primary.startDate}..${comp.primary.endDate})` },
        { key: "comparisonSales", label: `Comparison Sales (${comp.comparison.startDate}..${comp.comparison.endDate})` },
        { key: "primaryCollections", label: "Primary Collections" },
        { key: "comparisonCollections", label: "Comparison Collections" },
      ],
      comp.dailyTrends,
    );
  };

  const renderDeltaChip = (pct: number, diffAmount: number) => {
    const isPositive = pct > 0;
    const isZero = pct === 0;

    let icon = <TrendingFlatIcon fontSize="small" />;
    let color: "success" | "error" | "default" = "default";

    if (isPositive) {
      icon = <TrendingUpIcon fontSize="small" />;
      color = "success";
    } else if (!isZero) {
      icon = <TrendingDownIcon fontSize="small" />;
      color = "error";
    }

    const sign = isPositive ? "+" : "";
    return (
      <Chip
        icon={icon}
        label={`${sign}${pct.toFixed(1)}% (${sign}Rp ${Math.abs(diffAmount).toLocaleString()})`}
        size="small"
        color={color}
        sx={{ fontWeight: 700, mt: 1 }}
      />
    );
  };

  return (
    <Box>
      {/* Date Range Picker */}
      <DateRangeComparisonPicker value={dates} onChange={setDates} />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      ) : !comp ? (
        <Alert severity="info">No comparative metrics found for this period range.</Alert>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Top Metric Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {/* 1. Gross Revenue */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  GROSS REVENUE
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  Rp {comp.primary.grossSales.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Prior: Rp {comp.comparison.grossSales.toLocaleString()}
                </Typography>
                {renderDeltaChip(comp.delta.salesGrowthPercentage, comp.delta.salesDifference)}
              </CardContent>
            </Card>

            {/* 2. Cash Collected */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  CASH COLLECTED
                </Typography>
                <Typography variant="h5" color="success.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  Rp {comp.primary.cashCollected.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Prior: Rp {comp.comparison.cashCollected.toLocaleString()}
                </Typography>
                {renderDeltaChip(comp.delta.collectionGrowthPercentage, comp.delta.collectionDifference)}
              </CardContent>
            </Card>

            {/* 3. Confirmed Orders */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  CONFIRMED ORDERS
                </Typography>
                <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {comp.primary.confirmedOrders} orders
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Prior: {comp.comparison.confirmedOrders} orders
                </Typography>
                {renderDeltaChip(comp.delta.ordersGrowthPercentage, comp.delta.ordersDifference)}
              </CardContent>
            </Card>

            {/* 4. Average Order Value (AOV) */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  AVG ORDER VALUE (AOV)
                </Typography>
                <Typography variant="h5" color="info.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  Rp {Math.round(comp.primary.averageOrderValue).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Prior: Rp {Math.round(comp.comparison.averageOrderValue).toLocaleString()}
                </Typography>
                <Chip
                  label={`${comp.primary.paymentsCount} payments logged`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Box>

          {/* Recharts Trajectory Overlay */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Day-by-Day Trajectory Overlay
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Comparing {comp.primary.startDate}..{comp.primary.endDate} vs{" "}
                  {comp.comparison.startDate}..{comp.comparison.endDate}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Tabs
                  value={chartMetric}
                  onChange={(_, val) => setChartMetric(val)}
                  sx={{ minHeight: 36 }}
                >
                  <Tab label="Sales Volume" value="sales" sx={{ minHeight: 36, textTransform: "none" }} />
                  <Tab label="Cash Collected" value="collections" sx={{ minHeight: 36, textTransform: "none" }} />
                </Tabs>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExport}
                >
                  Export Data
                </Button>
              </Box>
            </Box>

            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comp.dailyTrends} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.palette.divider}
                  />
                  <XAxis dataKey="day" stroke={theme.palette.text.secondary} fontSize={12} />
                  <YAxis
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`}
                  />
                  <RechartsTooltip
                    formatter={(val: any) => [
                      `Rp ${Number(val ?? 0).toLocaleString()}`,
                      "",
                    ]}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  {chartMetric === "sales" ? (
                    <>
                      <Bar
                        dataKey="primarySales"
                        name={`Primary Period (${comp.primary.startDate}..)`}
                        fill={theme.palette.primary.main}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="comparisonSales"
                        name={`Comparison (${comp.comparison.startDate}..)`}
                        fill={theme.palette.text.secondary}
                        opacity={0.4}
                        radius={[4, 4, 0, 0]}
                      />
                    </>
                  ) : (
                    <>
                      <Bar
                        dataKey="primaryCollections"
                        name={`Primary Cash (${comp.primary.startDate}..)`}
                        fill={theme.palette.secondary.main}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="comparisonCollections"
                        name={`Comparison Cash (${comp.comparison.startDate}..)`}
                        fill={theme.palette.text.secondary}
                        opacity={0.4}
                        radius={[4, 4, 0, 0]}
                      />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Collection Aging Comparison Breakdown */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Collection Debt Aging Shift Comparison
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Inspect how outstanding receivables risk shifted from the benchmark period to target period.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              {comp.primaryAging.map((bucket, idx) => {
                const compBucket = comp.comparisonAging[idx];
                const diff = bucket.totalAmount - (compBucket?.totalAmount ?? 0);
                const isRisk = bucket.bucketName.includes("Default") || bucket.bucketName.includes("Delinquent");

                return (
                  <Card key={bucket.bucketName} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {bucket.bucketName.toUpperCase()}
                      </Typography>

                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mt: 1, color: isRisk ? "error.main" : "text.primary" }}
                      >
                        Rp {bucket.totalAmount.toLocaleString()}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        Prior: Rp {(compBucket?.totalAmount ?? 0).toLocaleString()}
                      </Typography>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary">
                          {bucket.installmentCount} debts ({bucket.percentage}%)
                        </Typography>
                        <Chip
                          label={`${diff >= 0 ? "+" : ""}Rp ${Math.abs(diff).toLocaleString()}`}
                          size="small"
                          color={diff > 0 && isRisk ? "error" : diff < 0 ? "success" : "default"}
                          sx={{ fontSize: "0.65rem", height: 20, fontWeight: 700 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
