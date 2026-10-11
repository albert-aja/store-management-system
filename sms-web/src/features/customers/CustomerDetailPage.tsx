import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import DocumentsPanel from "../documents/DocumentsPanel";
import {
  useAddAddress,
  useAddContact,
  useCustomer,
  useCustomerAddresses,
  useCustomerContacts,
  useDeactivateAddress,
  useDeactivateContact,
  useSetPrimaryAddress,
} from "./hooks";
import type { AddressInput, ContactInput } from "./types";

export default function CustomerDetailPage() {
  const { id = "" } = useParams();
  const { data: customer } = useCustomer(id);
  const { data: contacts } = useCustomerContacts(id);
  const { data: addresses } = useCustomerAddresses(id);
  const canManage = useAuthStore((s) => s.hasPermission("CUSTOMER_MANAGE"));

  const addContact = useAddContact(id);
  const deactivateContact = useDeactivateContact(id);
  const addAddress = useAddAddress(id);
  const setPrimaryAddress = useSetPrimaryAddress(id);
  const deactivateAddress = useDeactivateAddress(id);

  const contactForm = useForm<ContactInput>({
    defaultValues: { contactType: "PHONE", label: "", value: "", notes: "" },
  });
  const addressForm = useForm<AddressInput>({
    defaultValues: { label: "", addressLine: "", notes: "", primary: false },
  });
  const [showContactForm, setShowContactForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  if (!customer) return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {customer.fullName}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        NIK: {customer.nik ?? "—"} · Phone: {customer.primaryPhone ?? "—"} ·
        Email: {customer.primaryEmail ?? "—"}
      </Typography>

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

        <Paper sx={{ p: 2, width: 360 }}>
          <DocumentsPanel ownerType="CUSTOMER" ownerId={id} />
        </Paper>
      </Box>
      <Divider sx={{ my: 3 }} />
    </Box>
  );
}
