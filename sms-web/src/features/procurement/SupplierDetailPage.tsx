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
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  useAddSupplierContact,
  useDeactivateSupplierContact,
  usePurchaseOrders,
  useSupplier,
  useSupplierContacts,
} from "./hooks";
import type { SupplierContactInput } from "./types";

export default function SupplierDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: supplier } = useSupplier(id);
  const { data: contacts } = useSupplierContacts(id);
  const { data: purchaseOrders } = usePurchaseOrders({ supplierId: id });
  const canManage = useAuthStore((s) => s.hasPermission("PROCUREMENT_MANAGE"));
  const addContact = useAddSupplierContact(id);
  const deactivateContact = useDeactivateSupplierContact(id);
  const form = useForm<SupplierContactInput>({
    defaultValues: { contactType: "PHONE", label: "", value: "", notes: "" },
  });
  const [showForm, setShowForm] = useState(false);

  if (!supplier) return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        {supplier.name}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Code: {supplier.code ?? "—"} · Address: {supplier.address ?? "—"}
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
        <Paper sx={{ p: 2, width: { xs: "100%", md: 380 } }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Contacts
          </Typography>
          <List dense>
            {(contacts ?? [])
              .filter((c) => c.active)
              .map((contact) => (
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
            (showForm ? (
              <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}
                onSubmit={form.handleSubmit((values) => {
                  addContact.mutate(values);
                  form.reset();
                  setShowForm(false);
                })}
              >
                <TextField
                  select
                  label="Type"
                  size="small"
                  defaultValue="PHONE"
                  {...form.register("contactType")}
                >
                  <MenuItem value="PHONE">Phone</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
                <TextField
                  label="Label"
                  size="small"
                  {...form.register("label")}
                />
                <TextField
                  label="Value"
                  size="small"
                  required
                  {...form.register("value", { required: true })}
                />
                <Button type="submit" variant="contained" size="small">
                  Add Contact
                </Button>
              </Box>
            ) : (
              <Button size="small" onClick={() => setShowForm(true)} sx={{ mt: 1 }}>
                Add Contact
              </Button>
            ))}
        </Paper>

        <Paper sx={{ p: 2, flex: 1, minWidth: { xs: "100%", md: 450 } }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Purchase Orders ({(purchaseOrders ?? []).length})
          </Typography>
          <List dense>
            {(purchaseOrders ?? []).map((po) => (
              <ListItem
                key={po.id}
                secondaryAction={
                  <Button
                    size="small"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    Open
                  </Button>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {po.number ?? "(Draft)"}
                      </Typography>
                      <Chip
                        label={po.status}
                        size="small"
                        color={
                          po.status === "ISSUED"
                            ? "success"
                            : po.status === "CANCELLED" || po.status === "REJECTED"
                              ? "error"
                              : "default"
                        }
                      />
                    </Box>
                  }
                  secondary={po.notes ?? undefined}
                />
              </ListItem>
            ))}
            {(purchaseOrders ?? []).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No purchase orders recorded for this supplier.
              </Typography>
            )}
          </List>
        </Paper>
      </Box>
    </Box>
  );
}
