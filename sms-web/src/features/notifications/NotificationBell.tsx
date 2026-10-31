import { t } from "../../lib/locale";
import { useState } from "react";
import {
  Badge,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useMarkRead, useNotifications } from "./hooks";

export default function NotificationBell() {
  const { data } = useNotifications(false);
  const markRead = useMarkRead();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const unreadCount = (data ?? []).filter((n) => !n.readAt).length;

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <List sx={{ width: 320, maxHeight: 400, overflow: "auto" }}>
          {(data ?? []).length === 0 && (
            <Typography sx={{ p: 2 }}>{t("No notifications")}</Typography>
          )}
          {(data ?? []).map((n) => (
            <ListItemButton
              key={n.recipientId}
              onClick={() => !n.readAt && markRead.mutate(n.recipientId)}
              sx={{ bgcolor: n.readAt ? "transparent" : "action.hover" }}
            >
              <ListItemText primary={n.title} secondary={n.body} />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  );
}
