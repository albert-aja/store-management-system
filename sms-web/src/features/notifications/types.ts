export interface NotificationItem {
  recipientId: string;
  notificationId: string;
  title: string;
  body: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  readAt: string | null;
}
