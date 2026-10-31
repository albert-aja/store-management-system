import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import CallIcon from "@mui/icons-material/Call";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SmsIcon from "@mui/icons-material/Sms";
import PersonIcon from "@mui/icons-material/Person";
import EventNoteIcon from "@mui/icons-material/EventNote";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import StarIcon from "@mui/icons-material/Star";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import HistoryIcon from "@mui/icons-material/History";

import { useAuthStore } from "../../store/authStore";
import DocumentsPanel from "../documents/DocumentsPanel";
import {
  useAddAddress,
  useAddContact,
  useAddCustomerTag,
  useCancelCustomerFollowUp,
  useCompleteCustomerFollowUp,
  useCreateCustomerFollowUp,
  useCustomer,
  useCustomer360,
  useCustomerAddresses,
  useCustomerContacts,
  useCustomerFollowUps,
  useCustomerInteractions,
  useCustomerPtps,
  useCustomerStoreCredit,
  useCustomerVouchers,
  useDeactivateAddress,
  useDeactivateContact,
  useGrantCustomerStoreCredit,
  useLogCustomerInteraction,
  useRecordCustomerPtp,
  useRedeemCustomerStoreCredit,
  useRemoveCustomerTag,
  useSetPrimaryAddress,
  useUpdateCustomerPtpStatus,
} from "./hooks";
import type {
  AddressInput,
  ContactInput,
  FollowUpInput,
  InteractionInput,
  PtpInput,
  PtpStatus,
  StoreCreditInput,
} from "./types";
import { t , formatDate, formatNumber, localizeDisplayCode} from "../../lib/locale";

function formatRupiah(amount: number | undefined | null): string {
  if (amount == null) return "Rp 0";
  return "Rp " + formatNumber(amount);
}

function getSegmentChipProps(segment: string | undefined) {
  switch (segment) {
    case "VIP_CASH":
      return { label: t("VIP Cash Buyer"), color: "warning" as const, variant: "filled" as const };
    case "STAR_CREDIT":
      return { label: t("Star Credit Customer"), color: "secondary" as const, variant: "filled" as const };
    case "HIGH_DELINQUENCY_RISK":
      return { label: t("High Delinquency Risk"), color: "error" as const, variant: "filled" as const };
    default:
      return { label: t("Standard Account"), color: "default" as const, variant: "outlined" as const };
  }
}

function getCreditGradeColor(grade: string | undefined): "success" | "info" | "warning" | "error" {
  switch (grade) {
    case "A": return "success";
    case "B": return "info";
    case "C": return "warning";
    case "D": return "error";
    default: return "info";
  }
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "WHATSAPP": return <WhatsAppIcon sx={{ color: "#25D366" }} />;
    case "PHONE_CALL": return <CallIcon sx={{ color: "#0284c7" }} />;
    case "SMS": return <SmsIcon sx={{ color: "#6366f1" }} />;
    case "IN_PERSON": return <PersonIcon sx={{ color: "#f59e0b" }} />;
    default: return <EventNoteIcon sx={{ color: "#64748b" }} />;
  }
}

export default function CustomerDetailPage() {
  const { id = "" } = useParams();
  const { data: customer } = useCustomer(id);
  const { data: summary } = useCustomer360(id);
  const { data: contacts } = useCustomerContacts(id);
  const { data: addresses } = useCustomerAddresses(id);
  const { data: interactions } = useCustomerInteractions(id);
  const { data: followUps } = useCustomerFollowUps(id);
  const { data: ptps } = useCustomerPtps(id);
  const { data: storeCreditEntries } = useCustomerStoreCredit(id);
  const { data: vouchers } = useCustomerVouchers(id);

  const canManage = useAuthStore((s) => s.hasPermission("CUSTOMER_MANAGE"));

  // Mutations
  const addContact = useAddContact(id);
  const deactivateContact = useDeactivateContact(id);
  const addAddress = useAddAddress(id);
  const setPrimaryAddress = useSetPrimaryAddress(id);
  const deactivateAddress = useDeactivateAddress(id);
  const addTag = useAddCustomerTag(id);
  const removeTag = useRemoveCustomerTag(id);
  const logInteraction = useLogCustomerInteraction(id);
  const createFollowUp = useCreateCustomerFollowUp(id);
  const completeFollowUp = useCompleteCustomerFollowUp(id);
  const cancelFollowUp = useCancelCustomerFollowUp(id);
  const recordPtp = useRecordCustomerPtp(id);
  const updatePtpStatus = useUpdateCustomerPtpStatus(id);
  const grantStoreCredit = useGrantCustomerStoreCredit(id);
  const redeemStoreCredit = useRedeemCustomerStoreCredit(id);

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [timelineFilter, setTimelineFilter] = useState<string>("ALL");
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [showPtpDialog, setShowPtpDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [showStoreCreditDialog, setShowStoreCreditDialog] = useState(false);
  const [storeCreditMode, setStoreCreditMode] = useState<"GRANT" | "REDEEM">("GRANT");
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [resolutionPtpId, setResolutionPtpId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<PtpStatus>("KEPT");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Forms
  const contactForm = useForm<ContactInput>({
    defaultValues: { contactType: "PHONE", label: "", value: "", notes: "" },
  });
  const addressForm = useForm<AddressInput>({
    defaultValues: { label: "", addressLine: "", notes: "", primary: false },
  });
  const interactionForm = useForm<InteractionInput>({
    defaultValues: {
      channel: "PHONE_CALL",
      direction: "OUTBOUND",
      summary: "",
      details: "",
      outcome: "POSITIVE",
    },
  });
  const ptpForm = useForm<PtpInput>({
    defaultValues: {
      promisedAmount: 500000,
      promisedDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      notes: "",
    },
  });
  const followUpForm = useForm<FollowUpInput>({
    defaultValues: {
      title: "",
      followUpType: "SALES_LEAD",
      scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      notes: "",
    },
  });
  const storeCreditForm = useForm<StoreCreditInput>({
    defaultValues: {
      amount: 50000,
      reason: "",
    },
  });

  if (!customer) return null;

  // Filter timeline items
  const timelineEvents = (summary?.timeline ?? []).filter((item) => {
    if (timelineFilter === "ALL") return true;
    if (timelineFilter === "ORDERS") return item.eventType === "SALES_ORDER" || item.eventType === "DELIVERY";
    if (timelineFilter === "PAYMENTS") return item.eventType === "PAYMENT" || item.eventType === "STORE_CREDIT";
    if (timelineFilter === "CRM") return item.eventType === "INTERACTION" || item.eventType === "PTP" || item.eventType === "FOLLOW_UP";
    return true;
  });

  return (
    <Box sx={{ pb: 6 }}>
      {/* 360 Header Profile & Key Metrics */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", minWidth: 0 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", fontSize: "1.5rem", fontWeight: 600 }}>
              {customer.fullName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {customer.fullName}
                </Typography>
                <Chip {...getSegmentChipProps(summary?.segment)} size="small" />
                <Chip
                  icon={<StarIcon sx={{ "&&": { color: "#facc15" } }} />}
                  label={t("Credit Score: {grade} ({points}/100)", undefined, {
                    grade: summary?.creditScoreGrade ?? "B",
                    points: formatNumber(summary?.creditScorePoints ?? 80),
                  })}
                  color={getCreditGradeColor(summary?.creditScoreGrade)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                {t("NIK:")} <strong>{customer.nik ?? "—"}</strong> {t("• Telp:")} <strong>{customer.primaryPhone ?? "—"}</strong> {t("• Email:")} {customer.primaryEmail ?? "—"}
              </Typography>
              {customer.motherMaidenName && (
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                  {t("Nama Ibu Kandung: •••••••• (Terverifikasi PDP) • Lahir:")} {customer.birthPlace ?? "—"}, {customer.birthDate ?? "—"}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Quick Action Buttons */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<CallIcon />}
              onClick={() => setShowInteractionDialog(true)}
            >
              {t("Log Interaksi")}
            </Button>
            <Button
              variant="outlined"
              color="success"
              size="small"
              startIcon={<MonetizationOnIcon />}
              onClick={() => setShowPtpDialog(true)}
            >
              {t("Janji Bayar (PTP)")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EventNoteIcon />}
              onClick={() => setShowFollowUpDialog(true)}
            >
              {t("Pengingat")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LocalOfferIcon />}
              onClick={() => {
                setStoreCreditMode("GRANT");
                setShowStoreCreditDialog(true);
              }}
            >
              {t("Store Credit")}
            </Button>
          </Box>
        </Box>

        {/* Demographic & Behavioral Tags Strip */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {t("Tags:")}
          </Typography>
          {(summary?.tags ?? []).map((t) => (
            <Chip
              key={t.id}
              label={t.tagName}
              size="small"
              onDelete={canManage ? () => removeTag.mutate(t.tagName) : undefined}
              sx={{ bgcolor: t.color, color: "#fff", fontWeight: 600, fontSize: "0.75rem" }}
            />
          ))}
          {canManage && (
            <Chip
              icon={<AddIcon />}
              label={t("Tambah Tag")}
              size="small"
              clickable
              onClick={() => setShowTagDialog(true)}
              variant="outlined"
            />
          )}
        </Box>

        {/* 4 KPI Summary Cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "background.default", border: 1, borderColor: "divider" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, display: "block" }}>
                {t("CUSTOMER LIFETIME VALUE (CLV)")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                {formatRupiah(summary?.clvAmount)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                {t("Total Transaksi:")} {summary?.totalOrdersCount ?? 0} {t("Pesanan")}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "background.default", border: 1, borderColor: "divider" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, display: "block" }}>
                {t("SALDO STORE CREDIT (UANG MUKA/REFUND)")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "success.main" }}>
                {formatRupiah(summary?.storeCreditBalance)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                {t("Voucher Aktif:")} {summary?.activeVouchersCount ?? 0} {t("Kupon")}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "background.default", border: 1, borderColor: "divider" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, display: "block" }}>
                {t("JANJI BAYAR (PTP) PENDING")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: (summary?.pendingPtpCount ?? 0) > 0 ? "error.main" : "text.primary" }}>
                {summary?.pendingPtpCount ?? 0} {t("Komitmen")}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                {t("Target Penagihan Aktif")}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "background.default", border: 1, borderColor: "divider" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, display: "block" }}>
                {t("PENGINGAT & TINDAK LANJUT")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: (summary?.pendingFollowUpsCount ?? 0) > 0 ? "warning.main" : "text.primary" }}>
                {summary?.pendingFollowUpsCount ?? 0} {t("Jadwal")}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                {t("Sales Lead & Payment Alert")}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab icon={<HistoryIcon />} iconPosition="start" label={t("Timeline 360 (J.1)")} />
          <Tab icon={<CallIcon />} iconPosition="start" label={t("Omnichannel Log ({count}) (J.6)", undefined, { count: formatNumber(interactions?.length ?? 0) })} />
          <Tab icon={<MonetizationOnIcon />} iconPosition="start" label={t("Promise to Pay ({count}) (J.3)", undefined, { count: formatNumber(ptps?.length ?? 0) })} />
          <Tab icon={<EventNoteIcon />} iconPosition="start" label={t("Reminders ({count}) (J.7)", undefined, { count: formatNumber(followUps?.length ?? 0) })} />
          <Tab icon={<LocalOfferIcon />} iconPosition="start" label={t("Store Credit & Voucher (J.5)")} />
          <Tab icon={<PersonIcon />} iconPosition="start" label={t("Kontak & Alamat")} />
          <Tab icon={<AssignmentTurnedInIcon />} iconPosition="start" label={t("Dokumen")} />
        </Tabs>
      </Box>

      {/* TAB 0: UNIFIED 360 TIMELINE (J.1) */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("Riwayat Aktivitas 360 Terpadu (Unified Chronological Feed)")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                label={t("Semua")}
                clickable
                color={timelineFilter === "ALL" ? "primary" : "default"}
                onClick={() => setTimelineFilter("ALL")}
                size="small"
              />
              <Chip
                label={t("Pesanan & Surat Jalan")}
                clickable
                color={timelineFilter === "ORDERS" ? "primary" : "default"}
                onClick={() => setTimelineFilter("ORDERS")}
                size="small"
              />
              <Chip
                label={t("Pembayaran & Keuangan")}
                clickable
                color={timelineFilter === "PAYMENTS" ? "primary" : "default"}
                onClick={() => setTimelineFilter("PAYMENTS")}
                size="small"
              />
              <Chip
                label={t("CRM & Komunikasi")}
                clickable
                color={timelineFilter === "CRM" ? "primary" : "default"}
                onClick={() => setTimelineFilter("CRM")}
                size="small"
              />
            </Box>
          </Box>

          {timelineEvents.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
              {t("Belum ada riwayat aktivitas yang tercatat untuk filter ini.")}
            </Paper>
          ) : (
            <Box sx={{ position: "relative", pl: 3, borderLeft: "2px solid #cbd5e1", ml: 2 }}>
              {timelineEvents.map((evt) => (
                <Box key={evt.id} sx={{ mb: 3, position: "relative" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      left: -33,
                      top: 4,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      bgcolor: evt.badgeColor ?? "#2563eb",
                      border: "3px solid #fff",
                    }}
                  />
                  <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {evt.title}
                          </Typography>
                          <Chip
                            label={evt.eventType}
                            size="small"
                            sx={{ bgcolor: `${evt.badgeColor}20`, color: evt.badgeColor, fontWeight: 700, fontSize: "0.7rem" }}
                          />
                          {evt.status && (
                            <Chip label={localizeDisplayCode(evt.status)} size="small" variant="outlined" />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                          {evt.description}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                        {formatDate(new Date(evt.timestamp), undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* TAB 1: OMNICHANNEL COMMUNICATION LOG (J.6) */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("Log Komunikasi Omnichannel (WhatsApp, Telepon, SMS, Kunjungan)")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<CallIcon />}
              onClick={() => setShowInteractionDialog(true)}
            >
              {t("Catat Interaksi Baru")}
            </Button>
          </Box>

          <Grid container spacing={2}>
            {(interactions ?? []).map((item) => (
              <Grid size={{ xs: 12 }} key={item.id}>
                <Paper sx={{ p: 2, display: "flex", gap: 2, alignItems: "flex-start", borderRadius: 2 }}>
                  <Avatar sx={{ bgcolor: "background.default" }}>
                    {getChannelIcon(item.channel)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {item.summary}
                        </Typography>
                        <Chip label={item.channel} size="small" />
                        <Chip
                          label={item.direction}
                          size="small"
                          color={item.direction === "INBOUND" ? "info" : "default"}
                          variant="outlined"
                        />
                        <Chip
                          label={t("Outcome: {outcome}", undefined, {
                            outcome: item.outcome,
                          })}
                          size="small"
                          color={
                            item.outcome === "POSITIVE"
                              ? "success"
                              : item.outcome === "NEGATIVE"
                              ? "error"
                              : "default"
                          }
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {formatDate(new Date(item.createdAt), undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </Typography>
                    </Box>
                    {item.details && (
                      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                        {item.details}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#64748b" }}>
                      {t("Dicatat oleh:")} <strong>{item.recordedByName}</strong>
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
            {(interactions ?? []).length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                  {t("Belum ada log interaksi telepon, WhatsApp, atau kunjungan langsung.")}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* TAB 2: PROMISE-TO-PAY (PTP) LEDGER (J.3) */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("Daftar Janji Bayar (Promise-to-Pay / PTP)")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<MonetizationOnIcon />}
              onClick={() => setShowPtpDialog(true)}
              color="success"
            >
              {t("Catat Janji Bayar Baru")}
            </Button>
          </Box>

          <Grid container spacing={2}>
            {(ptps ?? []).map((ptp) => (
              <Grid size={{ xs: 12, md: 6 }} key={ptp.id}>
                <Card sx={{ borderLeft: "4px solid", borderColor: ptp.status === "KEPT" ? "#10b981" : ptp.status === "BROKEN" ? "#ef4444" : "#f59e0b" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e3a8a" }}>
                          {formatRupiah(ptp.promisedAmount)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t("Tanggal Dijanjikan:")} {formatDate(ptp.promisedDate)}
                        </Typography>
                        {ptp.salesOrderNumber && (
                          <Typography variant="caption" color="text.secondary">
                            {t("Ref SO:")} {ptp.salesOrderNumber}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={localizeDisplayCode(ptp.status)}
                        color={
                          ptp.status === "KEPT"
                            ? "success"
                            : ptp.status === "BROKEN"
                            ? "error"
                            : "warning"
                        }
                        size="small"
                      />
                    </Box>

                    {ptp.notes && (
                      <Typography variant="body2" sx={{ mt: 1, bgcolor: "background.default", p: 1, borderRadius: 1 }}>
                        {ptp.notes}
                      </Typography>
                    )}

                    <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("Petugas:")} {ptp.recordedByName}
                      </Typography>
                      {canManage && ptp.status === "PENDING" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => {
                              setResolutionPtpId(ptp.id);
                              setResolutionStatus("KEPT");
                              setResolutionNotes("");
                            }}
                          >
                            {t("Kept (Ditepati)")}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => {
                              setResolutionPtpId(ptp.id);
                              setResolutionStatus("BROKEN");
                              setResolutionNotes("");
                            }}
                          >
                            {t("Broken (Ingkar)")}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {(ptps ?? []).length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                  {t("Belum ada janji bayar yang dicatat untuk pelanggan ini.")}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* TAB 3: FOLLOW-UP REMINDERS (J.7) */}
      {activeTab === 3 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("Jadwal Pengingat & Tindak Lanjut (Follow-Up Scheduler)")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<EventNoteIcon />}
              onClick={() => setShowFollowUpDialog(true)}
            >
              {t("Jadwalkan Pengingat Baru")}
            </Button>
          </Box>

          <Grid container spacing={2}>
            {(followUps ?? []).map((item) => (
              <Grid size={{ xs: 12, md: 6 }} key={item.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {item.title}
                        </Typography>
                        <Chip label={item.followUpType} size="small" sx={{ mt: 0.5 }} />
                      </Box>
                      <Chip
                        label={localizeDisplayCode(item.status)}
                        color={item.status === "COMPLETED" ? "success" : item.status === "CANCELLED" ? "default" : "warning"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      {t("Jadwal:")} {formatDate(new Date(item.scheduledAt), undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </Typography>
                    {item.notes && (
                      <Typography variant="body2" sx={{ mt: 1, bgcolor: "background.default", p: 1, borderRadius: 1 }}>
                        {item.notes}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("PIC:")} {item.assignedEmployeeName}
                      </Typography>
                      {canManage && item.status === "SCHEDULED" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => completeFollowUp.mutate({ followUpId: item.id, notes: "Follow up berhasil dijalankan" })}
                          >
                            {t("Selesai")}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => cancelFollowUp.mutate(item.id)}
                          >
                            {t("Batal")}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {(followUps ?? []).length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                  {t("Belum ada jadwal pengingat untuk pelanggan ini.")}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* TAB 4: STORE CREDIT & VOUCHERS (J.5) */}
      {activeTab === 4 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("Store Credit Ledger & Kupon Promo (Money Management Ritel)")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("Saldo kredit toko resmi untuk penyesuaian diskon, uang muka, dan garansi (Bukan aktivitas perbankan).")}
              </Typography>
            </Box>
            {canManage && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setStoreCreditMode("GRANT");
                    setShowStoreCreditDialog(true);
                  }}
                >
                  {t("Tambah Saldo (Grant)")}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    setStoreCreditMode("REDEEM");
                    setShowStoreCreditDialog(true);
                  }}
                >
                  {t("Gunakan Saldo (Redeem)")}
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={3}>
            {/* Store credit ledger table */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t("Buku Catatan Saldo Kredit Toko (Store Credit Ledger)")}
                </Typography>
                <List dense>
                  {(storeCreditEntries ?? []).map((entry) => (
                    <ListItem key={entry.id} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {entry.entryType === "GRANT" ? "+ " : "- "} {formatRupiah(entry.amount)}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: "#059669" }}>
                              {t("Saldo Akhir:")} {formatRupiah(entry.balanceAfter)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="span" sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {entry.notes ?? "Transaksi Store Credit"} • {entry.referenceType ?? "MANUAL"}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {formatDate(new Date(entry.createdAt), undefined, { dateStyle: "medium" })}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {(storeCreditEntries ?? []).length === 0 && (
                    <Typography variant="body2" sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                      {t("Belum ada mutasi store credit.")}
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Vouchers & Promotional coupons */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t("Kupon Promo & Gift Voucher Pelanggan")}
                </Typography>
                {(vouchers ?? []).map((v) => (
                  <Card key={v.id} sx={{ mb: 1.5, border: "1px dashed", borderColor: "primary.main", bgcolor: "background.paper" }}>
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0369a1" }}>
                          {v.code}
                        </Typography>
                        <Tooltip title={t("Salin Kode Voucher")}>
                          <IconButton size="small" onClick={() => navigator.clipboard.writeText(v.code)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {v.title}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                        {t("Diskon:")} {v.voucherType === "PERCENTAGE" ? `${v.discountValue}%` : formatRupiah(v.discountValue)}
                        {v.minOrderAmount
                          ? ` • ${t("Minimum purchase: {amount}", undefined, {
                              amount: formatRupiah(v.minOrderAmount),
                            })}`
                          : ""}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", color: "#0369a1", mt: 0.5 }}>
                        {t("Berlaku:")} {v.validFrom} {t("s/d")} {v.validUntil} {t("• Kuota:")} {v.timesUsed}/{v.maxUses}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
                {(vouchers ?? []).length === 0 && (
                  <Typography variant="body2" sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                    {t("Tidak ada voucher khusus yang ditautkan ke akun ini.")}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* TAB 5: CONTACTS & ADDRESSES */}
      {activeTab === 5 && (
        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Paper sx={{ p: 2, width: 360 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t("Contacts")}
            </Typography>
            <List dense>
              {(contacts ?? []).map((contact) => (
                <ListItem
                  key={contact.id}
                  secondaryAction={
                    canManage && (
                      <Button
                        size="small"
                        onClick={() => deactivateContact.mutate(contact.id)}
                      >
                        {t("Remove")}
                      </Button>
                    )
                  }
                >
                  <ListItemText
                    primary={`${contact.contactType}${contact.label ? ` (${contact.label})` : ""}: ${contact.value}`}
                    secondary={contact.notes}
                  />
                </ListItem>
              ))}
            </List>
            {canManage &&
              (showContactForm ? (
                <Box
                  component="form"
                  sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  onSubmit={contactForm.handleSubmit((values) => {
                    addContact.mutate(values);
                    contactForm.reset();
                    setShowContactForm(false);
                  })}
                >
                  <TextField
                    select
                    label={t("Type")}
                    size="small"
                    {...contactForm.register("contactType")}
                  >
                    <MenuItem value="PHONE">{t("Phone")}</MenuItem>
                    <MenuItem value="EMAIL">{t("Email")}</MenuItem>
                    <MenuItem value="OTHER">{t("Other")}</MenuItem>
                  </TextField>
                  <TextField
                    label={t("Label")}
                    size="small"
                    {...contactForm.register("label")}
                  />
                  <TextField
                    label={t("Value")}
                    size="small"
                    required
                    {...contactForm.register("value", { required: true })}
                  />
                  <Button type="submit" variant="contained" size="small">
                    {t("Add Contact")}
                  </Button>
                </Box>
              ) : (
                <Button size="small" onClick={() => setShowContactForm(true)}>
                  {t("Add Contact")}
                </Button>
              ))}
          </Paper>

          <Paper sx={{ p: 2, width: 360 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t("Addresses")}
            </Typography>
            <List dense>
              {(addresses ?? []).map((address) => (
                <ListItem
                  key={address.id}
                  secondaryAction={
                    canManage && (
                      <>
                        {!address.primary && (
                          <Button
                            size="small"
                            onClick={() => setPrimaryAddress.mutate(address.id)}
                          >
                            {t("Set Primary")}
                          </Button>
                        )}
                        <Button
                          size="small"
                          onClick={() => deactivateAddress.mutate(address.id)}
                        >
                          {t("Remove")}
                        </Button>
                      </>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <>
                        {address.label ?? "Address"}{" "}
                        {address.primary && (
                          <Chip label={t("Primary")} size="small" color="primary" />
                        )}
                      </>
                    }
                    secondary={address.addressLine}
                  />
                </ListItem>
              ))}
            </List>
            {canManage &&
              (showAddressForm ? (
                <Box
                  component="form"
                  sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  onSubmit={addressForm.handleSubmit((values) => {
                    addAddress.mutate(values);
                    addressForm.reset();
                    setShowAddressForm(false);
                  })}
                >
                  <TextField
                    label={t("Label")}
                    size="small"
                    {...addressForm.register("label")}
                  />
                  <TextField
                    label={t("Address")}
                    size="small"
                    multiline
                    rows={2}
                    required
                    {...addressForm.register("addressLine", { required: true })}
                  />
                  <FormControlLabel
                    control={<Checkbox {...addressForm.register("primary")} />}
                    label={t("Set as primary")}
                  />
                  <Button type="submit" variant="contained" size="small">
                    {t("Add Address")}
                  </Button>
                </Box>
              ) : (
                <Button size="small" onClick={() => setShowAddressForm(true)}>
                  {t("Add Address")}
                </Button>
              ))}
          </Paper>
        </Box>
      )}

      {/* TAB 6: DOCUMENTS */}
      {activeTab === 6 && (
        <Paper sx={{ p: 2, maxWidth: 600 }}>
          <DocumentsPanel ownerType="CUSTOMER" ownerId={id} />
        </Paper>
      )}

      {/* DIALOG 1: LOG OMNICHANNEL INTERACTION (J.6) */}
      <Dialog open={showInteractionDialog} onClose={() => setShowInteractionDialog(false)} fullWidth maxWidth="sm">
        <form
          onSubmit={interactionForm.handleSubmit((vals) => {
            logInteraction.mutate(vals);
            interactionForm.reset();
            setShowInteractionDialog(false);
          })}
        >
          <DialogTitle>{t("Catat Interaksi Pelanggan (Omnichannel)")}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t("Saluran (Channel)")}</InputLabel>
                <Select label={t("Saluran (Channel)")} {...interactionForm.register("channel")}>
                  <MenuItem value="WHATSAPP">{t("WhatsApp")}</MenuItem>
                  <MenuItem value="PHONE_CALL">{t("Telepon Resmi")}</MenuItem>
                  <MenuItem value="IN_PERSON">{t("Kunjungan Showroom")}</MenuItem>
                  <MenuItem value="SMS">{t("SMS")}</MenuItem>
                  <MenuItem value="EMAIL">{t("Email")}</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>{t("Arah (Direction)")}</InputLabel>
                <Select label={t("Arah (Direction)")} {...interactionForm.register("direction")}>
                  <MenuItem value="OUTBOUND">{t("Outbound (Toko Menghubungi)")}</MenuItem>
                  <MenuItem value="INBOUND">{t("Inbound (Pelanggan Menghubungi)")}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label={t("Ringkasan Percakapan")}
              fullWidth
              required
              size="small"
              placeholder={t("Contoh: Konfirmasi ketersediaan stok mesin cuci")}
              {...interactionForm.register("summary", { required: true })}
            />

            <TextField
              label={t("Rincian Lengkap / Catatan")}
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder={t("Pelanggan menanyakan opsi cicilan 6 bulan...")}
              {...interactionForm.register("details")}
            />

            <FormControl fullWidth size="small">
              <InputLabel>{t("Hasil Interaksi (Outcome)")}</InputLabel>
              <Select label={t("Hasil Interaksi (Outcome)")} {...interactionForm.register("outcome")}>
                <MenuItem value="POSITIVE">{t("Positif (Tertarik / Bersedia Membayar)")}</MenuItem>
                <MenuItem value="NEUTRAL">{t("Netral (Menimbang / Minta Waktu)")}</MenuItem>
                <MenuItem value="NEGATIVE">{t("Negatif (Menolak / Komplain)")}</MenuItem>
                <MenuItem value="NO_ANSWER">{t("Tidak Diangkat / Tidak Aktif")}</MenuItem>
                <MenuItem value="FOLLOW_UP_REQUIRED">{t("Perlu Tindak Lanjut")}</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowInteractionDialog(false)}>{t("Batal")}</Button>
            <Button type="submit" variant="contained">
              {t("Simpan Interaksi")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 2: RECORD PROMISE-TO-PAY (PTP) (J.3) */}
      <Dialog open={showPtpDialog} onClose={() => setShowPtpDialog(false)} fullWidth maxWidth="sm">
        <form
          onSubmit={ptpForm.handleSubmit((vals) => {
            recordPtp.mutate({
              ...vals,
              promisedAmount: Number(vals.promisedAmount),
            });
            ptpForm.reset();
            setShowPtpDialog(false);
          })}
        >
          <DialogTitle>{t("Catat Janji Bayar (Promise-to-Pay)")}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label={t("Nominal yang Dijanjikan (Rp)")}
              type="number"
              fullWidth
              required
              {...ptpForm.register("promisedAmount", { required: true, valueAsNumber: true })}
            />
            <TextField
              label={t("Tanggal Janji Bayar")}
              type="date"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              {...ptpForm.register("promisedDate", { required: true })}
            />
            <TextField
              label={t("Catatan Komitmen Debitur")}
              fullWidth
              multiline
              rows={2}
              placeholder={t("Pelanggan berjanji melunasi setelah gajian tanggal 5...")}
              {...ptpForm.register("notes")}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPtpDialog(false)}>{t("Batal")}</Button>
            <Button type="submit" variant="contained" color="success">
              {t("Simpan Janji Bayar")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 3: SCHEDULE FOLLOW-UP (J.7) */}
      <Dialog open={showFollowUpDialog} onClose={() => setShowFollowUpDialog(false)} fullWidth maxWidth="sm">
        <form
          onSubmit={followUpForm.handleSubmit((vals) => {
            createFollowUp.mutate(vals);
            followUpForm.reset();
            setShowFollowUpDialog(false);
          })}
        >
          <DialogTitle>{t("Jadwalkan Pengingat Tindak Lanjut")}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label={t("Judul Pengingat")}
              fullWidth
              required
              placeholder={t("Contoh: Telepon penawaran upgrade kulkas dua pintu")}
              {...followUpForm.register("title", { required: true })}
            />
            <FormControl fullWidth size="small">
              <InputLabel>{t("Tipe Pengingat")}</InputLabel>
              <Select label={t("Tipe Pengingat")} {...followUpForm.register("followUpType")}>
                <MenuItem value="SALES_LEAD">{t("Penjualan (Sales Lead)")}</MenuItem>
                <MenuItem value="PAYMENT_REMINDER">{t("Pengingat Pembayaran Angsuran")}</MenuItem>
                <MenuItem value="SERVICE_CHECKIN">{t("Purna Jual & Servis")}</MenuItem>
                <MenuItem value="GENERAL">{t("Umum")}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t("Waktu Tindak Lanjut (ISO/Tanggal)")}
              type="datetime-local"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              {...followUpForm.register("scheduledAt", { required: true })}
            />
            <TextField
              label={t("Catatan Internal")}
              fullWidth
              multiline
              rows={2}
              {...followUpForm.register("notes")}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowFollowUpDialog(false)}>{t("Batal")}</Button>
            <Button type="submit" variant="contained">
              {t("Jadwalkan")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 4: STORE CREDIT GRANT / REDEEM (J.5) */}
      <Dialog open={showStoreCreditDialog} onClose={() => setShowStoreCreditDialog(false)} fullWidth maxWidth="sm">
        <form
          onSubmit={storeCreditForm.handleSubmit((vals) => {
            const payload = {
              amount: Number(vals.amount),
              reason: vals.reason,
            };
            if (storeCreditMode === "GRANT") {
              grantStoreCredit.mutate(payload);
            } else {
              redeemStoreCredit.mutate(payload);
            }
            storeCreditForm.reset();
            setShowStoreCreditDialog(false);
          })}
        >
          <DialogTitle>
            {storeCreditMode === "GRANT"
              ? t("Tambah Saldo Store Credit (Grant)")
              : t("Gunakan Saldo Store Credit (Redeem)")}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label={t("Nominal (Rp)")}
              type="number"
              fullWidth
              required
              {...storeCreditForm.register("amount", { required: true, valueAsNumber: true })}
            />
            <TextField
              label={t("Alasan / Referensi")}
              fullWidth
              required
              placeholder={
                storeCreditMode === "GRANT"
                  ? t("Contoh: Kompensasi keterlambatan kirim / Uang muka")
                  : t("Potongan pesanan penjualan")
              }
              {...storeCreditForm.register("reason", { required: true })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowStoreCreditDialog(false)}>{t("Batal")}</Button>
            <Button type="submit" variant="contained">
              {t("Konfirmasi Mutasi Saldo")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 5: RESOLVE PTP (KEPT / BROKEN) */}
      <Dialog open={!!resolutionPtpId} onClose={() => setResolutionPtpId(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {t("Resolusi Janji Bayar (")}
          {resolutionStatus === "KEPT" ? t("Ditepati") : t("Ingkar / Macet")})
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label={t("Catatan Hasil Penagihan")}
            fullWidth
            multiline
            rows={2}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder={t("Kolektor menerima pembayaran tunai via kasir...")}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolutionPtpId(null)}>{t("Batal")}</Button>
          <Button
            variant="contained"
            color={resolutionStatus === "KEPT" ? "success" : "error"}
            onClick={() => {
              if (resolutionPtpId) {
                updatePtpStatus.mutate({
                  ptpId: resolutionPtpId,
                  status: resolutionStatus,
                  notes: resolutionNotes,
                });
                setResolutionPtpId(null);
              }
            }}
          >
            {t("Simpan Resolusi")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG 6: ADD TAG */}
      <Dialog open={showTagDialog} onClose={() => setShowTagDialog(false)}>
        <DialogTitle>{t("Tambah Demographic / Behavioral Tag")}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label={t("Nama Tag")}
            fullWidth
            size="small"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder={t("Contoh: VIP_CASH, PROMO_HUNTER, REPEAT_BUYER")}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTagDialog(false)}>{t("Batal")}</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (newTagName.trim()) {
                addTag.mutate({ tagName: newTagName.trim() });
                setNewTagName("");
                setShowTagDialog(false);
              }
            }}
          >
            {t("Simpan Tag")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
