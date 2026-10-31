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
import {
  useComponents,
  useProductSearch,
  useVariants,
} from "../products/hooks";
import {
  useAddPurchaseOrderItem,
  useCancelPurchaseOrder,
  useIssuePurchaseOrder,
  usePurchaseOrder,
  usePurchaseOrderItems,
  useRemovePurchaseOrderItem,
  useRevisePurchaseOrder,
  useSubmitPurchaseOrder,
} from "./hooks";
import ReceivingPanel from "./ReceivingPanel";
import SupplierPaymentPanel from "./SupplierPaymentPanel";
import { t , formatNumber, localizeDisplayCode} from "../../lib/locale";

export default function PurchaseOrderDetailPage() {
  const { id = "" } = useParams();
  const { data: po } = usePurchaseOrder(id);
  const { data: items } = usePurchaseOrderItems(id);
  const canManage = useAuthStore((s) => s.hasPermission("PROCUREMENT_MANAGE"));
  const { enqueueSnackbar } = useSnackbar();

  const addItem = useAddPurchaseOrderItem(id);
  const removeItem = useRemovePurchaseOrderItem(id);
  const submit = useSubmitPurchaseOrder(id);
  const revise = useRevisePurchaseOrder(id);
  const issue = useIssuePurchaseOrder(id);
  const cancel = useCancelPurchaseOrder(id);

  const [productQuery, setProductQuery] = useState("");
  const { data: products } = useProductSearch(productQuery);
  const [productId, setProductId] = useState("");
  const { data: variants } = useVariants(productId || null);
  const { data: components } = useComponents(productId || null);
  const [kind, setKind] = useState<"VARIANT" | "COMPONENT">("VARIANT");
  const [subjectId, setSubjectId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState("");
  const [workflowCode, setWorkflowCode] = useState("PURCHASE_ORDER");

  if (!po) return null;

  const isDraft = po.status === "DRAFT";
  const total = (items ?? []).reduce((sum, i) => sum + i.lineTotal, 0);
  const notify = (message: string) => ({
    onSuccess: () => enqueueSnackbar(message, { variant: "success" }),
    onError: () =>
      enqueueSnackbar(t("Action not allowed in the current state"), {
        variant: "error",
      }),
  });

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, flexWrap: "wrap" }}>
        <Typography variant="h5">{po.number ?? "Draft Purchase Order"}</Typography>
        <Chip
          label={localizeDisplayCode(po.status)}
          color={
            po.status === "ISSUED"
              ? "success"
              : po.status === "REJECTED" || po.status === "CANCELLED"
                ? "error"
                : "default"
          }
        />
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t("Supplier:")} {po.supplierName}
        {po.notes ? ` · ${po.notes}` : ""}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t("Items — total")} {formatNumber(total)}
        </Typography>
        <List dense>
          {(items ?? []).map((item) => (
            <ListItem
              key={item.id}
              secondaryAction={
                canManage &&
                isDraft && (
                  <Button size="small" onClick={() => removeItem.mutate(item.id)}>
                    {t("Remove")}
                  </Button>
                )
              }
            >
              <ListItemText
                primary={`${item.itemName} x${item.quantity} @ ${item.unitCost}`}
                secondary={`${item.productComponentId ? "Component" : "Unit"} · line ${item.lineTotal}`}
              />
            </ListItem>
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
                setSubjectId("");
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
              label={t("Kind")}
              size="small"
              sx={{ width: 140 }}
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as "VARIANT" | "COMPONENT");
                setSubjectId("");
              }}
            >
              <MenuItem value="VARIANT">{t("Unit (variant)")}</MenuItem>
              <MenuItem value="COMPONENT">{t("Spare component")}</MenuItem>
            </TextField>
            <TextField
              select
              label={kind === "VARIANT" ? t("Variant") : t("Component")}
              size="small"
              sx={{ width: 200 }}
              value={subjectId}
              disabled={!productId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {kind === "VARIANT"
                ? (variants ?? []).map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.variantName}
                    </MenuItem>
                  ))
                : (components ?? []).map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
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
              label={t("Unit cost")}
              size="small"
              type="number"
              sx={{ width: 140 }}
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!subjectId || !unitCost || quantity < 1}
              onClick={() =>
                addItem.mutate(
                  {
                    productVariantId: kind === "VARIANT" ? subjectId : undefined,
                    productComponentId:
                      kind === "COMPONENT" ? subjectId : undefined,
                    quantity,
                    unitCost: Number(unitCost),
                  },
                  { onSuccess: () => setUnitCost("") },
                )
              }
            >
              {t("Add Item")}
            </Button>
          </Box>
        )}
      </Paper>

      {canManage && (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {isDraft && (
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
                  submit.mutate(workflowCode, notify("Submitted for approval"))
                }
              >
                {t("Submit for Approval")}
              </Button>
            </>
          )}
          {po.status === "PENDING_APPROVAL" && (
            <Button
              variant="contained"
              onClick={() => issue.mutate(undefined, notify("PO issued"))}
            >
              {t("Issue (after approval)")}
            </Button>
          )}
          {po.status === "REJECTED" && (
            <Button
              variant="contained"
              onClick={() =>
                revise.mutate(undefined, notify("PO moved to draft for revision"))
              }
            >
              {t("Revise")}
            </Button>
          )}
          {po.status !== "CANCELLED" && (
            <Button
              color="error"
              onClick={() => {
                const reason = window.prompt(t("Cancellation reason?"));
                if (reason !== null) {
                  cancel.mutate(
                    reason || undefined,
                    notify("Purchase order cancelled"),
                  );
                }
              }}
            >
              {t("Cancel")}</Button>
          )}
        </Box>
      )}

      {/* Receiving — only visible once the PO is issued */}
      {po.status === "ISSUED" && (
        <Box sx={{ mt: 3 }}>
          <ReceivingPanel
            purchaseOrderId={po.id}
            poItems={items ?? []}
            isIssued
          />
        </Box>
      )}

      {/* Supplier payments — visible on any non-draft PO */}
      {po.status !== "DRAFT" && (
        <Box sx={{ mt: 2 }}>
          <SupplierPaymentPanel
            purchaseOrderId={po.id}
            poCancelled={po.status === "CANCELLED"}
            poTotal={total}
          />
        </Box>
      )}
    </Box>
  );
}
