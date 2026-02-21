"use client";

import { User } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ChatView } from "@/components/chat-view";

export default function CarrierChatsPage() {
  const session = getSession("carrier");
  const userId = session?.user_id || session?.tg_id || "";

  if (!userId) return null;

  return (
    <ChatView
      role="carrier"
      userId={userId}
      queryParam="carrier_id"
      counterpartyNameKey="customer_name"
      CounterpartyIcon={User}
      avatarClassName="bg-blue-50 border border-blue-100"
      iconClassName="text-blue-500"
      title="Чаты"
      description="Общение с клиентами по заявкам"
      emptyText="Нет активных чатов"
      emptyHint="Чаты появятся когда вы ответите на заявку оффером"
      chatPlaceholder="Начните диалог с клиентом"
    />
  );
}
