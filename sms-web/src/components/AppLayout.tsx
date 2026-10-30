import { type ReactNode, useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PeopleIcon from "@mui/icons-material/People";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import BadgeIcon from "@mui/icons-material/Badge";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RuleIcon from "@mui/icons-material/Rule";
import GroupIcon from "@mui/icons-material/Group";
import SecurityIcon from "@mui/icons-material/Security";
import BusinessIcon from "@mui/icons-material/Business";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import NotificationBell from "../features/notifications/NotificationBell";
import CommandPalette from "./CommandPalette";

const TABS = [
  { path: "/", label: "Stores", icon: <StorefrontIcon fontSize="small" /> },
  { path: "/customers", label: "Customers", icon: <PeopleIcon fontSize="small" /> },
  { path: "/products", label: "Products", icon: <Inventory2Icon fontSize="small" /> },
  { path: "/inventory", label: "Inventory", icon: <Inventory2Icon fontSize="small" /> },
  { path: "/sales-orders", label: "Sales Orders", icon: <ShoppingCartIcon fontSize="small" /> },
  { path: "/suppliers", label: "Suppliers", icon: <BusinessIcon fontSize="small" /> },
  { path: "/purchase-orders", label: "Purchase Orders", icon: <ReceiptIcon fontSize="small" /> },
  { path: "/delivery-trips", label: "Deliveries", icon: <LocalShippingIcon fontSize="small" /> },
  { path: "/finance", label: "Finance", icon: <AccountBalanceIcon fontSize="small" /> },
  { path: "/expenses", label: "Expenses & Budget", icon: <ReceiptLongIcon fontSize="small" /> },
  { path: "/returns", label: "Returns & Warranty", icon: <AssignmentReturnIcon fontSize="small" /> },
  { path: "/payroll", label: "HR & Payroll", icon: <BadgeIcon fontSize="small" /> },
  { path: "/reports", label: "Reports", icon: <AssessmentIcon fontSize="small" /> },
  { path: "/employees", label: "Employees", icon: <GroupIcon fontSize="small" /> },
  { path: "/roles", label: "Roles", icon: <SecurityIcon fontSize="small" /> },
  { path: "/approvals", label: "Approvals", icon: <RuleIcon fontSize="small" /> },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const employee = useAuthStore((s) => s.employee);
  const { mode, toggleTheme } = useThemeStore();

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeTab =
    TABS.find(
      (t) =>
        t.path === location.pathname ||
        (t.path !== "/" && location.pathname.startsWith(`${t.path}/`)),
    )?.path ?? false;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          {isMobileOrTablet && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
              aria-label="open drawer"
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              letterSpacing: "0.05em",
              cursor: "pointer",
              mr: 2,
            }}
            onClick={() => navigate("/")}
          >
            SMS
          </Typography>

          {/* Quick Search Button */}
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCommandPaletteOpen(true)}
            startIcon={<SearchIcon />}
            sx={{
              color: "inherit",
              borderColor: "rgba(255,255,255,0.3)",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              textTransform: "none",
              fontSize: "0.825rem",
              mr: 2,
              "&:hover": {
                borderColor: "rgba(255,255,255,0.6)",
                backgroundColor: "rgba(255,255,255,0.15)",
              },
            }}
          >
            {isMobileOrTablet ? "Search..." : "Quick search... [Ctrl+K]"}
          </Button>

          {/* Desktop Tabs */}
          {!isMobileOrTablet && (
            <Tabs
              value={activeTab}
              textColor="inherit"
              indicatorColor="secondary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{ flexGrow: 1 }}
            >
              {TABS.map((tab) => (
                <Tab
                  key={tab.path}
                  value={tab.path}
                  label={tab.label}
                  onClick={() => navigate(tab.path)}
                  sx={{
                    minHeight: 56,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                />
              ))}
            </Tabs>
          )}

          <Box sx={{ flexGrow: isMobileOrTablet ? 1 : 0 }} />

          {/* Dark / Light Mode Toggle */}
          <Tooltip title={`Switch to ${mode === "dark" ? "Light" : "Dark"} Mode`}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <NotificationBell />

          <Typography
            sx={{
              mx: 1.5,
              display: { xs: "none", sm: "block" },
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {employee?.fullName}
          </Typography>

          <Button
            color="inherit"
            variant="outlined"
            size="small"
            onClick={() => supabase.auth.signOut()}
            sx={{
              borderColor: "rgba(255,255,255,0.3)",
              "&:hover": { borderColor: "rgba(255,255,255,0.7)" },
            }}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      {/* Mobile / Tablet Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              backgroundColor: theme.palette.background.paper,
            },
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
            Store Management
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {employee?.fullName ?? "Staff Portal"}
          </Typography>
        </Box>
        <List sx={{ pt: 1 }}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.path;
            return (
              <ListItem key={tab.path} disablePadding sx={{ px: 1, py: 0.25 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    navigate(tab.path);
                    setDrawerOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: isSelected
                      ? theme.palette.mode === "dark"
                        ? "rgba(56, 189, 248, 0.12)"
                        : "rgba(2, 132, 199, 0.08)"
                      : "transparent",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isSelected ? theme.palette.primary.main : undefined,
                    }}
                  >
                    {tab.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontSize: "0.9rem",
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? "primary.main" : "text.primary",
                        }}
                      >
                        {tab.label}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Container sx={{ py: 3, flex: 1 }} maxWidth="xl">
        {children}
      </Container>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </Box>
  );
}
