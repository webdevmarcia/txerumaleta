import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

/** Contadores de mensagens e notificações por ler, atualizados em tempo real. */
export function useUnreadCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ messages: 0, notifications: 0 });

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = async () => {
      try {
        const [messages, notifications] = await Promise.all([
          api.messages.unreadCount(),
          api.notifications.unreadCount(),
        ]);
        if (active) setCounts({ messages, notifications });
      } catch {
        /* ignora falhas pontuais de rede */
      }
    };
    refresh();
    const unsubs = [api.messages.subscribe(refresh), api.notifications.subscribe(refresh)];
    const interval = setInterval(refresh, 60_000);
    window.addEventListener("txerumaleta:refresh-counts", refresh);
    return () => {
      active = false;
      unsubs.forEach((u) => u());
      clearInterval(interval);
      window.removeEventListener("txerumaleta:refresh-counts", refresh);
    };
  }, [user]);

  return user ? counts : { messages: 0, notifications: 0 };
}

export const refreshCounts = () => window.dispatchEvent(new Event("txerumaleta:refresh-counts"));
