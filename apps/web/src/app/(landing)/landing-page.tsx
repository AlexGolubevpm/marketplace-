"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Send, Check, Plane, Ship, TrainFront, Truck, ClipboardList, FileText, BarChart3, MapPin, Shield, Clock, Globe, Star, Zap, ChevronDown, User, LogIn } from "lucide-react";

/* ── Auth helpers ── */
type SessionInfo = { name: string; role: string; href: string } | null;

function useSession(): SessionInfo {
  const [session, setSession] = useState<SessionInfo>(null);
  useEffect(() => {
    // Check customer/carrier session
    try {
      const raw = localStorage.getItem("cargo_session");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.logged_in) {
          setSession({
            name: s.name || s.username || "User",
            role: s.role,
            href: s.role === "carrier" ? "/s/requests" : "/c/requests",
          });
          return;
        }
      }
    } catch {}
    // Check admin session
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

/* ── Logo ── */
function CngoLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className={className}>
      <path d="M15 20 L65 8 L72 22 L28 35 L15 30Z" fill="#DC2626" />
      <path d="M8 35 L28 35 L72 22 L78 36 L30 50 L8 45Z" fill="#B91C1C" />
      <path d="M8 45 L30 50 L78 36 L72 55 L25 65 L5 58Z" fill="#DC2626" />
      <path d="M5 58 L25 65 L72 55 L55 72 L20 82 L10 70Z" fill="#991B1B" />
      <path d="M20 82 L55 72 L42 82 L25 88Z" fill="#EF4444" />
    </svg>
  );
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
function Navbar() {
  const session = useSession();
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <CngoLogo className="h-8 w-8" />
          <span className="text-gray-900 font-bold text-lg tracking-tight">CNGO</span>
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
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-50 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} custom={0} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-100 bg-red-50 text-[13px] text-red-600 font-medium">
              <CngoLogo className="h-3.5 w-3.5" /> Первый карго маркетплейс
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-gray-900">Если важно </span>
            <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">принимать решения</span>
            <br />
            <span className="text-gray-900">а не искать </span>
            <span className="text-gray-400">исполнителей</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mt-6 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Вместо обзвона 20 компаний и 2 дней переговоров —{" "}
            <span className="text-gray-900 font-medium">3–5 офферов с ценами за 2 часа.</span>{" "}
            Сравните и выберите лучший.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/customer">
              <button className="group px-7 py-3.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30 active:scale-[0.98]">
                Получить предложения
                <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <a href="https://t.me/cargomarketplace_bot" target="_blank" rel="noopener noreferrer" className="px-7 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]">
              <Send className="inline-block mr-2 h-4 w-4 text-gray-400" /> Через Telegram
            </a>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            {["Бесплатно для клиентов", "От 3 офферов за 2 часа", "Проверенные карго-компании"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-red-500" />{t}
              </div>
            ))}
          </motion.div>
          <motion.div variants={fadeUp} custom={5}>
            <div className="hidden md:flex items-center justify-center gap-2 mt-16">
              {[
                { label: "Заявка", icon: <ClipboardList className="w-5 h-5" /> },
                { label: "Офферы", icon: <FileText className="w-5 h-5" /> },
                { label: "Сравнение", icon: <BarChart3 className="w-5 h-5" /> },
                { label: "Доставка", icon: <MapPin className="w-5 h-5" /> },
              ].map((n, i) => (
                <div key={n.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center text-red-500">
                      {n.icon}
                    </div>
                    <span className="text-[11px] text-gray-400 tracking-wide">{n.label}</span>
                  </div>
                  {i < 3 && (
                    <div className="flex items-center mb-5">
                      <div className="w-12 h-px bg-gradient-to-r from-gray-200 to-gray-100" />
                      <ArrowRight className="w-3 h-3 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Stats ── */
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
function DeliveryTypesSection() {
  const types = [
    { icon: Plane, title: "Авиа", price: "от 10 $", period: "от 1 дня", color: "text-blue-500 bg-blue-50 border-blue-100" },
    { icon: TrainFront, title: "ЖД", price: "от 5 $", period: "от 15 дней", color: "text-orange-500 bg-orange-50 border-orange-100" },
    { icon: Truck, title: "Авто", price: "от 2 $", period: "от 25 дней", color: "text-green-500 bg-green-50 border-green-100" },
    { icon: Ship, title: "Море", price: "от 1 $", period: "от 40 дней", color: "text-cyan-500 bg-cyan-50 border-cyan-100" },
  ];
  return (
    <section id="delivery" className="relative py-24 px-6 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-red-500 tracking-wider uppercase mb-3">Виды доставки</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">Любой способ перевозки</motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-3 text-gray-500 text-lg max-w-xl mx-auto">Подберём оптимальный вариант по цене и срокам</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {types.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div key={t.title} variants={fadeUp} custom={i}>
                <Card className="p-6 group text-center cursor-default hover:-translate-y-1">
                  <div className="flex justify-center mb-4">
                    <div className={`w-14 h-14 rounded-xl border flex items-center justify-center ${t.color} transition-all duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.title}</h3>
                  <p className="text-base font-medium text-gray-700">{t.price} <span className="text-sm font-normal text-gray-400">/ кг</span></p>
                  <p className="text-sm text-gray-400 mt-1">{t.period}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ── How It Works ── */
function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Опишите груз", desc: "Маршрут, вес, тип товара — оформление заявки за 2 минуты", icon: ClipboardList, color: "text-red-500 bg-red-50 border-red-100" },
    { num: "02", title: "Получите офферы", desc: "Карго-компании присылают предложения с ценами и сроками", icon: FileText, color: "text-blue-500 bg-blue-50 border-blue-100" },
    { num: "03", title: "Сравните и выберите", desc: "Удобное сравнение всех условий в единой таблице", icon: BarChart3, color: "text-green-500 bg-green-50 border-green-100" },
    { num: "04", title: "Отслеживайте", desc: "Статус заказа в реальном времени до момента получения", icon: MapPin, color: "text-purple-500 bg-purple-50 border-purple-100" },
  ];
  return (
    <section id="how-it-works" className="relative py-24 px-6 bg-gray-50 scroll-mt-20">
      <div className="relative max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-red-500 tracking-wider uppercase mb-3">Процесс</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">Как это работает</motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-3 text-gray-500 text-lg">4 простых шага до выгодной доставки</motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid md:grid-cols-2 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.num} variants={fadeUp} custom={i}>
                <Card className="p-7 group h-full hover:-translate-y-1">
                  <div className="flex items-start gap-5">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center ${step.color} transition-all duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="pt-0.5">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-[11px] font-mono text-gray-300 tracking-widest">{step.num}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
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

/* ── Why Us ── */
function WhyUsSection() {
  const features = [
    { icon: Shield, title: "Проверенные карго", desc: "Каждая компания проходит верификацию перед подключением к платформе", color: "text-red-500 bg-red-50" },
    { icon: Clock, title: "Экономия времени", desc: "Вместо обзвона десятков компаний — офферы приходят к вам", color: "text-blue-500 bg-blue-50" },
    { icon: Globe, title: "Любые маршруты", desc: "Китай, Турция, Европа \u2192 Россия, Казахстан, Узбекистан", color: "text-green-500 bg-green-50" },
    { icon: BarChart3, title: "Прозрачное сравнение", desc: "Цена, сроки, условия — всё в одной таблице для быстрого выбора", color: "text-purple-500 bg-purple-50" },
    { icon: Star, title: "Рейтинг надёжности", desc: "Система оценки карго-компаний по скорости и качеству работы", color: "text-orange-500 bg-orange-50" },
    { icon: Zap, title: "Быстрый старт", desc: "Заявка за 2 минуты, первые офферы — уже через час", color: "text-cyan-500 bg-cyan-50" },
  ];
  return (
    <section id="why-us" className="relative py-24 px-6 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-red-500 tracking-wider uppercase mb-3">Преимущества</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">Почему выбирают нас</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger} className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Card className="p-6 group h-full hover:-translate-y-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
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
function FAQSection() {
  const faqs = [
    { q: "Сколько стоит использование платформы?", a: "Для клиентов — бесплатно. Платформа зарабатывает на комиссии с карго-компаний." },
    { q: "Какие сроки доставки?", a: "Зависит от типа: авиа — от 7 дней, ЖД — от 14 дней, море — от 25 дней. Точные сроки указывают карго в офферах." },
    { q: "Как проверяются карго-компании?", a: "Каждая компания проходит верификацию: проверка документов, история работы, отзывы клиентов." },
    { q: "Можно ли отменить заявку?", a: "Да, до момента выбора оффера заявку можно отменить или изменить в любое время." },
    { q: "Какие маршруты доступны?", a: "Основные направления: Китай, Турция, Европа \u2192 Россия, Казахстан, Узбекистан, Кыргызстан." },
  ];
  return (
    <section className="relative py-24 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
          <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-red-500 tracking-wider uppercase mb-3">FAQ</motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">Частые вопросы</motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-3">
          {faqs.map((faq, i) => (
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
function CTASection() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-red-600 to-red-700 p-10 md:p-14 text-center shadow-2xl shadow-red-600/20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10">
              <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-white tracking-tight">Готовы начать?</motion.h2>
              <motion.p variants={fadeUp} custom={1} className="mt-3 text-red-100 max-w-lg mx-auto">Создайте заявку за 2 минуты и получите предложения от проверенных карго-компаний</motion.p>
              <motion.div variants={fadeUp} custom={2} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth/customer">
                  <button className="group px-7 py-3.5 rounded-xl font-semibold text-red-600 bg-white hover:bg-gray-50 transition-all duration-300 shadow-lg active:scale-[0.98]">
                    Получить предложения
                    <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
                <Link href="/auth/carrier">
                  <button className="px-7 py-3.5 rounded-xl border border-white/30 text-white font-medium hover:bg-white/10 transition-all active:scale-[0.98]">
                    <Truck className="inline-block mr-2 h-4 w-4" />Я карго-компания
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
function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-gray-100">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <CngoLogo className="h-6 w-6" /><span className="text-gray-900 font-semibold tracking-tight">CNGO</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/knowledge-base" className="hover:text-gray-900 transition-colors">База знаний</Link>
          <Link href="/auth/customer" className="hover:text-gray-900 transition-colors">Вход для клиентов</Link>
          <Link href="/auth/carrier" className="hover:text-gray-900 transition-colors">Вход для карго</Link>
        </div>
        <p className="text-sm text-gray-300">&copy; 2026 CNGO</p>
      </div>
    </footer>
  );
}

/* ── Main Landing ── */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-red-100">
      <Navbar />
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
