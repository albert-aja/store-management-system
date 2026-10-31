import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import AllocationPanel from "../inventory/AllocationPanel";
import DeliveryOrderPanel from "../delivery/DeliveryOrderPanel";
import ReceivableSalesOrderPanel from "../finance/ReceivableSalesOrderPanel";
import { usePaymentPlans, useStorePrices } from "../pricing/hooks";
import { useProductSearch, useVariants } from "../products/hooks";
import PrintIcon from "@mui/icons-material/Print";
import SurveyPanel from "../surveys/SurveyPanel";
import {
  useAddItem,
  useCancelSalesOrder,
  useConfirmSalesOrder,
  useReleaseSalesOrder,
  useReviseSalesOrder,
  useRemoveItem,
  useSalesOrder,
  useSalesOrderItems,
  useSubmitForPriceApproval,
} from "./hooks";
import { t , localizeDisplayCode} from "../../lib/locale";

export default function SalesOrderDetailPage() {
  const { id = "" } = useParams();
  const { data: so } = useSalesOrder(id);
  const { data: items } = useSalesOrderItems(id);
  const canManage = useAuthStore((s) => s.hasPermission("SALES_ORDER_MANAGE"));
  const { enqueueSnackbar } = useSnackbar();

  const addItem = useAddItem(id);
  const removeItem = useRemoveItem(id);
  const submitApproval = useSubmitForPriceApproval(id);
  const revise = useReviseSalesOrder(id);
  const release = useReleaseSalesOrder(id);
  const cancel = useCancelSalesOrder(id);
  const confirm = useConfirmSalesOrder(id);

  const [productQuery, setProductQuery] = useState("");
  const { data: products } = useProductSearch(productQuery);
  const [productId, setProductId] = useState("");
  const { data: variants } = useVariants(productId || null);
  const [variantId, setVariantId] = useState("");
  const { data: prices } = useStorePrices(so?.storeId ?? null);
  const price = (prices ?? []).find((p) => p.productVariantId === variantId);
  const { data: plans } = usePaymentPlans(so?.storeId ?? "", price?.id ?? null);
  const [termMonths, setTermMonths] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [finalPrice, setFinalPrice] = useState("");
  const [workflowCode, setWorkflowCode] = useState("PRICE_NEGOTIATION");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  if (!so) return null;

  const isDraft = so.status === "DRAFT";
  const currentUnitPrice =
    termMonths === 0
      ? price?.cashPrice
      : (plans ?? []).find((p) => p.termMonths === termMonths)?.totalPrice;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography variant="h5">{so.number ?? "Draft Sales Order"}</Typography>
          <Chip
            label={localizeDisplayCode(so.status)}
            color={
              so.status === "RELEASED" || so.status === "CONFIRMED"
                ? "success"
                : so.status === "REJECTED" || so.status === "CANCELLED"
                  ? "error"
                  : "default"
            }
          />
          {so.requiresPriceApproval && (
            <Chip label={t("Negotiated price")} color="warning" size="small" />
          )}
        </Box>
        {(so.status === "RELEASED" || so.status === "CONFIRMED") && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={() =>
              window.open(`/api/documents/print/credit-agreement/${so.id}`, "_blank")
            }
          >
            {t("Print Credit Agreement")}
          </Button>
        )}
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t("Customer:")} {so.customerName} {t("· Delivery:")}{" "}
        {so.deliveryAddressSnapshot ?? "—"}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t("Items")}
        </Typography>
        <List dense>
          {(items ?? []).map((item) => (
            <Box key={item.id}>
              <ListItem
                secondaryAction={
                  <>
                    {(so.status === "RELEASED" ||
                      so.status === "CONFIRMED") && (
                      <Button
                        size="small"
                        onClick={() =>
                          setExpandedItemId(
                            expandedItemId === item.id ? null : item.id,
                          )
                        }
                      >
                        {expandedItemId === item.id
                          ? t("Hide Allocation")
                          : t("Allocation")}
                      </Button>
                    )}
                    {canManage && isDraft && (
                      <Button
                        size="small"
                        onClick={() => removeItem.mutate(item.id)}
                      >
                        {t("Remove")}
                      </Button>
                    )}
                  </>
                }
              >
                <ListItemText
                  primary={`${item.variantName} x${item.quantity} — ${item.paymentTermMonths === 0 ? "Cash" : `${item.paymentTermMonths}mo`}: ${item.finalPrice}`}
                  secondary={
                    item.finalPrice !== item.referencePrice
                      ? `Reference price: ${item.referencePrice}`
                      : undefined
                  }
                />
              </ListItem>
              {expandedItemId === item.id && (
                <AllocationPanel
                  salesOrderItemId={item.id}
                  storeId={so.storeId}
                  variantId={item.productVariantId}
                />
              )}
            </Box>
          ))}
        </List>

        {canManage && isDraft && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
              mt: 2,
            }}
          >
            <TextField
              label={t("Search product")}
              size="small"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
            />
            <TextField
              select
              label={t("Product")}
              size="small"
              sx={{ width: 200 }}
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setVariantId("");
              }}
            >
              {(products ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("Variant")}
              size="small"
              sx={{ width: 200 }}
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              disabled={!productId}
            >
              {(variants ?? []).map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.variantName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("Term")}
              size="small"
              sx={{ width: 140 }}
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))}
              disabled={!variantId}
            >
              <MenuItem value={0}>{t("Cash")}</MenuItem>
              {(plans ?? []).map((p) => (
                <MenuItem key={p.id} value={p.termMonths}>
                  {p.termMonths} {t("months")}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("Qty")}
              size="small"
              type="number"
              sx={{ width: 80 }}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <TextField
              label={t("Final price")}
              size="small"
              type="number"
              sx={{ width: 140 }}
              value={finalPrice}
              placeholder={currentUnitPrice?.toString() ?? ""}
              onChange={(e) => setFinalPrice(e.target.value)}
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                if (!variantId) return;
                addItem.mutate(
                  {
                    productVariantId: variantId,
                    quantity,
                    paymentTermMonths: termMonths,
                    finalPrice: Number(finalPrice || currentUnitPrice || 0),
                  },
                  { onSuccess: () => setFinalPrice("") },
                );
              }}
            >
              {t("Add Item")}
            </Button>
          </Box>
        )}
      </Paper>

      {(so.status === "RELEASED" ||
        so.status === "SURVEY_REJECTED" ||
        so.status === "CONFIRMED") && (
        <Paper sx={{ p: 2, mb: 3, maxWidth: 420 }}>
          <SurveyPanel salesOrderId={id} />
        </Paper>
      )}

      {canManage && (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {isDraft && so.requiresPriceApproval && (
            <>
              <TextField
                label={t("Approval workflow code")}
                size="small"
                value={workflowCode}
                onChange={(e) => setWorkflowCode(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={() =>
                  submitApproval.mutate(workflowCode, {
                    onSuccess: () =>
                      enqueueSnackbar(t("Submitted for price approval"), {
                        variant: "success",
                      }),
                  })
                }
              >
                {t("Submit for Price Approval")}
              </Button>
            </>
          )}
          {isDraft && !so.requiresPriceApproval && (
            <Button
              variant="contained"
              onClick={() =>
                release.mutate(undefined, {
                  onSuccess: () =>
                    enqueueSnackbar(t("Sales Order released"), {
                      variant: "success",
                    }),
                })
              }
            >
              {t("Release")}
            </Button>
          )}
          {so.status === "PENDING_PRICE_APPROVAL" && (
            <Button
              variant="contained"
              onClick={() =>
                release.mutate(undefined, {
                  onSuccess: () =>
                    enqueueSnackbar(t("Sales Order released"), {
                      variant: "success",
                    }),
                })
              }
            >
              {t("Release (after approval)")}
            </Button>
          )}
          {so.status === "RELEASED" && (
            <Button
              variant="contained"
              onClick={() =>
                confirm.mutate(true, {
                  onSuccess: () =>
                    enqueueSnackbar(t("Sales Order confirmed"), {
                      variant: "success",
                    }),
                  onError: () =>
                    enqueueSnackbar(
                      t("Confirmation blocked (survey may still be pending)"),
                      { variant: "error" },
                    ),
                })
              }
            >
              {t("Confirm (DP received)")}
            </Button>
          )}
          {so.status === "REJECTED" && (
            <Button variant="contained" onClick={() => revise.mutate()}>
              {t("Revise")}
            </Button>
          )}
          {(isDraft || so.status === "RELEASED") && (
            <Button
              color="error"
              onClick={() =>
                cancel.mutate(
                  window.prompt(t("Cancellation reason?")) ?? undefined,
                )
              }
            >
              {t("Cancel")}</Button>
          )}
        </Box>
      )}

      {/* Deliveries & Outbound — available once the SO is released or confirmed */}
      {(so.status === "RELEASED" || so.status === "CONFIRMED") && (
        <DeliveryOrderPanel
          salesOrderId={so.id}
          storeId={so.storeId}
          deliveryAddressSnapshot={so.deliveryAddressSnapshot}
          items={items ?? []}
          isReleasedOrConfirmed={so.status === "RELEASED" || so.status === "CONFIRMED"}
        />
      )}

      {/* Credit Accounts & Receivables — available once the SO is released or confirmed */}
      <ReceivableSalesOrderPanel
        salesOrderId={so.id}
        isConfirmedOrReleased={so.status === "RELEASED" || so.status === "CONFIRMED"}
      />
    </Box>
  );
}
