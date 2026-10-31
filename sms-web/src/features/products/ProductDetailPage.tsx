import { useState } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import ComponentStockPanel from "../inventory/ComponentStockPanel";
import PricingPanel from "../pricing/PricingPanel";
import {
  useAddComponent,
  useAddVariant,
  useComponents,
  useDeactivateComponent,
  useDeactivateVariant,
  useProduct,
  useVariants,
} from "./hooks";
import type { ComponentInput, VariantInput } from "./types";
import { t } from "../../lib/locale";

export default function ProductDetailPage() {
  const { id = "" } = useParams();
  const { data: product } = useProduct(id);
  const { data: variants } = useVariants(id);
  const { data: components } = useComponents(id);
  const canManage = useAuthStore((s) => s.hasPermission("PRODUCT_MANAGE"));

  const addVariant = useAddVariant(id);
  const deactivateVariant = useDeactivateVariant(id);
  const addComponent = useAddComponent(id);
  const deactivateComponent = useDeactivateComponent(id);

  const variantForm = useForm<VariantInput>({
    defaultValues: { sku: "", variantName: "" },
  });
  const componentForm = useForm<ComponentInput>({
    defaultValues: { name: "", quantity: 1, notes: "" },
  });
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [showComponentForm, setShowComponentForm] = useState(false);

  if (!product) return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        {product.name}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t("Code:")} {product.code} {t("· Category:")} {product.categoryName ?? "—"} {t("· Brand:")} {product.brandName ?? "—"}
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Paper sx={{ p: 2, width: 380 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t("Variants")}
          </Typography>
          <List dense>
            {(variants ?? []).map((variant) => (
              <ListItem
                key={variant.id}
                secondaryAction={
                  canManage && (
                    <Button
                      size="small"
                      onClick={() => deactivateVariant.mutate(variant.id)}
                    >
                      {t("Remove")}
                    </Button>
                  )
                }
              >
                <ListItemText
                  primary={`${variant.variantName} (${variant.sku})`}
                />
              </ListItem>
            ))}
          </List>
          {canManage &&
            (showVariantForm ? (
              <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                onSubmit={variantForm.handleSubmit((values) => {
                  addVariant.mutate(values);
                  variantForm.reset();
                  setShowVariantForm(false);
                })}
              >
                <TextField
                  label={t("SKU")}
                  size="small"
                  required
                  {...variantForm.register("sku", { required: true })}
                />
                <TextField
                  label={t("Variant Name")}
                  size="small"
                  required
                  {...variantForm.register("variantName", { required: true })}
                />
                <Button type="submit" variant="contained" size="small">
                  {t("Add Variant")}
                </Button>
              </Box>
            ) : (
              <Button size="small" onClick={() => setShowVariantForm(true)}>
                {t("Add Variant")}
              </Button>
            ))}
        </Paper>

        <Paper sx={{ p: 2, width: 380 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t("Standard Components")}
          </Typography>
          <List dense>
            {(components ?? []).map((component) => (
              <ListItem
                key={component.id}
                secondaryAction={
                  canManage && (
                    <Button
                      size="small"
                      onClick={() => deactivateComponent.mutate(component.id)}
                    >
                      {t("Remove")}
                    </Button>
                  )
                }
              >
                <ListItemText
                  primary={`${component.name} x${component.quantity}`}
                  secondary={component.notes}
                />
              </ListItem>
            ))}
          </List>
          {canManage &&
            (showComponentForm ? (
              <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                onSubmit={componentForm.handleSubmit((values) => {
                  addComponent.mutate({
                    ...values,
                    quantity: Number(values.quantity),
                  });
                  componentForm.reset();
                  setShowComponentForm(false);
                })}
              >
                <TextField
                  label={t("Name")}
                  size="small"
                  required
                  {...componentForm.register("name", { required: true })}
                />
                <TextField
                  label={t("Quantity")}
                  size="small"
                  type="number"
                  {...componentForm.register("quantity", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
                <TextField
                  label={t("Notes")}
                  size="small"
                  {...componentForm.register("notes")}
                />
                <Button type="submit" variant="contained" size="small">
                  {t("Add Component")}
                </Button>
              </Box>
            ) : (
              <Button size="small" onClick={() => setShowComponentForm(true)}>
                {t("Add Component")}
              </Button>
            ))}
        </Paper>

        <Paper sx={{ p: 2, width: 420 }}>
          <PricingPanel variants={variants ?? []} productId={id} />
        </Paper>

        <Paper sx={{ p: 2, width: 380 }}>
          <ComponentStockPanel components={components ?? []} />
        </Paper>
      </Box>
    </Box>
  );
}
