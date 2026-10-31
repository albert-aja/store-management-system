import { type ReactNode, useEffect, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
import NavigationIcon from "@mui/icons-material/Navigation";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useSnackbar } from "notistack";
import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import NotificationBell from "../features/notifications/NotificationBell";
import CommandPalette from "./CommandPalette";
import LanguageSwitcher from "./LanguageSwitcher";
import { t, useLanguage } from "../lib/locale";

const TABS = [
  { path: "/", label: "Stores", icon: <StorefrontIcon fontSize="small" /> },
  { path: "/customers", label: "Customers", icon: <PeopleIcon fontSize="small" /> },
  { path: "/products", label: "Products", icon: <Inventory2Icon fontSize="small" /> },
  { path: "/price-list", label: "Price List", icon: <PriceCheckIcon fontSize="small" /> },
  { path: "/inventory", label: "Inventory", icon: <Inventory2Icon fontSize="small" /> },
  { path: "/sales-orders", label: "Sales Orders", icon: <ShoppingCartIcon fontSize="small" /> },
  { path: "/suppliers", label: "Suppliers", icon: <BusinessIcon fontSize="small" /> },
  { path: "/purchase-orders", label: "Purchase Orders", icon: <ReceiptIcon fontSize="small" /> },
  { path: "/trucks", label: "Trucks", icon: <LocalShippingIcon fontSize="small" /> },
  { path: "/delivery-trips", label: "Deliveries", icon: <LocalShippingIcon fontSize="small" /> },
  { path: "/fleet", label: "Fleet & Tracking", icon: <NavigationIcon fontSize="small" /> },
  { path: "/finance", label: "Finance", icon: <AccountBalanceIcon fontSize="small" /> },
  { path: "/expenses", label: "Expenses & Budget", icon: <ReceiptLongIcon fontSize="small" /> },
  { path: "/returns", label: "Returns & Warranty", icon: <AssignmentReturnIcon fontSize="small" /> },
  { path: "/payroll", label: "HR & Payroll", icon: <BadgeIcon fontSize="small" /> },
  { path: "/reports", label: "Reports", icon: <AssessmentIcon fontSize="small" /> },
  { path: "/employees", label: "Employees", icon: <GroupIcon fontSize="small" /> },
  { path: "/roles", label: "Roles", icon: <SecurityIcon fontSize="small" /> },
  { path: "/approvals", label: "Approvals", icon: <RuleIcon fontSize="small" /> },
] as const;

const NAV_GROUPS = [
  { label: "Workspace", paths: ["/", "/reports"] },
  { label: "Commerce", paths: ["/customers", "/products", "/price-list", "/sales-orders", "/inventory"] },
  { label: "Operations", paths: ["/trucks", "/suppliers", "/purchase-orders", "/delivery-trips", "/fleet", "/returns"] },
  { label: "Finance & people", paths: ["/finance", "/expenses", "/payroll", "/employees"] },
  { label: "Administration", paths: ["/roles", "/approvals"] },
] as const;
const SIDEBAR_WIDTH = 248;

export default function AppLayout({ children }: { children: ReactNode }) {
  const language = useLanguage();
  const location = useLocation();
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const employee = useAuthStore((s) => s.employee);
  const { mode, toggleTheme } = useThemeStore();
  const { enqueueSnackbar } = useSnackbar();
  const [signingOut, setSigningOut] = useState(false);

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

  const activeItem = TABS.find((item) => item.path === activeTab);
  const signOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Management sign-out failed:", error);
      enqueueSnackbar(t("Unable to sign out. Please try again.", language), { variant: "error" });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <Box component="a" href="#management-main" sx={{
        position: "fixed", top: -80, left: 16, zIndex: 1500, p: 1.5,
        bgcolor: "background.paper", color: "primary.main",
        "&:focus": { top: 8 },
      }}>{t("Skip to content", language)}</Box>
      <Drawer
        variant={isMobileOrTablet ? "temporary" : "permanent"}
        open={!isMobileOrTablet || drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ width: isMobileOrTablet ? 0 : SIDEBAR_WIDTH, flexShrink: 0 }}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, borderRight: 1, borderColor: "divider" } } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2.5, minHeight: 80 }}>
          <Avatar variant="rounded" sx={{ bgcolor: "primary.main", width: 40, height: 40, borderRadius: 1.5 }}>
            <StorefrontIcon fontSize="small" />
          </Avatar>
          <Box component={RouterLink} to="/" sx={{ color: "text.primary", textDecoration: "none", flex: 1 }}
            onClick={() => setDrawerOpen(false)}>
            <Typography variant="subtitle1">{t("SMS Workspace")}</Typography>
            <Typography variant="caption" color="text.secondary">{t("Store management", language)}</Typography>
          </Box>
          {isMobileOrTablet && <IconButton size="small" aria-label={t("Close navigation", language)} onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>}
        </Box>
        <Divider />
        <Box component="nav" aria-label={t("Management navigation", language)} sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 2 }}>
          {NAV_GROUPS.map((group) => (
            <Box key={group.label} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1.5, mb: 0.75, fontWeight: 500 }}>
                {t(group.label, language)}
              </Typography>
              <List disablePadding>
                {group.paths.map((path) => {
                  const item = TABS.find((tab) => tab.path === path)!;
                  const selected = activeTab === path;
                  return (
                    <ListItem key={path} disablePadding sx={{ mb: 0.25 }}>
                      <ListItemButton component={RouterLink} to={path}
                        selected={selected} aria-current={selected ? "page" : undefined}
                        onClick={() => setDrawerOpen(false)}
                        sx={{ minHeight: 42, borderRadius: 1.25, px: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 32, color: selected ? "primary.main" : "text.secondary" }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={t(item.label, language)} slotProps={{ primary: {
                          sx: {
                          fontSize: "0.8125rem", fontWeight: selected ? 600 : 400,
                          color: selected ? "primary.main" : "text.primary",
                          },
                        } }} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>
        <Divider />
        <Box sx={{ p: 2.5 }}>
          <Typography variant="caption" color="text.secondary">{t("One workspace. Every store.", language)}</Typography>
        </Box>
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0 }}>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: { xs: 0.5, sm: 1.5 }, minHeight: { xs: 64, sm: 80 }, px: { xs: 2, md: 3 } }}>
          {isMobileOrTablet && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("Open navigation", language)}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" }, fontWeight: 500 }}>
            {t(activeItem?.label ?? "Workspace", language)}
          </Typography>

          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCommandPaletteOpen(true)}
            startIcon={<SearchIcon />}
            sx={{
              color: "text.secondary", bgcolor: "background.default",
              minWidth: { sm: 200 }, justifyContent: "flex-start",
              display: { xs: "none", sm: "flex" },
            }}
          >
            {t("Quick search", language)}
            <Typography component="kbd" variant="caption" sx={{ ml: "auto", pl: 2 }}>{t("Ctrl K")}</Typography>
          </Button>
          <IconButton aria-label={t("Quick search", language)} onClick={() => setCommandPaletteOpen(true)} sx={{ display: { sm: "none" } }}><SearchIcon /></IconButton>

          {/* Dark / Light Mode Toggle */}
          <Tooltip title={t(mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode", language)}>
            <IconButton aria-label={t(mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode", language)} color="inherit" onClick={toggleTheme}>
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <LanguageSwitcher />
          <NotificationBell />

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1, ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "action.selected", color: "primary.main", fontSize: 13 }}>
              {employee?.fullName?.split(" ").slice(0, 2).map((part) => part[0]).join("") ?? "S"}
            </Avatar>
            <Typography variant="body2">{employee?.fullName ?? t("Staff", language)}</Typography>
          </Box>
          <Tooltip title={t("Sign out", language)}><IconButton aria-label={t("Sign out", language)} disabled={signingOut} onClick={() => void signOut()}><LogoutIcon fontSize="small" /></IconButton></Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="main" id="management-main" tabIndex={-1} sx={{ p: { xs: 2, md: 3, xl: 4 }, maxWidth: 1680, mx: "auto", minWidth: 0 }}>
        {children}
      </Box>
      </Box>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </Box>
  );
}
