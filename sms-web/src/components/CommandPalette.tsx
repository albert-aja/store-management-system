import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
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
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";

interface CommandItem {
  id: string;
  category: "Navigation" | "Quick Action" | "System";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  keywords: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const baseItems: CommandItem[] = useMemo(() => {
    const handleNav = (path: string) => {
      navigate(path);
      onClose();
    };

    return [
      // Navigation
      {
        id: "nav-stores",
        category: "Navigation",
        title: "Stores & Branches",
        subtitle: "Multi-store hierarchy and showroom locations",
        icon: <StorefrontIcon fontSize="small" />,
        keywords: "store branch showroom location",
        action: () => handleNav("/"),
      },
      {
        id: "nav-customers",
        category: "Navigation",
        title: "Customers Directory",
        subtitle: "NIK identity, credit history, delivery addresses",
        icon: <PeopleIcon fontSize="small" />,
        keywords: "customer client buyer nik address",
        action: () => handleNav("/customers"),
      },
      {
        id: "nav-products",
        category: "Navigation",
        title: "Product Catalog & Pricing",
        subtitle: "Variants, SKUs, store price configuration",
        icon: <Inventory2Icon fontSize="small" />,
        keywords: "product catalog sku price variant category",
        action: () => handleNav("/products"),
      },
      {
        id: "nav-inventory",
        category: "Navigation",
        title: "Stock Units & Ledger",
        subtitle: "Serial tracking, location transfers, physical stock",
        icon: <QrCodeScannerIcon fontSize="small" />,
        keywords: "inventory stock unit serial warehouse showroom ledger",
        action: () => handleNav("/inventory"),
      },
      {
        id: "nav-orders",
        category: "Navigation",
        title: "Sales Orders",
        subtitle: "Order management, price approvals, down payments",
        icon: <ShoppingCartIcon fontSize="small" />,
        keywords: "sales order so pos invoice draft credit",
        action: () => handleNav("/sales-orders"),
      },
      {
        id: "nav-deliveries",
        category: "Navigation",
        title: "Deliveries & Surat Jalan",
        subtitle: "Trip dispatch, driver loading, pre-inspection, handover",
        icon: <LocalShippingIcon fontSize="small" />,
        keywords: "delivery trip surat jalan driver vehicle dispatch",
        action: () => handleNav("/delivery-trips"),
      },
      {
        id: "nav-finance",
        category: "Navigation",
        title: "Finance & Accounts Receivable",
        subtitle: "Installment schedules, payments, cash custody handover",
        icon: <AccountBalanceIcon fontSize="small" />,
        keywords: "finance ar installment payment custody cashier collection",
        action: () => handleNav("/finance"),
      },
      {
        id: "nav-expenses",
        category: "Navigation",
        title: "Expenses & Budget Ceilings",
        subtitle: "Store monthly budgets, expense vouchers, overruns",
        icon: <ReceiptLongIcon fontSize="small" />,
        keywords: "expense budget overrun disbursement voucher",
        action: () => handleNav("/expenses"),
      },
      {
        id: "nav-returns",
        category: "Navigation",
        title: "Returns, Repossessions & Warranty",
        subtitle: "Asset recovery triage, repairs, scrap disposal",
        icon: <AssignmentReturnIcon fontSize="small" />,
        keywords: "return repossession warranty repair scrap triage",
        action: () => handleNav("/returns"),
      },
      {
        id: "nav-payroll",
        category: "Navigation",
        title: "HR, Attendance & Payroll",
        subtitle: "Time tracking, leave requests, monthly commission slips",
        icon: <BadgeIcon fontSize="small" />,
        keywords: "payroll attendance hr leave clock in slip salary commission",
        action: () => handleNav("/payroll"),
      },
      {
        id: "nav-reports",
        category: "Navigation",
        title: "Executive Reports & Analytics",
        subtitle: "Aging analysis, revenue trends, sales leaderboards",
        icon: <AssessmentIcon fontSize="small" />,
        keywords: "report dashboard aging revenue sales kpi analytics",
        action: () => handleNav("/reports"),
      },
      {
        id: "nav-approvals",
        category: "Navigation",
        title: "Approval Workflow Engine",
        subtitle: "Configure multi-level approval steps and roles",
        icon: <RuleIcon fontSize="small" />,
        keywords: "approval workflow chain step condition override",
        action: () => handleNav("/approvals"),
      },

      // Quick Actions
      {
        id: "action-new-so",
        category: "Quick Action",
        title: "Create Sales Order",
        subtitle: "Draft a new retail cash or credit agreement",
        icon: <AddCircleIcon color="primary" fontSize="small" />,
        keywords: "create new sales order draft",
        action: () => handleNav("/sales-orders"),
      },
      {
        id: "action-receive-stock",
        category: "Quick Action",
        title: "Receive Stock Units",
        subtitle: "Ingest serialized stock units into warehouse",
        icon: <AddCircleIcon color="secondary" fontSize="small" />,
        keywords: "receive stock inbound serial ingest",
        action: () => handleNav("/inventory"),
      },
      {
        id: "action-new-customer",
        category: "Quick Action",
        title: "Register New Customer",
        subtitle: "Add NIK profile, contacts, and delivery address",
        icon: <AddCircleIcon color="primary" fontSize="small" />,
        keywords: "new customer register add nik",
        action: () => handleNav("/customers"),
      },

      // System Controls
      {
        id: "sys-toggle-theme",
        category: "System",
        title: mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        subtitle: "Toggle between Dark Navy and Clean Light interface themes",
        icon: mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />,
        keywords: "theme dark light mode color style",
        action: () => {
          toggleTheme();
          onClose();
        },
      },
    ];
  }, [navigate, onClose, mode, toggleTheme]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return baseItems;
    const clean = query.toLowerCase().trim();
    return baseItems.filter(
      (item) =>
        item.title.toLowerCase().includes(clean) ||
        item.subtitle?.toLowerCase().includes(clean) ||
        item.keywords.toLowerCase().includes(clean) ||
        item.category.toLowerCase().includes(clean),
    );
  }, [baseItems, query]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredItems.length - 1 : prev - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
          },
        },
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Type a command, module, or keyword... (Esc to close)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="outlined"
          size="medium"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Chip
                    label="ESC"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem", height: 22 }}
                  />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
              },
            },
          }}
        />
      </Box>

      <Divider />

      <List
        sx={{
          maxHeight: 400,
          overflow: "auto",
          p: 1,
        }}
      >
        {filteredItems.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No results found for "{query}".
            </Typography>
          </Box>
        ) : (
          filteredItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    backgroundColor: isSelected
                      ? theme.palette.mode === "dark"
                        ? "rgba(56, 189, 248, 0.12)"
                        : "rgba(2, 132, 199, 0.08)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(56, 189, 248, 0.16)"
                          : "rgba(2, 132, 199, 0.12)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 38,
                      color: isSelected
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? "primary.main" : "text.primary",
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            height: 18,
                            backgroundColor:
                              item.category === "Quick Action"
                                ? "rgba(16, 185, 129, 0.12)"
                                : item.category === "System"
                                ? "rgba(245, 158, 11, 0.12)"
                                : "rgba(148, 163, 184, 0.15)",
                            color:
                              item.category === "Quick Action"
                                ? theme.palette.secondary.main
                                : undefined,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ display: "block" }}
                      >
                        {item.subtitle}
                      </Typography>
                    }
                  />
                  {isSelected && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.primary.main,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    >
                      Press Enter ↵
                    </Typography>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })
        )}
      </List>

      <Divider />

      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.02)",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Navigate with <strong>↑</strong> <strong>↓</strong> arrows
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Store Management System v2.0
        </Typography>
      </Box>
    </Dialog>
  );
}
