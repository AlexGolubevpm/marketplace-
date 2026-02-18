"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, RefreshCw, User, Truck, ArrowLeft, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  request_id: string;
  customer_id: string;
  carrier_id: string;
  customer_name: string;
  carrier_name: string;
  request_display_id: string;
  request_route: string;
  last_message: { text: string; created_at: string; sender_role: string } | null;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_role: string;
  sender_id: string;
  text: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

type FilterMode = "all" | "by_customer" | "by_carrier";

export default function AdminChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/chats?all=true");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (convoId: string) => {
    try {
      const res = await fetch(`/api/chats?conversation_id=${convoId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeConvo) {
      loadMessages(activeConvo.id);
    }
  }, [activeConvo, loadMessages]);

  // Group conversations
  const grouped = (() => {
    if (filterMode === "by_customer") {
      const map = new Map<string, Conversation[]>();
      conversations.forEach((c) => {
        const key = c.customer_name;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(c);
      });
      return Array.from(map.entries());
    }
    if (filterMode === "by_carrier") {
      const map = new Map<string, Conversation[]>();
      conversations.forEach((c) => {
        const key = c.carrier_name;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(c);
      });
      return Array.from(map.entries());
    }
    return null;
  })();

  if (activeConvo) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveConvo(null); setMessages([]); }} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">
              {activeConvo.customer_name} &harr; {activeConvo.carrier_name}
            </h2>
            <p className="text-xs text-gray-400">{activeConvo.request_display_id} &middot; {activeConvo.request_route}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 max-h-[600px] overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">Нет сообщений</p>
          )}
          {messages.map((msg) => {
            const isCustomer = msg.sender_role === "customer";
            return (
              <div key={msg.id} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isCustomer ? "bg-blue-50 border border-blue-100 text-gray-900" : "bg-red-50 border border-red-100 text-gray-900"}`}>
                  <p className={`text-[10px] font-medium mb-1 ${isCustomer ? "text-blue-500" : "text-red-500"}`}>
                    {isCustomer ? activeConvo.customer_name : activeConvo.carrier_name}
                  </p>
                  {msg.text && <p className="text-sm">{msg.text}</p>}
                  {msg.file_url && (
                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-red-500 underline flex items-center gap-1">
                      <Paperclip className="h-3 w-3" /> {msg.file_name || "Файл"}
                    </a>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(msg.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Чаты" description="Все переписки между клиентами и карго-компаниями">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </PageHeader>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "all" as FilterMode, label: "Все чаты" },
          { key: "by_customer" as FilterMode, label: "По клиентам" },
          { key: "by_carrier" as FilterMode, label: "По карго" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterMode(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterMode === tab.key
                ? "bg-red-50 text-red-600"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500">Нет активных чатов</p>
        </div>
      ) : grouped ? (
        <div className="space-y-6">
          {grouped.map(([groupName, convos]) => (
            <div key={groupName}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                {filterMode === "by_customer" ? <User className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                {groupName} ({convos.length})
              </h3>
              <div className="space-y-2">
                {convos.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConvo(c)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          <span className="text-blue-500">{c.customer_name}</span>
                          <span className="text-gray-300 mx-2">&harr;</span>
                          <span className="text-red-500">{c.carrier_name}</span>
                        </p>
                        {c.last_message && (
                          <span className="text-xs text-gray-400">
                            {new Date(c.last_message.created_at).toLocaleDateString("ru-RU")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{c.request_display_id} &middot; {c.request_route}</p>
                      {c.last_message && (
                        <p className="text-sm text-gray-500 truncate mt-1">{c.last_message.text || "Файл"}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConvo(c)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">
                    <span className="text-blue-500">{c.customer_name}</span>
                    <span className="text-gray-300 mx-2">&harr;</span>
                    <span className="text-red-500">{c.carrier_name}</span>
                  </p>
                  {c.last_message && (
                    <span className="text-xs text-gray-400">
                      {new Date(c.last_message.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{c.request_display_id} &middot; {c.request_route}</p>
                {c.last_message && (
                  <p className="text-sm text-gray-500 truncate mt-1">{c.last_message.text || "Файл"}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
