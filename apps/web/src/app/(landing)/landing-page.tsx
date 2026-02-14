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
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-cyan-400">
              <Zap className="h-3.5 w-3.5" />
              Карго-маркетплейс для бизнеса
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
            Получите предложения от проверенных карго-компаний за часы, а не дни.
            Сравните цены, сроки и условия в одном месте.
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <span className="text-white font-semibold">Cargo Market</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-white/30">
          <Link href="/auth/customer" className="hover:text-white/60 transition-colors">Для клиентов</Link>
          <Link href="/auth/carrier" className="hover:text-white/60 transition-colors">Для карго</Link>
        </div>
        <p className="text-sm text-white/20">© 2026 Cargo Market</p>
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <span className="text-white font-semibold text-lg">Cargo Market</span>
          </div>
          <div className="flex items-center gap-4">
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
      <HowItWorksSection />
      <WhyUsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
