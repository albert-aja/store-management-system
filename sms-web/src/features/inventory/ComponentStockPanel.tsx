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
import { useAdjustComponentStock, useComponentStock } from "./hooks";
import type { ProductComponent } from "../products/types";
import { t } from "../../lib/locale";

interface Props {
  components: ProductComponent[];
}

export default function ComponentStockPanel({ components }: Props) {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const { data: stock } = useComponentStock(storeId || null);
  const adjust = useAdjustComponentStock(storeId);
  const canManage = useAuthStore((s) => s.hasPermission("INVENTORY_MANAGE"));

  return (
    <div>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {t("Component Stock (spares)")}
      </Typography>
      <TextField
        select
        label={t("Store")}
        size="small"
        fullWidth
        sx={{ mb: 1 }}
        value={storeId}
        onChange={(e) => setStoreId(e.target.value)}
      >
        {(stores ?? []).map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.name}
          </MenuItem>
        ))}
      </TextField>
      {storeId && (
        <List dense>
          {components.map((component) => {
            const qty =
              (stock ?? []).find((s) => s.productComponentId === component.id)
                ?.quantityOnHand ?? 0;
            return (
              <ListItem
                key={component.id}
                secondaryAction={
                  canManage && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button
                        size="small"
                        onClick={() =>
                          adjust.mutate({
                            productComponentId: component.id,
                            delta: 1,
                          })
                        }
                      >
                        +1
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          adjust.mutate({
                            productComponentId: component.id,
                            delta: -1,
                          })
                        }
                      >
                        -1
                      </Button>
                    </Box>
                  )
                }
              >
                <ListItemText
                  primary={component.name}
                  secondary={`On hand: ${qty}`}
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </div>
  );
}
