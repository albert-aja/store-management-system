import { apiClient } from "../../lib/apiClient";
import type { NotificationItem } from "./types";

export const notificationsApi = {
  list: (unreadOnly: boolean) =>
    apiClient
      .get<
        NotificationItem[]
      >("/api/notifications", { params: { unread: unreadOnly } })
      .then((r) => r.data),
  markRead: (recipientId: string) =>
    apiClient.patch(`/api/notifications/${recipientId}/read`),
};
