"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  Shield,
  Clock,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Send,
  Truck,
  Globe,
  Zap,
  Users,
  Star,
} from "lucide-react";

function CngoLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
    >
      <path d="M15 20 L65 8 L72 22 L28 35 L15 30Z" fill="#FF0A0A" />
      <path d="M8 35 L28 35 L72 22 L78 36 L30 50 L8 45Z" fill="#E50000" />
      <path d="M8 45 L30 50 L78 36 L72 55 L25 65 L5 58Z" fill="#FF0A0A" />
      <path d="M5 58 L25 65 L72 55 L55 72 L20 82 L10 70Z" fill="#CC0000" />
      <path d="M20 82 L55 72 L42 82 L25 88Z" fill="#FF2020" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.1),transparent_50%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} custom={0} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-red-400">
              <CngoLogo className="h-4 w-4" />
              Первый карго маркетплейс
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
          >
            <span className="text-white">Если важно </span>
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              принимать решения
            </span>
            <br />
            <span className="text-white">а не искать </span>
            <span className="text-white/60">исполнителей</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed"
          >
            Вместо обзвона 20 компаний и 2 дней переговоров —{" "}
            <span className="text-white/70">3-5 офферов с ценами за 2 часа.</span>{" "}
            Сравните и выберите лучший.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/customer">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl text-white font-semibold text-lg transition-all duration-200 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] active:scale-[0.98]">
                Получить предложения
                <ArrowRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <a
              href="https://t.me/cargomarketplace_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-medium text-lg hover:bg-white/10 transition-all active:scale-[0.98] backdrop-blur-sm"
            >
              <Send className="inline-block mr-2 h-5 w-5" />
              Оформить через Telegram
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-16 flex items-center justify-center gap-8 text-sm text-white/30"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              Бесплатно
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              От 3 офферов за 2 часа
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              Проверенные карго
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Опишите груз",
      desc: "Маршрут, вес, тип товара — 2 минуты на заявку",
      icon: Package,
    },
    {
      num: "02",
      title: "Получите предложения",
      desc: "Карго-компании пришлют офферы с ценами и сроками",
      icon: Users,
    },
    {
      num: "03",
      title: "Сравните и выберите",
      desc: "Удобное сравнение цен, сроков и условий в таблице",
      icon: BarChart3,
    },
    {
      num: "04",
      title: "Отслеживайте доставку",
      desc: "Статус заказа в реальном времени до момента получения",
      icon: Truck,
    },
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold text-white">
            Как это работает
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-4 text-white/40 text-lg">
            4 простых шага до выгодной доставки
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid md:grid-cols-2 gap-6"
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                variants={fadeUp}
                custom={i}
                className="group relative p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-white/20 tracking-wider">{step.num}</span>
                    <h3 className="text-xl font-semibold text-white mt-1">{step.title}</h3>
                    <p className="mt-2 text-white/40 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "200+", label: "Карго-компаний" },
    { value: "< 2ч", label: "Среднее время ответа" },
    { value: "98%", label: "Довольных клиентов" },
    { value: "5000+", label: "Доставок выполнено" },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-white/40">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PlaneIcon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M58 28l-20-8-6-16h-4l2 16H16l-4-6H8l3 10-3 10h4l4-6h14l-2 16h4l6-16 20-8v-4z" fill="currentColor" />
    </svg>
  );
}

function TrainIcon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="14" y="6" width="36" height="42" rx="6" fill="currentColor" />
      <rect x="18" y="12" width="28" height="14" rx="2" fill="#0a0a0f" />
      <circle cx="22" cy="40" r="3" fill="#0a0a0f" />
      <circle cx="42" cy="40" r="3" fill="#0a0a0f" />
      <rect x="28" y="32" width="8" height="6" rx="1" fill="#0a0a0f" />
      <path d="M20 48l-4 10h4l3-6M44 48l4 10h-4l-3-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function TruckIcon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="2" y="16" width="38" height="26" rx="3" fill="currentColor" />
      <path d="M40 24h12l8 10v8a3 3 0 01-3 3h-17V24z" fill="currentColor" opacity="0.8" />
      <rect x="42" y="28" width="10" height="8" rx="1.5" fill="#0a0a0f" />
      <circle cx="14" cy="46" r="5" fill="currentColor" />
      <circle cx="14" cy="46" r="2.5" fill="#0a0a0f" />
      <circle cx="50" cy="46" r="5" fill="currentColor" />
      <circle cx="50" cy="46" r="2.5" fill="#0a0a0f" />
    </svg>
  );
}

function ShipIcon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M8 38h48l-6 16H14L8 38z" fill="currentColor" />
      <rect x="16" y="22" width="32" height="16" rx="2" fill="currentColor" opacity="0.85" />
      <rect x="20" y="26" width="8" height="8" rx="1" fill="#0a0a0f" />
      <rect x="32" y="26" width="8" height="8" rx="1" fill="#0a0a0f" />
      <rect x="28" y="12" width="8" height="10" rx="1" fill="currentColor" opacity="0.7" />
      <path d="M4 40c4-2 8 0 12-2s8 0 12-2 8 0 12-2 8 0 12-2 8 0 12-2" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function DeliveryTypesSection() {
  const deliveryTypes = [
    {
      icon: PlaneIcon,
      title: "Авиа",
      price: "от 10$",
      period: "от 1 дня",
      gradient: "from-red-500/20 to-orange-500/20",
      borderHover: "hover:border-red-500/30",
      iconColor: "text-red-400 group-hover:text-red-300",
    },
    {
      icon: TrainIcon,
      title: "ЖД",
      price: "от 5$",
      period: "от 15 дней",
      gradient: "from-amber-500/20 to-yellow-500/20",
      borderHover: "hover:border-amber-500/30",
      iconColor: "text-amber-400 group-hover:text-amber-300",
    },
    {
      icon: TruckIcon,
      title: "Авто",
      price: "от 2$",
      period: "от 25 дней",
      gradient: "from-emerald-500/20 to-green-500/20",
      borderHover: "hover:border-emerald-500/30",
      iconColor: "text-emerald-400 group-hover:text-emerald-300",
    },
    {
      icon: ShipIcon,
      title: "Море",
      price: "от 1$",
      period: "от 40 дней",
      gradient: "from-blue-500/20 to-cyan-500/20",
      borderHover: "hover:border-blue-500/30",
      iconColor: "text-blue-400 group-hover:text-blue-300",
    },
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold text-white">
            Работаем с любым видом доставки
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-4 text-white/40 text-lg">
            Выберите оптимальный способ по цене и срокам
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-5"
        >
          {deliveryTypes.map((type, i) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.title}
                variants={fadeUp}
                custom={i}
                className={`group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] ${type.borderHover} transition-all duration-300 text-center cursor-default overflow-hidden`}
              >
                {/* Background glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />

                <div className="relative z-10">
                  <div className="flex justify-center mb-4">
                    <div className={`${type.iconColor} transition-all duration-300 group-hover:scale-110`}>
                      <Icon className="h-14 w-14" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{type.title}</h3>
                  <div className="space-y-1.5">
                    <p className="text-lg font-semibold text-white/80">
                      {type.price} <span className="text-sm font-normal text-white/40">за кг</span>
                    </p>
                    <p className="text-sm text-white/40">
                      Срок: <span className="text-white/60">{type.period}</span>
                    </p>
                  </div>
                </div>
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
    { icon: Shield, title: "Проверенные карго", desc: "Каждая компания проходит верификацию перед подключением" },
    { icon: Clock, title: "Экономия времени", desc: "Вместо обзвона десятков компаний — офферы приходят к вам" },
    { icon: Globe, title: "Любые маршруты", desc: "Китай, Турция, Европа — в Россию, Казахстан, Узбекистан" },
    { icon: BarChart3, title: "Прозрачное сравнение", desc: "Цена, сроки, условия — всё в одной таблице" },
    { icon: Star, title: "Рейтинг надёжности", desc: "Система оценки карго по скорости и качеству" },
    { icon: Zap, title: "Быстрый старт", desc: "Заявка за 2 минуты, первые офферы — через час" },
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold text-white">
            Почему выбирают нас
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all duration-300 group"
              >
                <Icon className="h-8 w-8 text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
                <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-white/40 leading-relaxed">{f.desc}</p>
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
    { q: "Можно ли отменить заявку?", a: "Да, до момента выбора оффера заявку можно отменить или изменить." },
    { q: "Какие маршруты доступны?", a: "Основные направления: Китай, Турция, Европа → Россия, Казахстан, Узбекистан, Кыргызстан." },
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-white text-center mb-16"
        >
          Частые вопросы
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-4"
        >
          {faqs.map((faq, i) => (
            <motion.details
              key={i}
              variants={fadeUp}
              custom={i}
              className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] cursor-pointer"
            >
              <summary className="flex items-center justify-between text-white font-medium list-none">
                {faq.q}
                <ChevronRight className="h-5 w-5 text-white/30 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="mt-4 text-white/40 leading-relaxed">{faq.a}</p>
            </motion.details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="relative p-12 md:p-16 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-cyan-500/[0.05] to-indigo-500/[0.05] overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.1),transparent_70%)]" />

          <div className="relative z-10">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold text-white">
              Готовы начать?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-lg text-white/40 max-w-xl mx-auto">
              Создайте заявку за 2 минуты и получите предложения от проверенных карго-компаний
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/customer">
                <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl text-white font-semibold text-lg hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98]">
                  Получить предложения
                  <ArrowRight className="inline-block ml-2 h-5 w-5" />
                </button>
              </Link>
              <Link href="/auth/carrier">
                <button className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 transition-all active:scale-[0.98]">
                  Я карго-компания
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <CngoLogo className="h-8 w-8" />
          <span className="text-white font-bold tracking-tight">CNGO</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-white/30">
          <Link href="/knowledge-base" className="hover:text-white/60 transition-colors">База знаний</Link>
          <Link href="/auth/customer" className="hover:text-white/60 transition-colors">Для клиентов</Link>
          <Link href="/auth/carrier" className="hover:text-white/60 transition-colors">Для карго</Link>
        </div>
        <p className="text-sm text-white/20">© 2026 CNGO</p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CngoLogo className="h-9 w-9" />
            <span className="text-white font-bold text-lg tracking-tight">CNGO</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/knowledge-base" className="text-sm text-white/50 hover:text-white transition-colors">
              База знаний
            </Link>
            <Link href="/auth/carrier" className="text-sm text-white/50 hover:text-white transition-colors">
              Для карго
            </Link>
            <Link href="/auth/customer">
              <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-all">
                Войти
              </button>
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
