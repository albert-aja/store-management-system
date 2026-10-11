import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "./api";

const NOTIFICATIONS_KEY = ["notifications"];

export function useNotifications(unreadOnly: boolean) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, unreadOnly],
    queryFn: () => notificationsApi.list(unreadOnly),
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
