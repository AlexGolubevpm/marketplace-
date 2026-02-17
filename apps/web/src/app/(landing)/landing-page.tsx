"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Send, Check, Plane, Ship, TrainFront, Truck, ClipboardList, FileText, BarChart3, MapPin, Shield, Clock, Globe, Star, Zap, ChevronDown, User, LogIn } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { trpc } from "@/trpc/client";
import { CngoLogo } from "@/components/cngo-logo";

/* ── Icon map ── */
const ICON_MAP: Record<string, LucideIcon> = {
  Plane, Ship, TrainFront, Truck, ClipboardList, FileText, BarChart3, MapPin,
  Shield, Clock, Globe, Star, Zap, Check, Send, ArrowRight, ChevronDown,
};

const ICON_COLORS: Record<string, string> = {
  Plane: "text-blue-500 bg-blue-50 border-blue-100",
  Ship: "text-cyan-500 bg-cyan-50 border-cyan-100",
  TrainFront: "text-orange-500 bg-orange-50 border-orange-100",
  Truck: "text-green-500 bg-green-50 border-green-100",
  ClipboardList: "text-red-500 bg-red-50 border-red-100",
  FileText: "text-blue-500 bg-blue-50 border-blue-100",
  BarChart3: "text-green-500 bg-green-50 border-green-100",
  MapPin: "text-purple-500 bg-purple-50 border-purple-100",
  Shield: "text-red-500 bg-red-50",
  Clock: "text-blue-500 bg-blue-50",
  Globe: "text-green-500 bg-green-50",
  Star: "text-orange-500 bg-orange-50",
  Zap: "text-cyan-500 bg-cyan-50",
};

/* ── Transport illustrations (full-card SVGs) ── */
const TRANSPORT_GRADIENTS: Record<string, { bg: string; from: string; to: string }> = {
  Plane: { bg: "from-blue-50 to-blue-100", from: "#3B82F6", to: "#1D4ED8" },
  Ship: { bg: "from-cyan-50 to-cyan-100", from: "#06B6D4", to: "#0E7490" },
  TrainFront: { bg: "from-orange-50 to-orange-100", from: "#F97316", to: "#C2410C" },
  Truck: { bg: "from-green-50 to-green-100", from: "#22C55E", to: "#15803D" },
};

function TransportIllustration({ icon, className = "" }: { icon: string; className?: string }) {
  const grad = TRANSPORT_GRADIENTS[icon];
  if (!grad) return null;

  return (
    <div className={`w-full h-full bg-gradient-to-br ${grad.bg} flex items-center justify-center ${className}`}>
      {icon === "Plane" && (
        <svg viewBox="0 0 200 160" fill="none" className="w-4/5 h-4/5 drop-shadow-md">
          <path d="M30 100 L90 45 L170 30 L175 40 L105 70 L120 100 L100 100 L90 75 L55 105 L65 120 L50 120 L30 100Z" fill={grad.from} opacity="0.9"/>
          <path d="M90 45 L170 30 L175 40 L105 70 L90 45Z" fill={grad.to}/>
          <path d="M55 105 L90 75 L100 100 L65 120Z" fill={grad.to} opacity="0.7"/>
          <ellipse cx="100" cy="140" rx="70" ry="8" fill={grad.from} opacity="0.15"/>
        </svg>
      )}
      {icon === "Ship" && (
        <svg viewBox="0 0 200 160" fill="none" className="w-4/5 h-4/5 drop-shadow-md">
          <path d="M40 70 L60 40 L65 70Z" fill={grad.to}/>
          <path d="M75 75 L90 25 L95 75Z" fill={grad.from} opacity="0.9"/>
          <path d="M20 80 L180 80 L165 115 L35 115Z" fill={grad.to}/>
          <path d="M20 80 L180 80 L175 90 L25 90Z" fill={grad.from}/>
          <path d="M15 120 C50 130 150 130 185 120 L165 115 L35 115Z" fill={grad.from} opacity="0.7"/>
          <path d="M10 135 C40 140 80 142 100 140 C120 142 160 140 190 135" stroke={grad.from} strokeWidth="2" opacity="0.3" fill="none"/>
          <path d="M5 145 C35 150 75 152 100 150 C125 152 165 150 195 145" stroke={grad.from} strokeWidth="1.5" opacity="0.15" fill="none"/>
        </svg>
      )}
      {icon === "TrainFront" && (
        <svg viewBox="0 0 200 160" fill="none" className="w-4/5 h-4/5 drop-shadow-md">
          <rect x="60" y="20" width="80" height="100" rx="12" fill={grad.to}/>
          <rect x="65" y="25" width="70" height="90" rx="8" fill={grad.from}/>
          <rect x="75" y="35" width="50" height="30" rx="6" fill="white" opacity="0.9"/>
          <circle cx="85" cy="95" r="8" fill="white" opacity="0.8"/>
          <circle cx="115" cy="95" r="8" fill="white" opacity="0.8"/>
          <rect x="93" y="75" width="14" height="6" rx="3" fill={grad.to}/>
          <rect x="50" y="120" width="100" height="8" rx="4" fill={grad.to}/>
          <circle cx="70" cy="135" r="7" fill={grad.to}/>
          <circle cx="130" cy="135" r="7" fill={grad.to}/>
          <circle cx="70" cy="135" r="4" fill={grad.from} opacity="0.5"/>
          <circle cx="130" cy="135" r="4" fill={grad.from} opacity="0.5"/>
        </svg>
      )}
      {icon === "Truck" && (
        <svg viewBox="0 0 200 160" fill="none" className="w-4/5 h-4/5 drop-shadow-md">
          <rect x="20" y="45" width="110" height="65" rx="6" fill={grad.from} opacity="0.9"/>
          <rect x="25" y="50" width="100" height="55" rx="4" fill={grad.to} opacity="0.3"/>
          <path d="M130 60 L130 110 L175 110 L185 80 L170 60Z" fill={grad.to}/>
          <rect x="140" y="68" width="28" height="22" rx="4" fill="white" opacity="0.85"/>
          <rect x="15" y="110" width="175" height="10" rx="5" fill={grad.to}/>
          <circle cx="60" cy="125" r="12" fill={grad.to}/>
          <circle cx="60" cy="125" r="7" fill="white" opacity="0.6"/>
          <circle cx="155" cy="125" r="12" fill={grad.to}/>
          <circle cx="155" cy="125" r="7" fill="white" opacity="0.6"/>
        </svg>
      )}
    </div>
  );
}

/* ── Default content ── */
const DEFAULTS: Record<string, any> = {
  branding: { logo_url: "", logo_text: "", favicon_url: "" },
  hero: {
    background_image: "", badge: "\u041f\u0435\u0440\u0432\u044b\u0439 \u043a\u0430\u0440\u0433\u043e \u043c\u0430\u0440\u043a\u0435\u0442\u043f\u043b\u0435\u0439\u0441",
    title_1: "\u0415\u0441\u043b\u0438 \u0432\u0430\u0436\u043d\u043e ", title_accent: "\u043f\u0440\u0438\u043d\u0438\u043c\u0430\u0442\u044c \u0440\u0435\u0448\u0435\u043d\u0438\u044f",
    title_2: "\u0430 \u043d\u0435 \u0438\u0441\u043a\u0430\u0442\u044c ", title_fade: "\u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0435\u0439",
    subtitle: "\u0412\u043c\u0435\u0441\u0442\u043e \u043e\u0431\u0437\u0432\u043e\u043d\u0430 20 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0439 \u0438 2 \u0434\u043d\u0435\u0439 \u043f\u0435\u0440\u0435\u0433\u043e\u0432\u043e\u0440\u043e\u0432 \u2014 3\u20135 \u043e\u0444\u0444\u0435\u0440\u043e\u0432 \u0441 \u0446\u0435\u043d\u0430\u043c\u0438 \u0437\u0430 2 \u0447\u0430\u0441\u0430. \u0421\u0440\u0430\u0432\u043d\u0438\u0442\u0435 \u0438 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043b\u0443\u0447\u0448\u0438\u0439.",
    cta_text: "\u041f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f", cta_secondary_text: "\u0427\u0435\u0440\u0435\u0437 Telegram",
    telegram_url: "https://t.me/cargomarketplace_bot",
    checkmarks: [{ text: "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e \u0434\u043b\u044f \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432" }, { text: "\u041e\u0442 3 \u043e\u0444\u0444\u0435\u0440\u043e\u0432 \u0437\u0430 2 \u0447\u0430\u0441\u0430" }, { text: "\u041f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u044b\u0435 \u043a\u0430\u0440\u0433\u043e-\u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438" }],
  },
  stats: { items: [{ value: "200+", label: "\u041a\u0430\u0440\u0433\u043e-\u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0439" }, { value: "<2\u0447", label: "\u0421\u0440\u0435\u0434\u043d\u0435\u0435 \u0432\u0440\u0435\u043c\u044f \u043e\u0442\u0432\u0435\u0442\u0430" }, { value: "98%", label: "\u0414\u043e\u0432\u043e\u043b\u044c\u043d\u044b\u0445 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432" }, { value: "5 000+", label: "\u0414\u043e\u0441\u0442\u0430\u0432\u043e\u043a \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u043e" }] },
  delivery_types: {
    section_label: "\u0412\u0438\u0434\u044b \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438", title: "\u041b\u044e\u0431\u043e\u0439 \u0441\u043f\u043e\u0441\u043e\u0431 \u043f\u0435\u0440\u0435\u0432\u043e\u0437\u043a\u0438", subtitle: "\u041f\u043e\u0434\u0431\u0435\u0440\u0451\u043c \u043e\u043f\u0442\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u043f\u043e \u0446\u0435\u043d\u0435 \u0438 \u0441\u0440\u043e\u043a\u0430\u043c",
    items: [
      { icon: "Plane", image_url: "", title: "\u0410\u0432\u0438\u0430", price: "\u043e\u0442 10 $", period: "\u043e\u0442 1 \u0434\u043d\u044f" },
      { icon: "TrainFront", image_url: "", title: "\u0416\u0414", price: "\u043e\u0442 5 $", period: "\u043e\u0442 15 \u0434\u043d\u0435\u0439" },
      { icon: "Truck", image_url: "", title: "\u0410\u0432\u0442\u043e", price: "\u043e\u0442 2 $", period: "\u043e\u0442 25 \u0434\u043d\u0435\u0439" },
      { icon: "Ship", image_url: "", title: "\u041c\u043e\u0440\u0435", price: "\u043e\u0442 1 $", period: "\u043e\u0442 40 \u0434\u043d\u0435\u0439" },
    ],
  },
  how_it_works: {
    section_label: "\u041f\u0440\u043e\u0446\u0435\u0441\u0441", title: "\u041a\u0430\u043a \u044d\u0442\u043e \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442", subtitle: "4 \u043f\u0440\u043e\u0441\u0442\u044b\u0445 \u0448\u0430\u0433\u0430 \u0434\u043e \u0432\u044b\u0433\u043e\u0434\u043d\u043e\u0439 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438",
    steps: [
      { num: "01", icon: "ClipboardList", image_url: "", title: "\u041e\u043f\u0438\u0448\u0438\u0442\u0435 \u0433\u0440\u0443\u0437", desc: "\u041c\u0430\u0440\u0448\u0440\u0443\u0442, \u0432\u0435\u0441, \u0442\u0438\u043f \u0442\u043e\u0432\u0430\u0440\u0430 \u2014 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435 \u0437\u0430\u044f\u0432\u043a\u0438 \u0437\u0430 2 \u043c\u0438\u043d\u0443\u0442\u044b" },
      { num: "02", icon: "FileText", image_url: "", title: "\u041f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u043e\u0444\u0444\u0435\u0440\u044b", desc: "\u041a\u0430\u0440\u0433\u043e-\u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 \u043f\u0440\u0438\u0441\u044b\u043b\u0430\u044e\u0442 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0441 \u0446\u0435\u043d\u0430\u043c\u0438 \u0438 \u0441\u0440\u043e\u043a\u0430\u043c\u0438" },
      { num: "03", icon: "BarChart3", image_url: "", title: "\u0421\u0440\u0430\u0432\u043d\u0438\u0442\u0435 \u0438 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435", desc: "\u0423\u0434\u043e\u0431\u043d\u043e\u0435 \u0441\u0440\u0430\u0432\u043d\u0435\u043d\u0438\u0435 \u0432\u0441\u0435\u0445 \u0443\u0441\u043b\u043e\u0432\u0438\u0439 \u0432 \u0435\u0434\u0438\u043d\u043e\u0439 \u0442\u0430\u0431\u043b\u0438\u0446\u0435" },
      { num: "04", icon: "MapPin", image_url: "", title: "\u041e\u0442\u0441\u043b\u0435\u0436\u0438\u0432\u0430\u0439\u0442\u0435", desc: "\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u043a\u0430\u0437\u0430 \u0432 \u0440\u0435\u0430\u043b\u044c\u043d\u043e\u043c \u0432\u0440\u0435\u043c\u0435\u043d\u0438 \u0434\u043e \u043c\u043e\u043c\u0435\u043d\u0442\u0430 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u044f" },
    ],
  },
  why_us: {
    section_label: "\u041f\u0440\u0435\u0438\u043c\u0443\u0449\u0435\u0441\u0442\u0432\u0430", title: "\u041f\u043e\u0447\u0435\u043c\u0443 \u0432\u044b\u0431\u0438\u0440\u0430\u044e\u0442 \u043d\u0430\u0441",
    features: [
      { icon: "Shield", image_url: "", title: "\u041f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u044b\u0435 \u043a\u0430\u0440\u0433\u043e", desc: "\u041a\u0430\u0436\u0434\u0430\u044f \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f \u043f\u0440\u043e\u0445\u043e\u0434\u0438\u0442 \u0432\u0435\u0440\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044e \u043f\u0435\u0440\u0435\u0434 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435\u043c \u043a \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0435" },
      { icon: "Clock", image_url: "", title: "\u042d\u043a\u043e\u043d\u043e\u043c\u0438\u044f \u0432\u0440\u0435\u043c\u0435\u043d\u0438", desc: "\u0412\u043c\u0435\u0441\u0442\u043e \u043e\u0431\u0437\u0432\u043e\u043d\u0430 \u0434\u0435\u0441\u044f\u0442\u043a\u043e\u0432 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0439 \u2014 \u043e\u0444\u0444\u0435\u0440\u044b \u043f\u0440\u0438\u0445\u043e\u0434\u044f\u0442 \u043a \u0432\u0430\u043c" },
      { icon: "Globe", image_url: "", title: "\u041b\u044e\u0431\u044b\u0435 \u043c\u0430\u0440\u0448\u0440\u0443\u0442\u044b", desc: "\u041a\u0438\u0442\u0430\u0439, \u0422\u0443\u0440\u0446\u0438\u044f, \u0415\u0432\u0440\u043e\u043f\u0430 \u2192 \u0420\u043e\u0441\u0441\u0438\u044f, \u041a\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043d, \u0423\u0437\u0431\u0435\u043a\u0438\u0441\u0442\u0430\u043d" },
      { icon: "BarChart3", image_url: "", title: "\u041f\u0440\u043e\u0437\u0440\u0430\u0447\u043d\u043e\u0435 \u0441\u0440\u0430\u0432\u043d\u0435\u043d\u0438\u0435", desc: "\u0426\u0435\u043d\u0430, \u0441\u0440\u043e\u043a\u0438, \u0443\u0441\u043b\u043e\u0432\u0438\u044f \u2014 \u0432\u0441\u0451 \u0432 \u043e\u0434\u043d\u043e\u0439 \u0442\u0430\u0431\u043b\u0438\u0446\u0435 \u0434\u043b\u044f \u0431\u044b\u0441\u0442\u0440\u043e\u0433\u043e \u0432\u044b\u0431\u043e\u0440\u0430" },
      { icon: "Star", image_url: "", title: "\u0420\u0435\u0439\u0442\u0438\u043d\u0433 \u043d\u0430\u0434\u0451\u0436\u043d\u043e\u0441\u0442\u0438", desc: "\u0421\u0438\u0441\u0442\u0435\u043c\u0430 \u043e\u0446\u0435\u043d\u043a\u0438 \u043a\u0430\u0440\u0433\u043e-\u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0439 \u043f\u043e \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u0438 \u0438 \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0443 \u0440\u0430\u0431\u043e\u0442\u044b" },
      { icon: "Zap", image_url: "", title: "\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u0441\u0442\u0430\u0440\u0442", desc: "\u0417\u0430\u044f\u0432\u043a\u0430 \u0437\u0430 2 \u043c\u0438\u043d\u0443\u0442\u044b, \u043f\u0435\u0440\u0432\u044b\u0435 \u043e\u0444\u0444\u0435\u0440\u044b \u2014 \u0443\u0436\u0435 \u0447\u0435\u0440\u0435\u0437 \u0447\u0430\u0441" },
    ],
  },
  faq: {
    section_label: "FAQ", title: "\u0427\u0430\u0441\u0442\u044b\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b",
    items: [
      { q: "\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u0441\u0442\u043e\u0438\u0442 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b?", a: "\u0414\u043b\u044f \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432 \u2014 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e. \u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430 \u0437\u0430\u0440\u0430\u0431\u0430\u0442\u044b\u0432\u0430\u0435\u0442 \u043d\u0430 \u043a\u043e\u043c\u0438\u0441\u0441\u0438\u0438 \u0441 \u043a\u0430\u0440\u0433\u043e-\u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0439." },
      { q: "\u041a\u0430\u043a\u0438\u0435 \u0441\u0440\u043e\u043a\u0438 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438?", a: "\u0417\u0430\u0432\u0438\u0441\u0438\u0442 \u043e\u0442 \u0442\u0438\u043f\u0430: \u0430\u0432\u0438\u0430 \u2014 \u043e\u0442 7 \u0434\u043d\u0435\u0439, \u0416\u0414 \u2014 \u043e\u0442 14 \u0434\u043d\u0435\u0439, \u043c\u043e\u0440\u0435 \u2014 \u043e\u0442 25 \u0434\u043d\u0435\u0439." },
      { q: "\u041a\u0430\u043a \u043f\u0440\u043e\u0432\u0435\u0440\u044f\u044e\u0442\u0441\u044f \u043a\u0430\u0440\u0433\u043e-\u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438?", a: "\u041a\u0430\u0436\u0434\u0430\u044f \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f \u043f\u0440\u043e\u0445\u043e\u0434\u0438\u0442 \u0432\u0435\u0440\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044e: \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u043e\u0432, \u0438\u0441\u0442\u043e\u0440\u0438\u044f \u0440\u0430\u0431\u043e\u0442\u044b, \u043e\u0442\u0437\u044b\u0432\u044b \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432." },
      { q: "\u041c\u043e\u0436\u043d\u043e \u043b\u0438 \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c \u0437\u0430\u044f\u0432\u043a\u0443?", a: "\u0414\u0430, \u0434\u043e \u043c\u043e\u043c\u0435\u043d\u0442\u0430 \u0432\u044b\u0431\u043e\u0440\u0430 \u043e\u0444\u0444\u0435\u0440\u0430 \u0437\u0430\u044f\u0432\u043a\u0443 \u043c\u043e\u0436\u043d\u043e \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c \u0438\u043b\u0438 \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0432 \u043b\u044e\u0431\u043e\u0435 \u0432\u0440\u0435\u043c\u044f." },
      { q: "\u041a\u0430\u043a\u0438\u0435 \u043c\u0430\u0440\u0448\u0440\u0443\u0442\u044b \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b?", a: "\u041e\u0441\u043d\u043e\u0432\u043d\u044b\u0435 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f: \u041a\u0438\u0442\u0430\u0439, \u0422\u0443\u0440\u0446\u0438\u044f, \u0415\u0432\u0440\u043e\u043f\u0430 \u2192 \u0420\u043e\u0441\u0441\u0438\u044f, \u041a\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043d, \u0423\u0437\u0431\u0435\u043a\u0438\u0441\u0442\u0430\u043d, \u041a\u044b\u0440\u0433\u044b\u0437\u0441\u0442\u0430\u043d." },
    ],
  },
  cta: {
    background_image: "", title: "\u0413\u043e\u0442\u043e\u0432\u044b \u043d\u0430\u0447\u0430\u0442\u044c?",
    subtitle: "\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0437\u0430\u044f\u0432\u043a\u0443 \u0437\u0430 2 \u043c\u0438\u043d\u0443\u0442\u044b \u0438 \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u043e\u0442 \u043f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u044b\u0445 \u043a\u0430\u0440\u0433\u043e-\u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0439",
    cta_text: "\u041f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f", cta_secondary_text: "\u042f \u043a\u0430\u0440\u0433\u043e-\u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f",
  },
};

/* ── Hook: merge DB content with defaults ── */
function useContent() {
  const { data } = trpc.content.getPublished.useQuery(undefined, {
    staleTime: 60 * 1000,
    retry: 1,
  });

  const get = (section: string) => {
    const def = DEFAULTS[section] || {};
    const db = data?.[section] || {};
    return { ...def, ...db };
  };

  return { get };
}

/* ── Auth helpers ── */
type SessionInfo = { name: string; role: string; href: string } | null;

function useSession(): SessionInfo {
  const [session, setSession] = useState<SessionInfo>(null);
  useEffect(() => {
    try {
      for (const key of ["cargo_session_customer", "cargo_session_carrier"]) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.logged_in) {
            setSession({ name: s.name || s.username || "User", role: s.role, href: s.role === "carrier" ? "/s/requests" : "/c/requests" });
            return;
          }
        }
      }
    } catch {}
    try {
      const raw = localStorage.getItem("cargo_admin_session");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.logged_in) {
          setSession({ name: s.login || "Admin", role: "admin", href: "/dashboard" });
          return;
        }
      }
    } catch {}
  }, []);
  return session;
}

/* ── IconOrImage: show uploaded image or fallback to lucide icon ── */
function IconOrImage({ iconName, imageUrl, size = "w-10 h-10", className = "" }: { iconName?: string; imageUrl?: string; size?: string; className?: string }) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className={`w-full h-full object-contain ${className}`} />;
  }
  const Icon = iconName ? ICON_MAP[iconName] : null;
  if (Icon) return <Icon className={`${size} ${className}`} />;
  return null;
}

/* ── Animations ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ── Card ── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

/* ── Navbar ── */
function Navbar({ branding }: { branding: any }) {
  const session = useSession();
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <CngoLogo className="h-[72px] w-auto" logoUrl={branding.logo_url || undefined} />
          <span className="text-gray-900 font-bold text-lg tracking-tight">{branding.logo_text}</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#delivery" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Доставка</a>
          <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Как работает</a>
          <a href="#why-us" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Преимущества</a>
          <Link href="/knowledge-base" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">База знаний</Link>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden sm:block text-sm text-gray-500">{session.name}</span>
              <Link href={session.href}>
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
                  <User className="inline-block mr-1.5 h-4 w-4" />Кабинет
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/carrier" className="hidden sm:block">
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <Truck className="inline-block mr-1.5 h-4 w-4" />Вход для карго
                </button>
              </Link>
              <Link href="/auth/customer">
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
                  <LogIn className="inline-block mr-1.5 h-4 w-4" />Вход для клиентов
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ── */
function HeroSection({ content, branding }: { content: any; branding: any }) {
  const checkmarks = content.checkmarks || DEFAULTS.hero.checkmarks;
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 overflow-hidden">
      {content.background_image ? (
        <div className="absolute inset-0">
          <img src={content.background_image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/80" />
        </div>
      ) : (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-50 rounded-full blur-[120px] pointer-events-none" />
      )}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} custom={0} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-100 bg-red-50 text-[13px] text-red-600 font-medium">
              <CngoLogo className="h-5 w-auto" logoUrl={branding.logo_url || undefined} /> {content.badge}
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-gray-900">{content.title_1}</span>
            <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">{content.title_accent}</span>
            <br />
            <span className="text-gray-900">{content.title_2}</span>
            <span className="text-gray-400">{content.title_fade}</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mt-6 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {content.subtitle}
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/customer">
              <button className="group px-7 py-3.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30 active:scale-[0.98]">
                {content.cta_text}
                <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <a href={content.telegram_url || "https://t.me/cargomarketplace_bot"} target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]">
              <Send className="inline-block mr-2 h-4 w-4 text-gray-400" /> {content.cta_secondary_text}
            </a>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            {checkmarks.map((c: any) => (
              <div key={c.text} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-red-500" />{c.text}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Stats ── */
function StatsSection({ content }: { content: any }) {
  const items = content.items || DEFAULTS.stats.items;
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((s: any, i: number) => (
            <motion.div key={s.label} variants={fadeUp} custom={i}>
              <div className="p-6 text-center rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{s.value}</div>
                <p className="mt-1.5 text-sm text-gray-500">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Delivery Types ── */
function DeliveryTypesSection({ content }: { content: any }) {
  const items = content.items || DEFAULTS.delivery_types.items;
  return (
    <section id="delivery" className="relative py-24 px-6 scroll-mt-20">
      {content.section_image && (
        <div className="absolute inset-0 opacity-5">
          <img src={content.section_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="relative max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-red-500 tracking-wider uppercase mb-3">{content.section_label}</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{content.title}</motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">{content.subtitle}</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((t: any, i: number) => (
              <motion.div key={t.title} variants={fadeUp} custom={i}>
                <Card className="group text-center cursor-default hover:-translate-y-1 overflow-hidden">
                  <div className="w-full h-44 rounded-t-2xl overflow-hidden">
                    {t.image_url ? (
                      <img src={t.image_url} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <TransportIllustration icon={t.icon} />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.title}</h3>
                    <p className="text-base font-medium text-gray-700">{t.price} <span className="text-sm font-normal text-gray-400">/ кг</span></p>
                    <p className="text-sm text-gray-400 mt-1">{t.period}</p>
                  </div>
                </Card>
              </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── How It Works ── */
function HowItWorksSection({ content }: { content: any }) {
  const steps = content.steps || DEFAULTS.how_it_works.steps;
  return (
    <section id="how-it-works" className="relative py-24 px-6 bg-gray-50 scroll-mt-20">
      <div className="relative max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-red-500 tracking-wider uppercase mb-3">{content.section_label}</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{content.title}</motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-3 text-gray-500 text-lg">{content.subtitle}</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid md:grid-cols-2 gap-5">
          {steps.map((step: any, i: number) => {
            const color = ICON_COLORS[step.icon] || "text-gray-500 bg-gray-50 border-gray-100";
            return (
              <motion.div key={step.num} variants={fadeUp} custom={i}>
                <Card className="group h-full hover:-translate-y-1 overflow-hidden">
                  {step.image_url ? (
                    <div className="w-full h-36 p-4">
                      <IconOrImage imageUrl={step.image_url} />
                    </div>
                  ) : (
                    <div className="p-7 pb-0">
                      <div className={`w-16 h-16 rounded-xl border flex items-center justify-center ${color} transition-all duration-300`}>
                        <IconOrImage iconName={step.icon} size="w-8 h-8" />
                      </div>
                    </div>
                  )}
                  <div className="p-7 pt-4">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-[11px] font-mono text-gray-300 tracking-widest">{step.num}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Why Us ── */
function WhyUsSection({ content }: { content: any }) {
  const features = content.features || DEFAULTS.why_us.features;
  return (
    <section id="why-us" className="relative py-24 px-6 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-red-500 tracking-wider uppercase mb-3">{content.section_label}</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{content.title}</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {features.map((f: any, i: number) => {
            const color = ICON_COLORS[f.icon] || "text-gray-500 bg-gray-50";
            return (
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Card className="group h-full hover:-translate-y-1 overflow-hidden">
                  {f.image_url ? (
                    <div className="w-full h-32 p-4">
                      <IconOrImage imageUrl={f.image_url} />
                    </div>
                  ) : (
                    <div className="px-6 pt-6">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
                        <IconOrImage iconName={f.icon} size="w-7 h-7" />
                      </div>
                    </div>
                  )}
                  <div className="p-6 pt-3">
                    <h3 className="text-base font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ── FAQ ── */
function FAQSection({ content }: { content: any }) {
  const items = content.items || DEFAULTS.faq.items;
  return (
    <section className="relative py-24 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-red-500 tracking-wider uppercase mb-3">{content.section_label}</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">{content.title}</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-3">
          {items.map((faq: any, i: number) => (
            <motion.details key={i} variants={fadeUp} custom={i} className="group rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all duration-300">
              <summary className="flex items-center justify-between p-5 text-gray-900 font-medium cursor-pointer list-none select-none">
                <span className="pr-4">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform duration-300 flex-shrink-0" />
              </summary>
              <div className="px-5 pb-5 -mt-1">
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            </motion.details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── CTA ── */
function CTASection({ content }: { content: any }) {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-red-600 to-red-700 p-10 md:p-14 text-center shadow-2xl shadow-red-600/20">
            {content.background_image && (
              <div className="absolute inset-0">
                <img src={content.background_image} alt="" className="w-full h-full object-cover opacity-20" />
              </div>
            )}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white tracking-tight">{content.title}</motion.h2>
              <motion.p variants={fadeUp} custom={1} className="mt-3 text-red-100 max-w-lg mx-auto">{content.subtitle}</motion.p>
              <motion.div variants={fadeUp} custom={2} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth/customer">
                  <button className="group px-7 py-3.5 rounded-xl font-semibold text-red-600 bg-white hover:bg-gray-50 transition-all duration-300 shadow-lg active:scale-[0.98]">
                    {content.cta_text}
                    <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
                <Link href="/auth/carrier">
                  <button className="px-7 py-3.5 rounded-xl border border-white/30 text-white font-medium hover:bg-white/10 transition-all active:scale-[0.98]">
                    <Truck className="inline-block mr-2 h-4 w-4" />{content.cta_secondary_text}
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer({ branding }: { branding: any }) {
  return (
    <footer className="py-10 px-6 border-t border-gray-100">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <CngoLogo className="h-[72px] w-auto" logoUrl={branding.logo_url || undefined} />
          <span className="text-gray-900 font-bold text-lg tracking-tight">{branding.logo_text}</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/knowledge-base" className="hover:text-gray-900 transition-colors">База знаний</Link>
          <Link href="/auth/customer" className="hover:text-gray-900 transition-colors">Вход для клиентов</Link>
          <Link href="/auth/carrier" className="hover:text-gray-900 transition-colors">Вход для карго</Link>
        </div>
        <p className="text-sm text-gray-300">&copy; 2026 {branding.logo_text}</p>
      </div>
    </footer>
  );
}

/* ── Main Landing ── */
export function LandingPage() {
  const { get } = useContent();
  const branding = get("branding");
  const hero = get("hero");
  const stats = get("stats");
  const delivery = get("delivery_types");
  const howItWorks = get("how_it_works");
  const whyUs = get("why_us");
  const faq = get("faq");
  const cta = get("cta");

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-red-100">
      <Navbar branding={branding} />
      <HeroSection content={hero} branding={branding} />
      <StatsSection content={stats} />
      <DeliveryTypesSection content={delivery} />
      <HowItWorksSection content={howItWorks} />
      <WhyUsSection content={whyUs} />
      <FAQSection content={faq} />
      <CTASection content={cta} />
      <Footer branding={branding} />
    </div>
  );
}
