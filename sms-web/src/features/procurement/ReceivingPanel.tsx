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
      enqueueSnackbar("Action failed — check business rules", {
        variant: "error",
      }),
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}
      >
        <Typography variant="subtitle1">
          Receiving ({receipts.length} document{receipts.length !== 1 ? "s" : ""})
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
            + New Receipt
          </Button>
        )}
      </Box>

      {receipts.length === 0 && (
        <Typography color="text.secondary" variant="body2">
          No receiving documents yet.
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
            label={status}
            size="small"
            color={status === "FINALIZED" ? "success" : "default"}
          />
          {receivedAt && (
            <Typography variant="caption" color="text.secondary">
              Received {new Date(receivedAt).toLocaleDateString()}
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
                        {poItem.itemName} (ordered: {poItem.quantity})
                      </Typography>
                    }
                  />
                </ListItem>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1, pl: 1 }}>
                  <TextField
                    id={`receipt-${receiptId}-item-${poItem.id}-accepted`}
                    label="Accepted"
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
                    label="Rejected"
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
                      label="Rejection reason"
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
                      Save
                    </Button>
                  )}
                  {existing && (
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                      ✓ saved: {existing.acceptedQuantity} ✓ / {existing.rejectedQuantity} ✗
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
              Finalize Receipt
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
