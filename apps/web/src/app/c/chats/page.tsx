"use client";

import { Truck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ChatView } from "@/components/chat-view";

export default function CustomerChatsPage() {
  const session = getSession("customer");
  const userId = session?.user_id || session?.tg_id || "";

  if (!userId) return null;

  return (
    <ChatView
      role="customer"
      userId={userId}
      queryParam="customer_id"
      counterpartyNameKey="carrier_name"
      CounterpartyIcon={Truck}
      avatarClassName="bg-red-50 border border-red-100"
      iconClassName="text-red-500"
      title="Чаты"
      description="Общение с карго-компаниями по вашим заявкам"
      emptyText="Нет активных чатов"
      emptyHint="Чаты появятся когда вы начнёте общение с карго из заявки"
      chatPlaceholder="Начните диалог с карго-компанией"
    />
  );
}
