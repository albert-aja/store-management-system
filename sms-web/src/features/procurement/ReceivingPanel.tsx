import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSnackbar } from "notistack";
import type { PurchaseOrderItem } from "./types";
import {
  useCreatePurchaseReceipt,
  useFinalizeReceipt,
  usePurchaseReceiptItems,
  usePurchaseReceipts,
  useUpsertReceiptItem,
} from "./hooks";
import { t , formatDate, localizeDisplayCode} from "../../lib/locale";

interface ReceivingPanelProps {
  purchaseOrderId: string;
  poItems: PurchaseOrderItem[];
  isIssued: boolean;
}

interface ItemEntry {
  accepted: number;
  rejected: number;
  rejectedReason: string;
}

export default function ReceivingPanel({
  purchaseOrderId,
  poItems,
  isIssued,
}: ReceivingPanelProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: receipts = [] } = usePurchaseReceipts(purchaseOrderId);
  const createReceipt = useCreatePurchaseReceipt(purchaseOrderId);

  const notify = (msg: string) => ({
    onSuccess: () => enqueueSnackbar(msg, { variant: "success" }),
    onError: () =>
      enqueueSnackbar(t("Action failed — check business rules"), {
        variant: "error",
      }),
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}
      >
        <Typography variant="subtitle1">
          {t("Receiving (")}{receipts.length}{" "}
          {t(receipts.length === 1 ? "document" : "documents")})
        </Typography>
        {isIssued && (
          <Button
            id="btn-create-receipt"
            variant="outlined"
            size="small"
            onClick={() =>
              createReceipt.mutate(
                { purchaseOrderId },
                notify("Receiving document created"),
              )
            }
          >
            {t("+ New Receipt")}
          </Button>
        )}
      </Box>

      {receipts.length === 0 && (
        <Typography color="text.secondary" variant="body2">
          {t("No receiving documents yet.")}
        </Typography>
      )}

      {receipts.map((receipt) => (
        <ReceiptCard
          key={receipt.id}
          receiptId={receipt.id}
          purchaseOrderId={purchaseOrderId}
          status={receipt.status}
          receivedAt={receipt.receivedAt}
          poItems={poItems}
          notify={notify}
        />
      ))}
    </Paper>
  );
}

function ReceiptCard({
  receiptId,
  purchaseOrderId,
  status,
  receivedAt,
  poItems,
  notify,
}: {
  receiptId: string;
  purchaseOrderId: string;
  status: string;
  receivedAt: string | null;
  poItems: PurchaseOrderItem[];
  notify: (msg: string) => { onSuccess: () => void; onError: () => void };
}) {
  const { data: items = [] } = usePurchaseReceiptItems(receiptId);
  const upsertItem = useUpsertReceiptItem(receiptId);
  const finalizeReceipt = useFinalizeReceipt(receiptId, purchaseOrderId);
  const isDraft = status === "DRAFT";

  const [entries, setEntries] = useState<Record<string, ItemEntry>>({});

  const entry = (poItemId: string): ItemEntry =>
    entries[poItemId] ?? {
      accepted:
        items.find((i) => i.purchaseOrderItemId === poItemId)
          ?.acceptedQuantity ?? 0,
      rejected:
        items.find((i) => i.purchaseOrderItemId === poItemId)
          ?.rejectedQuantity ?? 0,
      rejectedReason:
        items.find((i) => i.purchaseOrderItemId === poItemId)?.rejectedReason ??
        "",
    };

  const set = (id: string, patch: Partial<ItemEntry>) =>
    setEntries((prev) => ({ ...prev, [id]: { ...entry(id), ...patch } }));

  return (
    <Accordion
      defaultExpanded={isDraft}
      sx={{
        mt: 1,
        border: "1px solid",
        borderColor: "divider",
        "&::before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} id={`receipt-${receiptId}-summary`}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Chip
            label={localizeDisplayCode(status)}
            size="small"
            color={status === "FINALIZED" ? "success" : "default"}
          />
          {receivedAt && (
            <Typography variant="caption" color="text.secondary">
              {t("Received")} {formatDate(new Date(receivedAt), undefined, { dateStyle: "medium" })}
            </Typography>
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <List dense disablePadding>
          {poItems.map((poItem) => {
            const e = entry(poItem.id);
            const existing = items.find((i) => i.purchaseOrderItemId === poItem.id);
            return (
              <Box key={poItem.id}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {poItem.itemName} {t("(ordered:")} {poItem.quantity})
                      </Typography>
                    }
                  />
                </ListItem>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1, pl: 1 }}>
                  <TextField
                    id={`receipt-${receiptId}-item-${poItem.id}-accepted`}
                    label={t("Accepted")}
                    type="number"
                    size="small"
                    sx={{ width: 100 }}
                    disabled={!isDraft}
                    value={e.accepted}
                    onChange={(ev) =>
                      set(poItem.id, { accepted: Math.max(0, Number(ev.target.value)) })
                    }
                    slotProps={{ htmlInput: { min: 0, max: poItem.quantity } }}
                  />
                  <TextField
                    id={`receipt-${receiptId}-item-${poItem.id}-rejected`}
                    label={t("Rejected")}
                    type="number"
                    size="small"
                    sx={{ width: 100 }}
                    disabled={!isDraft}
                    value={e.rejected}
                    onChange={(ev) =>
                      set(poItem.id, { rejected: Math.max(0, Number(ev.target.value)) })
                    }
                    slotProps={{ htmlInput: { min: 0, max: poItem.quantity } }}
                  />
                  {e.rejected > 0 && (
                    <TextField
                      id={`receipt-${receiptId}-item-${poItem.id}-reason`}
                      label={t("Rejection reason")}
                      size="small"
                      sx={{ width: 220 }}
                      disabled={!isDraft}
                      value={e.rejectedReason}
                      onChange={(ev) => set(poItem.id, { rejectedReason: ev.target.value })}
                    />
                  )}
                  {isDraft && (
                    <Button
                      id={`btn-save-item-${poItem.id}`}
                      size="small"
                      variant="outlined"
                      disabled={e.accepted + e.rejected === 0}
                      onClick={() =>
                        upsertItem.mutate(
                          {
                            purchaseOrderItemId: poItem.id,
                            acceptedQuantity: e.accepted,
                            rejectedQuantity: e.rejected,
                            rejectedReason: e.rejectedReason || undefined,
                          },
                          notify(
                            `Saved: ${e.accepted} accepted, ${e.rejected} rejected`,
                          ),
                        )
                      }
                    >
                      {t("Save")}</Button>
                  )}
                  {existing && (
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                      {t("✓ saved:")} {existing.acceptedQuantity} ✓ / {existing.rejectedQuantity} ✗
                    </Typography>
                  )}
                </Box>
                <Divider sx={{ my: 0.5 }} />
              </Box>
            );
          })}
        </List>

        {isDraft && (
          <Box sx={{ mt: 1 }}>
            <Button
              id={`btn-finalize-receipt-${receiptId}`}
              variant="contained"
              color="primary"
              size="small"
              onClick={() => finalizeReceipt.mutate(undefined, notify("Receipt finalized — stock updated"))}
            >
              {t("Finalize Receipt")}
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
