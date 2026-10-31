import { Alert, Box, Card, CardContent, Skeleton, Typography, useTheme } from "@mui/material";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ExecutiveOverview, InventoryDistribution } from "./types";
import { formatNumber , t} from "../../lib/locale";

interface OverviewChartsProps {
  overview?: ExecutiveOverview;
  inventory?: InventoryDistribution;
  loading?: boolean;
  failed?: boolean;
}

export default function OverviewCharts({ overview, inventory, loading, failed }: OverviewChartsProps) {
  const theme = useTheme();
  if (failed) return <Alert severity="error">{t("Overview charts could not load. Please refresh or select another store.")}</Alert>;
  if (loading) return <Skeleton variant="rounded" height={320} aria-label={t("Loading overview charts")} />;
  if (!overview || !inventory) return <Alert severity="info">{t("Overview charts appear when reporting data is available.")}</Alert>;

  const financial = [
    { name: t("Sales"), value: Number(overview.totalSalesAmount), color: theme.palette.primary.main },
    { name: t("Collected"), value: Number(overview.totalCashCollected), color: theme.palette.success.main },
    { name: t("Receivables"), value: Number(overview.totalOutstandingReceivables), color: theme.palette.warning.main },
    { name: t("Expenses"), value: Number(overview.totalExpensesAmount), color: theme.palette.error.main },
  ];
  const distribution = [
    { name: t("Warehouse"), value: inventory.warehouseUnits, color: theme.palette.primary.main },
    { name: t("Showroom"), value: inventory.showroomUnits, color: theme.palette.secondary.main },
    { name: t("Repair"), value: inventory.repairAreaUnits, color: theme.palette.warning.main },
    { name: t("In transit"), value: inventory.inTransitUnits, color: "#8b5cf6" },
    { name: t("At customer"), value: inventory.atCustomerUnits, color: theme.palette.text.secondary },
  ];
  const tooltipStyle = { backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider, borderRadius: 12 };
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.4fr) minmax(0, 1fr)" }, gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6">{t("Financial overview")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t("Sales, collections, and outstanding balances")}</Typography>
          <Box role="img" aria-label={t("Financial overview bar chart; exact figures in financial summary below")} sx={{ height: 250, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 500, height: 250 }}>
              <BarChart data={financial} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }} accessibilityLayer>
                <CartesianGrid horizontal={false} stroke={theme.palette.divider} strokeDasharray="3 3" />
                <XAxis type="number" axisLine={false} tickLine={false} fontSize={11}
                  tickFormatter={(value: number) =>
                    formatNumber(value, undefined, { notation: "compact" })
                  }
                />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={90} fontSize={12} stroke={theme.palette.text.secondary} />
                <Tooltip cursor={{ fill: theme.palette.action.hover }} contentStyle={tooltipStyle}
                  formatter={(value) => `Rp ${formatNumber(Number(value ?? 0))}`} />
                <Bar dataKey="value" name="Amount" radius={[0, 6, 6, 0]} barSize={24} isAnimationActive={false}>
                  {financial.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6">{t("Inventory distribution")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("Physical stock by location")}</Typography>
          <Box role="img" aria-label={t("Inventory distribution doughnut chart")} sx={{ height: 200, minWidth: 0 }}>
            {distribution.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
                <PieChart accessibilityLayer>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="85%" paddingAngle={3} stroke="none" isAnimationActive={false}>
                    {distribution.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} units`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Typography color="text.secondary" sx={{ pt: 8, textAlign: "center" }}>{t("No stock units recorded.")}</Typography>}
          </Box>
          <Box component="dl" sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, m: 0 }}>
            {distribution.map((item) => (
              <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color }} />
                <Typography component="dt" variant="caption" color="text.secondary">{item.name}</Typography>
                <Typography component="dd" variant="caption" sx={{ m: 0 }}>{item.value}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
