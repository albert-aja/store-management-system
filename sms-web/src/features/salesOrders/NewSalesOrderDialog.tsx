import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCustomerAddresses, useCustomerSearch } from "../customers/hooks";
import { useStores } from "../stores/hooks";
import { useCreateDraft } from "./hooks";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewSalesOrderDialog({ open, onClose }: Props) {
  const { data: stores } = useStores();
  const [storeId, setStoreId] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const { data: customers } = useCustomerSearch(customerQuery);
  const [customerId, setCustomerId] = useState("");
  const { data: addresses } = useCustomerAddresses(customerId || null);
  const [deliveryAddressId, setDeliveryAddressId] = useState("");
  const createDraft = useCreateDraft();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Draft Sales Order</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
      >
        <TextField
          select
          label="Store"
          fullWidth
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          {(stores ?? []).map((store) => (
            <MenuItem key={store.id} value={store.id}>
              {store.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search customer"
          fullWidth
          value={customerQuery}
          onChange={(e) => setCustomerQuery(e.target.value)}
        />
        <TextField
          select
          label="Customer"
          fullWidth
          value={customerId}
          onChange={(e) => {
            setCustomerId(e.target.value);
            setDeliveryAddressId("");
          }}
        >
          {(customers ?? []).map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.fullName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Delivery Address"
          fullWidth
          value={deliveryAddressId}
          onChange={(e) => setDeliveryAddressId(e.target.value)}
          disabled={!customerId}
        >
          {(addresses ?? []).map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.label ?? "Address"}: {a.addressLine}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!storeId || !customerId}
          onClick={() => {
            createDraft
              .mutateAsync({
                storeId,
                customerId,
                deliveryAddressId: deliveryAddressId || undefined,
              })
              .then((so) => {
                onClose();
                navigate(`/sales-orders/${so.id}`);
              });
          }}
        >
          Create Draft
        </Button>
      </DialogActions>
    </Dialog>
  );
}
