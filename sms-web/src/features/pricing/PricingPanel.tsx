import { useState } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../stores/hooks";
import {
  usePaymentPlans,
  useStorePrices,
  useUpsertPlan,
  useUpsertPrice,
} from "./hooks";
import type { ProductVariant } from "../products/types";

interface Props {
  variants: ProductVariant[];
}

function VariantPlans({
  storeId,
  priceId,
}: {
  storeId: string;
  priceId: string;
}) {
  const { data: plans } = usePaymentPlans(storeId, priceId);
  const upsertPlan = useUpsertPlan(storeId, priceId);
  const [termMonths, setTermMonths] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const canManage = useAuthStore((s) => s.hasPermission("PRICING_MANAGE"));

  return (
    <Box sx={{ pl: 2 }}>
      <List dense>
        {(plans ?? []).map((plan) => (
          <ListItem key={plan.id}>
            <ListItemText
              primary={`${plan.termMonths === 0 ? "Cash" : `${plan.termMonths} months`}: ${plan.totalPrice}`}
            />
          </ListItem>
        ))}
      </List>
      {canManage && (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            label="Term (months)"
            size="small"
            type="number"
            value={termMonths}
            onChange={(e) => setTermMonths(e.target.value)}
          />
          <TextField
            label="Total price"
            size="small"
            type="number"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
          />
          <Button
            size="small"
            onClick={() => {
              if (!termMonths || !totalPrice) return;
              upsertPlan.mutate({
                termMonths: Number(termMonths),
                totalPrice: Number(totalPrice),
              });
              setTermMonths("");
              setTotalPrice("");
            }}
          >
            Save Term
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function PricingPanel({ variants }: Props) {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const { data: prices } = useStorePrices(storeId || null);
  const upsertPrice = useUpsertPrice(storeId);
  const canManage = useAuthStore((s) => s.hasPermission("PRICING_MANAGE"));
  const [cashInputs, setCashInputs] = useState<Record<string, string>>({});
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);

  return (
    <div>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Store Pricing
      </Typography>
      <TextField
        select
        label="Store"
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        value={storeId}
        onChange={(e) => setStoreId(e.target.value)}
      >
        {(stores ?? []).map((store) => (
          <MenuItem key={store.id} value={store.id}>
            {store.name}
          </MenuItem>
        ))}
      </TextField>
      {storeId &&
        variants.map((variant) => {
          const price = (prices ?? []).find(
            (p) => p.productVariantId === variant.id,
          );
          return (
            <Box key={variant.id} sx={{ mb: 1 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Typography sx={{ width: 160 }}>
                  {variant.variantName}
                </Typography>
                <TextField
                  label="Cash price"
                  size="small"
                  type="number"
                  value={cashInputs[variant.id] ?? price?.cashPrice ?? ""}
                  onChange={(e) =>
                    setCashInputs((prev) => ({
                      ...prev,
                      [variant.id]: e.target.value,
                    }))
                  }
                  disabled={!canManage}
                />
                {canManage && (
                  <Button
                    size="small"
                    onClick={() => {
                      const value = Number(
                        cashInputs[variant.id] ?? price?.cashPrice ?? 0,
                      );
                      if (!value) return;
                      upsertPrice.mutate({
                        productVariantId: variant.id,
                        cashPrice: value,
                      });
                    }}
                  >
                    Save
                  </Button>
                )}
                {price && (
                  <Button
                    size="small"
                    onClick={() =>
                      setExpandedVariant(
                        expandedVariant === variant.id ? null : variant.id,
                      )
                    }
                  >
                    {expandedVariant === variant.id ? "Hide Terms" : "Terms"}
                  </Button>
                )}
              </Box>
              {price && expandedVariant === variant.id && (
                <VariantPlans storeId={storeId} priceId={price.id} />
              )}
            </Box>
          );
        })}
    </div>
  );
}
