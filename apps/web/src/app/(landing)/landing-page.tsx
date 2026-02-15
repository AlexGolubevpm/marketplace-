"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Send, Check } from "lucide-react";

function CngoLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className={className}>
      <path d="M15 20 L65 8 L72 22 L28 35 L15 30Z" fill="#FF0A0A" />
      <path d="M8 35 L28 35 L72 22 L78 36 L30 50 L8 45Z" fill="#E50000" />
      <path d="M8 45 L30 50 L78 36 L72 55 L25 65 L5 58Z" fill="#FF0A0A" />
      <path d="M5 58 L25 65 L72 55 L55 72 L20 82 L10 70Z" fill="#CC0000" />
      <path d="M20 82 L55 72 L42 82 L25 88Z" fill="#FF2020" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

function Card({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm ${hover ? "transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)]" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ── Transport Icons ── */
function IconPlane({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 26h8l4-8h6l-2 8h8l2-4h4l-1 6 1 6h-4l-2-4h-8l2 8h-6l-4-8H4l-1-2 1-2z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="38" cy="28" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function IconShip({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 30h32l-4 10H12L8 30z" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="20" width="20" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="20" y1="20" x2="20" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="28" y1="20" x2="28" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <rect x="21" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <line x1="24" y1="8" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 42c3-2 6-2 9 0s6 2 9 0 6-2 9 0 6 2 9 0" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
    </svg>
  );
}

function IconTrain({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="8" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="12" width="20" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="24" y1="12" x2="24" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="17" cy="30" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="31" cy="30" r="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="22" y1="28" x2="26" y2="28" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 36l-3 6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M34 36l3 6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="42" x2="40" y2="42" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconTruck({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="14" width="28" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 20h8l6 8v4a2 2 0 01-2 2h-12V20z" stroke="currentColor" strokeWidth="1.5" />
      <rect x="33" y="23" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <circle cx="12" cy="34" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="34" r="1" fill="currentColor" />
      <circle cx="38" cy="34" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="38" cy="34" r="1" fill="currentColor" />
    </svg>
  );
}

/* ── Process Icons ── */
function IconClipboard({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="8" width="28" height="34" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="18" y="4" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="16" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="16" y1="26" x2="28" y2="26" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="16" y1="32" x2="30" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

function IconOffers({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="12" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <rect x="10" y="8" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <rect x="14" y="4" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="19" y1="9" x2="33" y2="9" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <line x1="19" y1="13" x2="29" y2="13" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <circle cx="36" cy="32" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M36 27v5l3.5 2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconCompareCards({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="17" height="32" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="27" y="8" width="17" height="32" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <line x1="9" y1="20" x2="14" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <line x1="32" y1="15" x2="39" y2="15" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <line x1="32" y1="20" x2="37" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <path d="M9 27l2.5 2.5L16 25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="35" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function IconTracking({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      <path d="M8 16c4 2 8 8 16 8s12-4 16-2" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.5" />
      <line x1="4" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1.2" opacity="0.15" />
    </svg>
  );
}

/* ── Feature Icons ── */
function IconShield({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 4L6 14v12c0 12 8 20 18 24 10-4 18-12 18-24V14L24 4z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 24l5 5 9-10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconClock({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 12v12l8 5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M38 8l3-3M42 12l2-1" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

function IconGlobe({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="24" cy="24" rx="8" ry="18" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path d="M8 15h32M8 33h32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

function IconBarChart({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="36" height="36" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <rect x="10" y="26" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
      <rect x="20" y="18" width="8" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
      <rect x="30" y="12" width="8" height="24" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

function IconStar({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 4l6 12.5H44l-11 8.5 4.2 13L24 30l-13.2 8 4.2-13L4 16.5h14L24 4z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 4l6 12.5H44l-11 8.5 4.2 13L24 30l-13.2 8 4.2-13L4 16.5h14L24 4z" fill="currentColor" fillOpacity="0.1" />
    </svg>
  );
}

function IconBolt({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 4L10 28h12l-2 16L38 20H26l2-16z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M26 4L10 28h12l-2 16L38 20H26l2-16z" fill="currentColor" fillOpacity="0.08" />
    </svg>
  );
}

/* ── Hero Flow ── */
function HeroFlow() {
  const nodes = [
    { label: "Заявка", icon: <IconClipboard className="w-6 h-6" /> },
    { label: "Офферы", icon: <IconOffers className="w-6 h-6" /> },
    { label: "Сравнение", icon: <IconCompareCards className="w-6 h-6" /> },
    { label: "Доставка", icon: <IconTracking className="w-6 h-6" /> },
  ];
  return (
    <div className="hidden md:flex items-center justify-center gap-2 mt-16 opacity-50">
      {nodes.map((n, i) => (
        <div key={n.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-red-400">
              {n.icon}
            </div>
            <span className="text-[11px] text-slate-500 tracking-wide">{n.label}</span>
          </div>
          {i < nodes.length - 1 && (
            <div className="flex items-center mb-5">
              <div className="w-12 h-px bg-gradient-to-r from-white/10 to-white/5" />
              <ArrowRight className="w-3 h-3 text-white/20" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── SECTIONS ── */

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-red-600/[0.06] rounded-full blur-[160px] pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} custom={0} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/15 bg-red-500/[0.05] text-[13px] text-red-400/90">
              <CngoLogo className="h-3.5 w-3.5" /> Первый карго маркетплейс
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-white">Если важно </span>
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">принимать решения</span>
            <br />
            <span className="text-white">а не искать </span>
            <span className="text-slate-500">исполнителей</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Вместо обзвона 20 компаний и 2 дней переговоров —{" "}
            <span className="text-white/80">3–5 офферов с ценами за 2 часа.</span>{" "}
            Сравните и выберите лучший.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/customer">
              <button className="group px-7 py-3.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-500 transition-all duration-300 shadow-[0_0_0_1px_rgba(220,38,38,0.5)] hover:shadow-[0_4px_32px_rgba(220,38,38,0.25)] active:scale-[0.98]">
                Получить предложения
                <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <a href="https://t.me/cargomarketplace_bot" target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white font-medium hover:bg-white/[0.05] hover:border-white/[0.15] transition-all active:scale-[0.98]">
              <Send className="inline-block mr-2 h-4 w-4 opacity-60" /> Через Telegram
            </a>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            {["Бесплатно для клиентов", "От 3 офферов за 2 часа", "Проверенные карго-компании"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-red-500/70" />{t}
              </div>
            ))}
          </motion.div>
          <motion.div variants={fadeUp} custom={5}><HeroFlow /></motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "200+", label: "Карго-компаний" },
    { value: "<2ч", label: "Среднее время ответа" },
    { value: "98%", label: "Довольных клиентов" },
    { value: "5 000+", label: "Доставок выполнено" },
  ];
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} custom={i}>
              <Card className="p-6 text-center" hover={false}>
                <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">{s.value}</div>
                <p className="mt-1.5 text-sm text-slate-500">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function DeliveryTypesSection() {
  const types = [
    { icon: IconPlane, title: "Авиа", price: "от 10 $", period: "от 1 дня" },
    { icon: IconTrain, title: "ЖД", price: "от 5 $", period: "от 15 дней" },
    { icon: IconTruck, title: "Авто", price: "от 2 $", period: "от 25 дней" },
    { icon: IconShip, title: "Море", price: "от 1 $", period: "от 40 дней" },
  ];
  return (
    <section className="relative py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-red-500/70 tracking-wider uppercase mb-3">Виды доставки</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-white tracking-tight">Любой способ перевозки</motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-3 text-slate-400 text-lg max-w-xl mx-auto">Подберём оптимальный вариант по цене и срокам</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {types.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div key={t.title} variants={fadeUp} custom={i}>
                <Card className="p-6 group text-center cursor-default">
                  <div className="flex justify-center mb-4">
                    <div className="text-slate-500 group-hover:text-red-400 transition-colors duration-300"><Icon /></div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{t.title}</h3>
                  <p className="text-base font-medium text-white/70">{t.price} <span className="text-sm font-normal text-slate-500">/ кг</span></p>
                  <p className="text-sm text-slate-500 mt-1">{t.period}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Опишите груз", desc: "Маршрут, вес, тип товара — оформление заявки за 2 минуты", icon: IconClipboard },
    { num: "02", title: "Получите офферы", desc: "Карго-компании присылают предложения с ценами и сроками", icon: IconOffers },
    { num: "03", title: "Сравните и выберите", desc: "Удобное сравнение всех условий в единой таблице", icon: IconCompareCards },
    { num: "04", title: "Отслеживайте", desc: "Статус заказа в реальном времени до момента получения", icon: IconTracking },
  ];
  return (
    <section className="relative py-28 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />
      <div className="relative max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-red-500/70 tracking-wider uppercase mb-3">Процесс</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-white tracking-tight">Как это работает</motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-3 text-slate-400 text-lg">4 простых шага до выгодной доставки</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid md:grid-cols-2 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.num} variants={fadeUp} custom={i}>
                <Card className="p-7 group h-full">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/[0.08] border border-red-500/[0.1] flex items-center justify-center text-red-400 group-hover:bg-red-500/[0.12] group-hover:border-red-500/[0.2] transition-all duration-300">
                      <Icon />
                    </div>
                    <div className="pt-0.5">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-[11px] font-mono text-red-500/40 tracking-widest">{step.num}</span>
                        <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
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

function WhyUsSection() {
  const features = [
    { icon: IconShield, title: "Проверенные карго", desc: "Каждая компания проходит верификацию перед подключением к платформе" },
    { icon: IconClock, title: "Экономия времени", desc: "Вместо обзвона десятков компаний — офферы приходят к вам" },
    { icon: IconGlobe, title: "Любые маршруты", desc: "Китай, Турция, Европа → Россия, Казахстан, Узбекистан" },
    { icon: IconBarChart, title: "Прозрачное сравнение", desc: "Цена, сроки, условия — всё в одной таблице для быстрого выбора" },
    { icon: IconStar, title: "Рейтинг надёжности", desc: "Система оценки карго-компаний по скорости и качеству работы" },
    { icon: IconBolt, title: "Быстрый старт", desc: "Заявка за 2 минуты, первые офферы — уже через час" },
  ];
  return (
    <section className="relative py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-red-500/70 tracking-wider uppercase mb-3">Преимущества</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-white tracking-tight">Почему выбирают нас</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Card className="p-6 group h-full">
                  <div className="w-10 h-10 rounded-lg bg-red-500/[0.08] border border-red-500/[0.08] flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500/[0.12] group-hover:border-red-500/[0.18] transition-all duration-300">
                    <Icon />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "Сколько стоит использование платформы?", a: "Для клиентов — бесплатно. Платформа зарабатывает на комиссии с карго-компаний." },
    { q: "Какие сроки доставки?", a: "Зависит от типа: авиа — от 7 дней, ЖД — от 14 дней, море — от 25 дней. Точные сроки указывают карго в офферах." },
    { q: "Как проверяются карго-компании?", a: "Каждая компания проходит верификацию: проверка документов, история работы, отзывы клиентов." },
    { q: "Можно ли отменить заявку?", a: "Да, до момента выбора оффера заявку можно отменить или изменить в любое время." },
    { q: "Какие маршруты доступны?", a: "Основные направления: Китай, Турция, Европа → Россия, Казахстан, Узбекистан, Кыргызстан." },
  ];
  return (
    <section className="relative py-28 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-red-500/70 tracking-wider uppercase mb-3">FAQ</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-white tracking-tight">Частые вопросы</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.details key={i} variants={fadeUp} custom={i} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-all duration-300">
              <summary className="flex items-center justify-between p-5 text-white font-medium cursor-pointer list-none select-none">
                <span className="pr-4">{faq.q}</span>
                <svg className="w-4 h-4 text-slate-500 group-open:rotate-45 transition-transform duration-300 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" />
                </svg>
              </summary>
              <div className="px-5 pb-5 -mt-1">
                <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            </motion.details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/20 via-red-500/5 to-transparent p-px">
            <div className="w-full h-full rounded-2xl bg-[#09090b]" />
          </div>
          <div className="relative p-10 md:p-14 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-red-600/[0.06] rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white tracking-tight">Готовы начать?</motion.h2>
              <motion.p variants={fadeUp} custom={1} className="mt-3 text-slate-400 max-w-lg mx-auto">Создайте заявку за 2 минуты и получите предложения от проверенных карго-компаний</motion.p>
              <motion.div variants={fadeUp} custom={2} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth/customer">
                  <button className="group px-7 py-3.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-500 transition-all duration-300 shadow-[0_0_0_1px_rgba(220,38,38,0.5)] hover:shadow-[0_4px_32px_rgba(220,38,38,0.25)] active:scale-[0.98]">
                    Получить предложения
                    <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
                <Link href="/auth/carrier">
                  <button className="px-7 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white font-medium hover:bg-white/[0.05] hover:border-white/[0.15] transition-all active:scale-[0.98]">Я карго-компания</button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <CngoLogo className="h-6 w-6" /><span className="text-white font-semibold tracking-tight">CNGO</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link href="/knowledge-base" className="hover:text-white transition-colors">База знаний</Link>
          <Link href="/auth/customer" className="hover:text-white transition-colors">Для клиентов</Link>
          <Link href="/auth/carrier" className="hover:text-white transition-colors">Для карго</Link>
        </div>
        <p className="text-sm text-slate-600">&copy; 2026 CNGO</p>
      </div>
    </footer>
  );
}

function Background() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-red-600/[0.04] rounded-full blur-[140px]" />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-red-500/20">
      <Background />
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.04] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <CngoLogo className="h-8 w-8" /><span className="text-white font-semibold text-lg tracking-tight">CNGO</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/knowledge-base" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">База знаний</Link>
            <Link href="/auth/carrier" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">Для карго</Link>
            <Link href="/auth/customer">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] transition-all">Войти</button>
            </Link>
          </div>
        </div>
      </nav>
      <HeroSection />
      <StatsSection />
      <DeliveryTypesSection />
      <HowItWorksSection />
      <WhyUsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
