"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MessageSquare, Send, Paperclip, ArrowLeft, Truck } from "lucide-react";
import { getSession } from "@/lib/auth";

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

export default function CustomerChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const session = getSession("customer");

  const loadConversations = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/chats?customer_id=${session.user_id || session.tg_id}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {}
    setLoading(false);
  }, [session]);

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
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (activeConvo) {
      loadMessages(activeConvo.id);
      const interval = setInterval(() => loadMessages(activeConvo.id), 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvo, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvo || !session) return;
    setSending(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConvo.id,
          sender_role: "customer",
          sender_id: session.user_id || session.tg_id,
          text: newMsg.trim(),
        }),
      });
      if (res.ok) {
        setNewMsg("");
        await loadMessages(activeConvo.id);
      }
    } catch {}
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvo || !session) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: activeConvo.id,
            sender_role: "customer",
            sender_id: session.user_id || session.tg_id,
            file_url: url,
            file_name: file.name,
          }),
        });
        await loadMessages(activeConvo.id);
      }
    } catch {}
    e.target.value = "";
  };

  if (activeConvo) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <button onClick={() => setActiveConvo(null)} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <Truck className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{activeConvo.carrier_name}</p>
            <p className="text-xs text-gray-400">{activeConvo.request_display_id} &middot; {activeConvo.request_route}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">Начните диалог с карго-компанией</p>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_role === "customer";
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-red-500 text-white" : "bg-white border border-gray-200 text-gray-900"}`}>
                  {msg.text && <p className="text-sm">{msg.text}</p>}
                  {msg.file_url && (
                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`text-sm underline flex items-center gap-1 ${isMe ? "text-red-100" : "text-red-500"}`}>
                      <Paperclip className="h-3 w-3" /> {msg.file_name || "Файл"}
                    </a>
                  )}
                  <p className={`text-[10px] mt-1 ${isMe ? "text-red-200" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 pt-4 flex items-center gap-2">
          <label className="cursor-pointer text-gray-400 hover:text-gray-600">
            <Paperclip className="h-5 w-5" />
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Написать сообщение..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMsg.trim()}
            className="p-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Чаты</h1>
      <p className="text-gray-500">Общение с карго-компаниями по вашим заявкам</p>

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
          <p className="text-sm text-gray-400 mt-1">Чаты появятся когда вы начнёте общение с карго из заявки</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConvo(c)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{c.carrier_name}</p>
                  {c.last_message && (
                    <span className="text-xs text-gray-400">
                      {new Date(c.last_message.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{c.request_display_id} &middot; {c.request_route}</p>
                {c.last_message && (
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {c.last_message.sender_role === "customer" ? "Вы: " : ""}{c.last_message.text || "Файл"}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
