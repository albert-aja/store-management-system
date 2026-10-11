import {
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useRef } from "react";
import { useSnackbar } from "notistack";
import { useDocuments, useUploadDocument } from "./hooks";

interface Props {
  ownerType: string;
  ownerId: string;
}

/** Reusable attachment list + upload control for any owner record (customer, employee, ...). */
export default function DocumentsPanel({ ownerType, ownerId }: Props) {
  const { data } = useDocuments(ownerType, ownerId);
  const upload = useUploadDocument(ownerType, ownerId);
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Documents
      </Typography>
      <List dense>
        {(data ?? []).map((doc) => (
          <ListItem key={doc.id}>
            <ListItemText primary={doc.fileName} secondary={doc.mimeType} />
          </ListItem>
        ))}
        {(data ?? []).length === 0 && (
          <Typography color="text.secondary">No documents yet</Typography>
        )}
      </List>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          upload.mutate(file, {
            onSuccess: () =>
              enqueueSnackbar("Document uploaded", { variant: "success" }),
          });
          e.target.value = "";
        }}
      />
      <Button onClick={() => fileInputRef.current?.click()}>
        Upload Document
      </Button>
    </div>
  );
}
