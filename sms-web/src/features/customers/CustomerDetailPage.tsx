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

function formatRupiah(amount: number | undefined | null): string {
  if (amount == null) return "Rp 0";
  return "Rp " + amount.toLocaleString("id-ID");
}

function getSegmentChipProps(segment: string | undefined) {
  switch (segment) {
    case "VIP_CASH":
      return { label: "VIP Cash Buyer", color: "warning" as const, variant: "filled" as const };
    case "STAR_CREDIT":
      return { label: "Star Credit Customer", color: "secondary" as const, variant: "filled" as const };
    case "HIGH_DELINQUENCY_RISK":
      return { label: "High Delinquency Risk", color: "error" as const, variant: "filled" as const };
    default:
      return { label: "Standard Account", color: "default" as const, variant: "outlined" as const };
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
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#0f172a", color: "#f8fafc" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "#2563eb", fontSize: "1.75rem", fontWeight: 700 }}>
              {customer.fullName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {customer.fullName}
                </Typography>
                <Chip {...getSegmentChipProps(summary?.segment)} size="small" />
                <Chip
                  icon={<StarIcon sx={{ "&&": { color: "#facc15" } }} />}
                  label={`Credit Score: ${summary?.creditScoreGrade ?? "B"} (${summary?.creditScorePoints ?? 80}/100)`}
                  color={getCreditGradeColor(summary?.creditScoreGrade)}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                NIK: <strong>{customer.nik ?? "—"}</strong> • Telp: <strong>{customer.primaryPhone ?? "—"}</strong> • Email: {customer.primaryEmail ?? "—"}
              </Typography>
              {customer.motherMaidenName && (
                <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                  Nama Ibu Kandung: •••••••• (Terverifikasi PDP) • Lahir: {customer.birthPlace ?? "—"}, {customer.birthDate ?? "—"}
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
              sx={{ bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
            >
              Log Interaksi
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<MonetizationOnIcon />}
              onClick={() => setShowPtpDialog(true)}
              sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}
            >
              Janji Bayar (PTP)
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<EventNoteIcon />}
              onClick={() => setShowFollowUpDialog(true)}
              sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" } }}
            >
              Pengingat
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LocalOfferIcon />}
              onClick={() => {
                setStoreCreditMode("GRANT");
                setShowStoreCreditDialog(true);
              }}
              sx={{ color: "#38bdf8", borderColor: "#38bdf8", "&:hover": { borderColor: "#7dd3fc" } }}
            >
              Store Credit
            </Button>
          </Box>
        </Box>

        {/* Demographic & Behavioral Tags Strip */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
            Tags:
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
              label="Tambah Tag"
              size="small"
              clickable
              onClick={() => setShowTagDialog(true)}
              variant="outlined"
              sx={{ color: "#94a3b8", borderColor: "#475569" }}
            />
          )}
        </Box>

        {/* 4 KPI Summary Cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, display: "block" }}>
                CUSTOMER LIFETIME VALUE (CLV)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#38bdf8" }}>
                {formatRupiah(summary?.clvAmount)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Total Transaksi: {summary?.totalOrdersCount ?? 0} Pesanan
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, display: "block" }}>
                SALDO STORE CREDIT (UANG MUKA/REFUND)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#34d399" }}>
                {formatRupiah(summary?.storeCreditBalance)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Voucher Aktif: {summary?.activeVouchersCount ?? 0} Kupon
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, display: "block" }}>
                JANJI BAYAR (PTP) PENDING
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: (summary?.pendingPtpCount ?? 0) > 0 ? "#f43f5e" : "#e2e8f0" }}>
                {summary?.pendingPtpCount ?? 0} Komitmen
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Target Penagihan Aktif
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, display: "block" }}>
                PENGINGAT & TINDAK LANJUT
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: (summary?.pendingFollowUpsCount ?? 0) > 0 ? "#fbbf24" : "#e2e8f0" }}>
                {summary?.pendingFollowUpsCount ?? 0} Jadwal
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Sales Lead & Payment Alert
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Timeline 360 (J.1)" />
          <Tab icon={<CallIcon />} iconPosition="start" label={`Omnichannel Log (${interactions?.length ?? 0}) (J.6)`} />
          <Tab icon={<MonetizationOnIcon />} iconPosition="start" label={`Janji Bayar (${ptps?.length ?? 0}) (J.3)`} />
          <Tab icon={<EventNoteIcon />} iconPosition="start" label={`Pengingat (${followUps?.length ?? 0}) (J.7)`} />
          <Tab icon={<LocalOfferIcon />} iconPosition="start" label="Store Credit & Voucher (J.5)" />
          <Tab icon={<PersonIcon />} iconPosition="start" label="Kontak & Alamat" />
          <Tab icon={<AssignmentTurnedInIcon />} iconPosition="start" label="Dokumen" />
        </Tabs>
      </Box>

      {/* TAB 0: UNIFIED 360 TIMELINE (J.1) */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Riwayat Aktivitas 360 Terpadu (Unified Chronological Feed)
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                label="Semua"
                clickable
                color={timelineFilter === "ALL" ? "primary" : "default"}
                onClick={() => setTimelineFilter("ALL")}
                size="small"
              />
              <Chip
                label="Pesanan & Surat Jalan"
                clickable
                color={timelineFilter === "ORDERS" ? "primary" : "default"}
                onClick={() => setTimelineFilter("ORDERS")}
                size="small"
              />
              <Chip
                label="Pembayaran & Keuangan"
                clickable
                color={timelineFilter === "PAYMENTS" ? "primary" : "default"}
                onClick={() => setTimelineFilter("PAYMENTS")}
                size="small"
              />
              <Chip
                label="CRM & Komunikasi"
                clickable
                color={timelineFilter === "CRM" ? "primary" : "default"}
                onClick={() => setTimelineFilter("CRM")}
                size="small"
              />
            </Box>
          </Box>

          {timelineEvents.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
              Belum ada riwayat aktivitas yang tercatat untuk filter ini.
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
                            <Chip label={evt.status} size="small" variant="outlined" />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                          {evt.description}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                        {new Date(evt.timestamp).toLocaleString("id-ID", {
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
              Log Komunikasi Omnichannel (WhatsApp, Telepon, SMS, Kunjungan)
            </Typography>
            <Button
              variant="contained"
              startIcon={<CallIcon />}
              onClick={() => setShowInteractionDialog(true)}
            >
              Catat Interaksi Baru
            </Button>
          </Box>

          <Grid container spacing={2}>
            {(interactions ?? []).map((item) => (
              <Grid size={{ xs: 12 }} key={item.id}>
                <Paper sx={{ p: 2, display: "flex", gap: 2, alignItems: "flex-start", borderRadius: 2 }}>
                  <Avatar sx={{ bgcolor: "#f1f5f9" }}>
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
                          label={`Hasil: ${item.outcome}`}
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
                        {new Date(item.createdAt).toLocaleString("id-ID")}
                      </Typography>
                    </Box>
                    {item.details && (
                      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                        {item.details}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#64748b" }}>
                      Dicatat oleh: <strong>{item.recordedByName}</strong>
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
            {(interactions ?? []).length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                  Belum ada log interaksi telepon, WhatsApp, atau kunjungan langsung.
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
              Daftar Janji Bayar (Promise-to-Pay / PTP)
            </Typography>
            <Button
              variant="contained"
              startIcon={<MonetizationOnIcon />}
              onClick={() => setShowPtpDialog(true)}
              color="success"
            >
              Catat Janji Bayar Baru
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
                          Tanggal Dijanjikan: {ptp.promisedDate}
                        </Typography>
                        {ptp.salesOrderNumber && (
                          <Typography variant="caption" color="text.secondary">
                            Ref SO: {ptp.salesOrderNumber}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={ptp.status}
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
                      <Typography variant="body2" sx={{ mt: 1, bgcolor: "#f8fafc", p: 1, borderRadius: 1 }}>
                        {ptp.notes}
                      </Typography>
                    )}

                    <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        Petugas: {ptp.recordedByName}
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
                            Kept (Ditepati)
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
                            Broken (Ingkar)
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
                  Belum ada janji bayar yang dicatat untuk pelanggan ini.
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
              Jadwal Pengingat & Tindak Lanjut (Follow-Up Scheduler)
            </Typography>
            <Button
              variant="contained"
              startIcon={<EventNoteIcon />}
              onClick={() => setShowFollowUpDialog(true)}
            >
              Jadwalkan Pengingat Baru
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
                        label={item.status}
                        color={item.status === "COMPLETED" ? "success" : item.status === "CANCELLED" ? "default" : "warning"}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      Jadwal: {new Date(item.scheduledAt).toLocaleString("id-ID")}
                    </Typography>
                    {item.notes && (
                      <Typography variant="body2" sx={{ mt: 1, bgcolor: "#f8fafc", p: 1, borderRadius: 1 }}>
                        {item.notes}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        PIC: {item.assignedEmployeeName}
                      </Typography>
                      {canManage && item.status === "SCHEDULED" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => completeFollowUp.mutate({ followUpId: item.id, notes: "Follow up berhasil dijalankan" })}
                          >
                            Selesai
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => cancelFollowUp.mutate(item.id)}
                          >
                            Batal
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
                  Belum ada jadwal pengingat untuk pelanggan ini.
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
                Store Credit Ledger & Kupon Promo (Money Management Ritel)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Saldo kredit toko resmi untuk penyesuaian diskon, uang muka, dan garansi (Bukan aktivitas perbankan).
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
                  Tambah Saldo (Grant)
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    setStoreCreditMode("REDEEM");
                    setShowStoreCreditDialog(true);
                  }}
                >
                  Gunakan Saldo (Redeem)
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={3}>
            {/* Store credit ledger table */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Buku Catatan Saldo Kredit Toko (Store Credit Ledger)
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
                              Saldo Akhir: {formatRupiah(entry.balanceAfter)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="span" sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {entry.notes ?? "Transaksi Store Credit"} • {entry.referenceType ?? "MANUAL"}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {new Date(entry.createdAt).toLocaleDateString("id-ID")}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {(storeCreditEntries ?? []).length === 0 && (
                    <Typography variant="body2" sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                      Belum ada mutasi store credit.
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Vouchers & Promotional coupons */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Kupon Promo & Gift Voucher Pelanggan
                </Typography>
                {(vouchers ?? []).map((v) => (
                  <Card key={v.id} sx={{ mb: 1.5, border: "1px dashed #0284c7", bgcolor: "#f0f9ff" }}>
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0369a1" }}>
                          {v.code}
                        </Typography>
                        <Tooltip title="Salin Kode Voucher">
                          <IconButton size="small" onClick={() => navigator.clipboard.writeText(v.code)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {v.title}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                        Diskon: {v.voucherType === "PERCENTAGE" ? `${v.discountValue}%` : formatRupiah(v.discountValue)}
                        {v.minOrderAmount ? ` • Min Belanja: ${formatRupiah(v.minOrderAmount)}` : ""}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", color: "#0369a1", mt: 0.5 }}>
                        Berlaku: {v.validFrom} s/d {v.validUntil} • Kuota: {v.timesUsed}/{v.maxUses}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
                {(vouchers ?? []).length === 0 && (
                  <Typography variant="body2" sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                    Tidak ada voucher khusus yang ditautkan ke akun ini.
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
              Contacts
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
                        Remove
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
                    label="Type"
                    size="small"
                    {...contactForm.register("contactType")}
                  >
                    <MenuItem value="PHONE">Phone</MenuItem>
                    <MenuItem value="EMAIL">Email</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </TextField>
                  <TextField
                    label="Label"
                    size="small"
                    {...contactForm.register("label")}
                  />
                  <TextField
                    label="Value"
                    size="small"
                    required
                    {...contactForm.register("value", { required: true })}
                  />
                  <Button type="submit" variant="contained" size="small">
                    Add Contact
                  </Button>
                </Box>
              ) : (
                <Button size="small" onClick={() => setShowContactForm(true)}>
                  Add Contact
                </Button>
              ))}
          </Paper>

          <Paper sx={{ p: 2, width: 360 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Addresses
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
                            Set Primary
                          </Button>
                        )}
                        <Button
                          size="small"
                          onClick={() => deactivateAddress.mutate(address.id)}
                        >
                          Remove
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
                          <Chip label="Primary" size="small" color="primary" />
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
                    label="Label"
                    size="small"
                    {...addressForm.register("label")}
                  />
                  <TextField
                    label="Address"
                    size="small"
                    multiline
                    rows={2}
                    required
                    {...addressForm.register("addressLine", { required: true })}
                  />
                  <FormControlLabel
                    control={<Checkbox {...addressForm.register("primary")} />}
                    label="Set as primary"
                  />
                  <Button type="submit" variant="contained" size="small">
                    Add Address
                  </Button>
                </Box>
              ) : (
                <Button size="small" onClick={() => setShowAddressForm(true)}>
                  Add Address
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
          <DialogTitle>Catat Interaksi Pelanggan (Omnichannel)</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Saluran (Channel)</InputLabel>
                <Select label="Saluran (Channel)" {...interactionForm.register("channel")}>
                  <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                  <MenuItem value="PHONE_CALL">Telepon Resmi</MenuItem>
                  <MenuItem value="IN_PERSON">Kunjungan Showroom</MenuItem>
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Arah (Direction)</InputLabel>
                <Select label="Arah (Direction)" {...interactionForm.register("direction")}>
                  <MenuItem value="OUTBOUND">Outbound (Toko Menghubungi)</MenuItem>
                  <MenuItem value="INBOUND">Inbound (Pelanggan Menghubungi)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Ringkasan Percakapan"
              fullWidth
              required
              size="small"
              placeholder="Contoh: Konfirmasi ketersediaan stok mesin cuci"
              {...interactionForm.register("summary", { required: true })}
            />

            <TextField
              label="Rincian Lengkap / Catatan"
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Pelanggan menanyakan opsi cicilan 6 bulan..."
              {...interactionForm.register("details")}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Hasil Interaksi (Outcome)</InputLabel>
              <Select label="Hasil Interaksi (Outcome)" {...interactionForm.register("outcome")}>
                <MenuItem value="POSITIVE">Positif (Tertarik / Bersedia Membayar)</MenuItem>
                <MenuItem value="NEUTRAL">Netral (Menimbang / Minta Waktu)</MenuItem>
                <MenuItem value="NEGATIVE">Negatif (Menolak / Komplain)</MenuItem>
                <MenuItem value="NO_ANSWER">Tidak Diangkat / Tidak Aktif</MenuItem>
                <MenuItem value="FOLLOW_UP_REQUIRED">Perlu Tindak Lanjut</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowInteractionDialog(false)}>Batal</Button>
            <Button type="submit" variant="contained">
              Simpan Interaksi
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
          <DialogTitle>Catat Janji Bayar (Promise-to-Pay)</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nominal yang Dijanjikan (Rp)"
              type="number"
              fullWidth
              required
              {...ptpForm.register("promisedAmount", { required: true, valueAsNumber: true })}
            />
            <TextField
              label="Tanggal Janji Bayar"
              type="date"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              {...ptpForm.register("promisedDate", { required: true })}
            />
            <TextField
              label="Catatan Komitmen Debitur"
              fullWidth
              multiline
              rows={2}
              placeholder="Pelanggan berjanji melunasi setelah gajian tanggal 5..."
              {...ptpForm.register("notes")}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPtpDialog(false)}>Batal</Button>
            <Button type="submit" variant="contained" color="success">
              Simpan Janji Bayar
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
          <DialogTitle>Jadwalkan Pengingat Tindak Lanjut</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Judul Pengingat"
              fullWidth
              required
              placeholder="Contoh: Telepon penawaran upgrade kulkas dua pintu"
              {...followUpForm.register("title", { required: true })}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Tipe Pengingat</InputLabel>
              <Select label="Tipe Pengingat" {...followUpForm.register("followUpType")}>
                <MenuItem value="SALES_LEAD">Penjualan (Sales Lead)</MenuItem>
                <MenuItem value="PAYMENT_REMINDER">Pengingat Pembayaran Angsuran</MenuItem>
                <MenuItem value="SERVICE_CHECKIN">Purna Jual & Servis</MenuItem>
                <MenuItem value="GENERAL">Umum</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Waktu Tindak Lanjut (ISO/Tanggal)"
              type="datetime-local"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
              {...followUpForm.register("scheduledAt", { required: true })}
            />
            <TextField
              label="Catatan Internal"
              fullWidth
              multiline
              rows={2}
              {...followUpForm.register("notes")}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowFollowUpDialog(false)}>Batal</Button>
            <Button type="submit" variant="contained">
              Jadwalkan
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
            {storeCreditMode === "GRANT" ? "Tambah Saldo Store Credit (Grant)" : "Gunakan Saldo Store Credit (Redeem)"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Nominal (Rp)"
              type="number"
              fullWidth
              required
              {...storeCreditForm.register("amount", { required: true, valueAsNumber: true })}
            />
            <TextField
              label="Alasan / Referensi"
              fullWidth
              required
              placeholder={storeCreditMode === "GRANT" ? "Contoh: Kompensasi keterlambatan kirim / Uang muka" : "Potongan pesanan penjualan"}
              {...storeCreditForm.register("reason", { required: true })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowStoreCreditDialog(false)}>Batal</Button>
            <Button type="submit" variant="contained">
              Konfirmasi Mutasi Saldo
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIALOG 5: RESOLVE PTP (KEPT / BROKEN) */}
      <Dialog open={!!resolutionPtpId} onClose={() => setResolutionPtpId(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          Resolusi Janji Bayar ({resolutionStatus === "KEPT" ? "Ditepati" : "Ingkar / Macet"})
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Catatan Hasil Penagihan"
            fullWidth
            multiline
            rows={2}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Kolektor menerima pembayaran tunai via kasir..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolutionPtpId(null)}>Batal</Button>
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
            Simpan Resolusi
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG 6: ADD TAG */}
      <Dialog open={showTagDialog} onClose={() => setShowTagDialog(false)}>
        <DialogTitle>Tambah Demographic / Behavioral Tag</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Nama Tag"
            fullWidth
            size="small"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Contoh: VIP_CASH, PROMO_HUNTER, REPEAT_BUYER"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTagDialog(false)}>Batal</Button>
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
            Simpan Tag
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
