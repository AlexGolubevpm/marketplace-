# Cargo Marketplace — Полная документация проекта

> B2B-платформа для поиска и сравнения логистических услуг по доставке грузов из Китая, Турции, Европы и других стран.
> Домен: **cargomarketplace.ru**

---

## Оглавление

1. [Общее описание продукта](#1-общее-описание-продукта)
2. [Технологический стек](#2-технологический-стек)
3. [Архитектура и структура монорепозитория](#3-архитектура-и-структура-монорепозитория)
4. [Инфраструктура и Docker](#4-инфраструктура-и-docker)
5. [База данных — все таблицы](#5-база-данных--все-таблицы)
6. [Аутентификация и авторизация](#6-аутентификация-и-авторизация)
7. [API-слой (tRPC + REST)](#7-api-слой-trpc--rest)
8. [Лендинг (публичная часть)](#8-лендинг-публичная-часть)
9. [Личный кабинет заказчика (/c)](#9-личный-кабинет-заказчика-c)
10. [Личный кабинет перевозчика (/s)](#10-личный-кабинет-перевозчика-s)
11. [Админ-панель (/admin)](#11-админ-панель-admin)
12. [Telegram-бот](#12-telegram-бот)
13. [База знаний и SEO](#13-база-знаний-и-seo)
14. [Уведомления](#14-уведомления)
15. [Переменные окружения](#15-переменные-окружения)
16. [Бизнес-процессы и связи](#16-бизнес-процессы-и-связи)

---

## 1. Общее описание продукта

**Cargo Marketplace** — B2B-маркетплейс, который соединяет заказчиков грузоперевозок с проверенными логистическими компаниями (перевозчиками).

### Ключевые роли

| Роль | Описание |
|------|----------|
| **Заказчик (Customer)** | Создаёт заявки на перевозку грузов, получает и сравнивает предложения от перевозчиков |
| **Перевозчик (Carrier)** | Получает заявки, подходящие по маршруту и типу доставки, отправляет коммерческие предложения |
| **Администратор (Admin)** | Управляет платформой: модерация, матчинг, контент, аналитика |

### Основной бизнес-цикл

```
Заявка → Матчинг с перевозчиками → Офферы → Выбор оффера → Заказ → Доставка → Завершение
```

### Типы доставки
- Авиа (air), Море (sea), ЖД (rail), Авто (road), Мультимодальный (multimodal)

### Типы грузов
- Обычный (general), Хрупкий (fragile), Опасный (dangerous), Скоропортящийся (perishable), Негабаритный (oversized)

---

## 2. Технологический стек

### Frontend

| Технология | Версия | Назначение |
|-----------|--------|------------|
| **Next.js** | 15.1+ | App Router, SSR/SSG |
| **React** | 19.0 | UI-библиотека |
| **TypeScript** | 5.7+ | Типизация |
| **Tailwind CSS** | 3.4 | Утилитарные стили |
| **Shadcn/UI (Radix)** | — | Компоненты (Dialog, Tabs, Select, Toast и др.) |
| **Framer Motion** | 12.34 | Анимации |
| **Lucide React** | 0.460 | Иконки |
| **Recharts** | 2.14 | Графики (аналитика) |
| **React Hook Form** | 7.53 | Формы |
| **TanStack React Table** | 8.20 | Таблицы с сортировкой/фильтрацией |
| **TanStack React Query** | 5.60 | Кеширование серверных данных |

### Backend / API

| Технология | Версия | Назначение |
|-----------|--------|------------|
| **tRPC** | 11.0 | Type-safe API (основной) |
| **Next.js API Routes** | — | REST-эндпоинты (авторизация, загрузка файлов) |
| **Zod** | 3.24 | Валидация входных данных |
| **SuperJSON** | 2.2 | Сериализация (Date, BigInt и др.) |
| **bcryptjs** | 3.0 | Хеширование паролей |
| **nodemailer** | 8.0 | Отправка email (верификация, сброс пароля) |

### База данных

| Технология | Версия | Назначение |
|-----------|--------|------------|
| **PostgreSQL** | 16 (Alpine) | Основная СУБД |
| **Drizzle ORM** | 0.38 | TypeScript ORM |
| **Drizzle Kit** | 0.30 | Миграции и studio |
| **postgres** (драйвер) | 3.4 | Нативный PostgreSQL-драйвер |

### Инфраструктура

| Технология | Назначение |
|-----------|------------|
| **Docker + Docker Compose** | Контейнеризация |
| **Nginx** | Reverse proxy + SSL termination |
| **Certbot / Let's Encrypt** | SSL-сертификаты |
| **Redis** | Кеширование |
| **MinIO** | S3-совместимое хранилище файлов |
| **grammY** | Telegram Bot Framework |

### Инструменты разработки

| Технология | Назначение |
|-----------|------------|
| **Turborepo** | Монорепозиторий (параллельные билды) |
| **pnpm** | Пакетный менеджер (workspaces) |
| **Vitest** | Юнит-тесты API |

---

## 3. Архитектура и структура монорепозитория

```
cargo-marketplace/
├── apps/
│   ├── web/                          # Next.js приложение (фронт + API)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (landing)/        # Публичная главная страница
│   │   │   │   ├── admin/            # Админ-панель (11 разделов)
│   │   │   │   ├── auth/             # Авторизация (customer, carrier, admin)
│   │   │   │   ├── c/                # ЛК заказчика
│   │   │   │   ├── s/                # ЛК перевозчика
│   │   │   │   ├── knowledge/        # База знаний (SEO-блог)
│   │   │   │   └── api/              # REST API endpoints
│   │   │   ├── components/           # Shared UI-компоненты
│   │   │   ├── lib/                  # Утилиты (auth, telegram, admin-session)
│   │   │   └── trpc/                 # tRPC клиент и провайдер
│   │   └── public/uploads/           # Загруженные файлы (volume)
│   │
│   └── bot/                          # Telegram-бот (grammY)
│       └── src/index.ts
│
├── packages/
│   ├── api/                          # tRPC роутеры и бизнес-логика
│   │   └── src/routers/              # 10 роутеров
│   │       ├── analytics.ts          # Аналитика и KPI
│   │       ├── carriers.ts           # CRUD перевозчиков
│   │       ├── content.ts            # CMS лендинга
│   │       ├── customers.ts          # CRUD заказчиков
│   │       ├── knowledge.ts          # SEO база знаний
│   │       ├── knowledgebase.ts      # Legacy KB (статьи/секции)
│   │       ├── offers.ts             # Офферы перевозчиков
│   │       ├── orders.ts             # Заказы и доставки
│   │       ├── requests.ts           # Заявки на перевозку
│   │       └── settings.ts           # Настройки платформы
│   │
│   ├── db/                           # Drizzle ORM схема и подключение
│   │   ├── src/schema/               # 12 файлов схемы (26 таблиц)
│   │   └── drizzle/                  # SQL-миграции
│   │
│   └── shared/                       # Общие типы и константы
│       └── src/
│           ├── enums.ts              # Все enum-ы (17 штук)
│           ├── constants.ts          # Лейблы, цвета, SLA, KPI
│           └── schemas.ts            # Zod-схемы валидации
│
├── deploy/                           # Nginx конфиг + certbot
├── Dockerfile                        # Production (Next.js)
├── Dockerfile.bot                    # Production (Telegram Bot)
├── docker-compose.prod.yml           # 7 сервисов
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 4. Инфраструктура и Docker

### Архитектура сервисов

```
┌─────────────────────────────────────────────────────┐
│                    NGINX (:80/:443)                   │
│              Reverse Proxy + SSL (Let's Encrypt)      │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │    Next.js Web      │
          │    (:3000)          │
          │  Frontend + API     │
          └──┬──────┬───────┬──┘
             │      │       │
    ┌────────▼┐  ┌──▼───┐  ┌▼────────┐
    │ Postgres │  │ Redis│  │  MinIO  │
    │  :5432   │  │:6379 │  │:9000/01 │
    └─────────┘  └──────┘  └─────────┘

          ┌──────────────────┐
          │   Telegram Bot   │→ Web API (internal)
          └──────────────────┘

          ┌──────────────────┐
          │   Certbot        │ (auto-renew 12h)
          └──────────────────┘
```

| Сервис | Образ | Порт | Назначение |
|--------|-------|------|------------|
| **web** | Custom (Dockerfile) | 3000 | Next.js приложение |
| **bot** | Custom (Dockerfile.bot) | — | Telegram-бот (polling) |
| **postgres** | postgres:16-alpine | 5432 | База данных |
| **redis** | redis:7-alpine | 6379 | Кеш |
| **minio** | minio/minio:latest | 9000/9001 | S3-хранилище |
| **nginx** | nginx:alpine | 80/443 | Reverse proxy + SSL |
| **certbot** | certbot/certbot | — | SSL-сертификаты |

### Volumes
- `postgres_data` — данные PostgreSQL
- `redis_data` — данные Redis
- `minio_data` — загруженные файлы (S3)
- `uploads_data` — изображения контента лендинга

---

## 5. База данных — все таблицы

### Диаграмма связей (ER)

```
customers ──1:N──▶ requests ──1:N──▶ offers ──1:1──▶ orders
                       │                                │
                       ▼                     ┌──────────┤
               request_carrier_              │          │
               matches                       ▼          ▼
                       │              order_status_  order_documents
                       ▼              history
                   carriers
                   ├──1:N──▶ carrier_regions
                   └──1:N──▶ carrier_delivery_types

customers ──1:N──▶ conversations ◀──N:1── carriers
                       │
                       ▼
                    messages

admins ──1:N──▶ audit_logs
        ──1:N──▶ internal_comments
        ──1:N──▶ landing_content
        ──1:N──▶ knowledge_articles

knowledge_categories ──1:N──▶ knowledge_articles
knowledge_articles ──M:N──▶ knowledge_tags (через knowledge_article_tags)
```

### Полный перечень таблиц (26)

| # | Таблица | Кол-во колонок | Назначение |
|---|---------|----------------|------------|
| 1 | `customers` | 20 | Заказчики (email, phone, Telegram, OAuth) |
| 2 | `carriers` | 17 | Перевозчики (компания, контакт, SLA-рейтинг) |
| 3 | `carrier_regions` | 6 | Регионы обслуживания (country_from → country_to) |
| 4 | `carrier_delivery_types` | 5 | Виды доставки перевозчика (air/sea/rail/road) |
| 5 | `requests` | 22 | Заявки на перевозку (маршрут, груз, бюджет, статус) |
| 6 | `request_carrier_matches` | 7 | Матчинг заявок с перевозчиками |
| 7 | `offers` | 16 | Коммерческие предложения (цена, сроки, условия) |
| 8 | `orders` | 17 | Подтверждённые заказы (трекинг, комиссия) |
| 9 | `order_status_history` | 8 | История статусов заказов |
| 10 | `order_documents` | 8 | Документы: инвойсы, ТД, коносаменты, фото |
| 11 | `conversations` | 6 | Чаты (заказчик ↔ перевозчик) |
| 12 | `messages` | 7 | Сообщения (текст + файлы) |
| 13 | `admins` | 8 | Администраторы (email, роль, статус) |
| 14 | `audit_logs` | 10 | Журнал действий админов (JSONB old/new values) |
| 15 | `internal_comments` | 6 | Внутренние заметки админов |
| 16 | `notifications` | 10 | Уведомления (Telegram, email, SMS, in_app) |
| 17 | `sessions` | 8 | JWT refresh-токены |
| 18 | `landing_content` | 7 | CMS-контент лендинга (JSONB) |
| 19 | `sla_configs` | 6 | Конфигурация SLA-метрик |
| 20 | `kb_sections` | 8 | Секции базы знаний (legacy) |
| 21 | `kb_articles` | 10 | Статьи базы знаний (legacy) |
| 22 | `knowledge_categories` | 12 | Категории SEO-базы знаний |
| 23 | `knowledge_articles` | 20 | SEO-статьи (markdown, FAQ, sources) |
| 24 | `knowledge_tags` | 8 | Теги статей |
| 25 | `knowledge_article_tags` | 2 | Связь статей ↔ тегов (M2M) |
| 26 | `knowledge_redirects` | 5 | 301-редиректы для SEO |

### Ключевые enum-ы (17)

| Enum | Значения |
|------|----------|
| `customer_status` | active, banned, inactive |
| `carrier_status` | active, suspended, blocked, pending_review |
| `delivery_type` | air, sea, rail, road, multimodal |
| `cargo_type` | general, fragile, dangerous, perishable, oversized |
| `request_status` | new, matching, offers_received, offer_selected, expired, closed, cancelled, duplicate, resubmitted |
| `request_source` | telegram_bot, web_form, admin_manual, api |
| `delivery_preference` | air, sea, rail, road, any |
| `offer_status` | active, selected, rejected, expired, hidden, suspicious |
| `order_status` | payment_pending, confirmed, awaiting_shipment, in_transit, customs, customs_hold, delivered, completed, cancelled, dispute, on_hold, partially_delivered, return |
| `change_source` | admin, system, carrier, customer, webhook |
| `document_type` | invoice, customs_declaration, bill_of_lading, photo, contract, other |
| `admin_role` | super_admin, operator, analyst, content_manager |
| `admin_status` | active, disabled |
| `recipient_type` | carrier, customer, admin |
| `notification_channel` | telegram, email, sms, in_app |
| `notification_status` | pending, sent, delivered, failed |
| `sla_severity` | warning, critical |

---

## 6. Аутентификация и авторизация

### Три системы авторизации

#### 1. Заказчик (Customer)
- **Email + пароль** — регистрация и вход
- **Telegram** — вход через Telegram Login Widget (HMAC-верификация)
- **Yandex OAuth** — вход через Яндекс ID
- **Сброс пароля** — email с токеном (nodemailer)
- **Верификация email** — подтверждение при регистрации

#### 2. Перевозчик (Carrier)
- **Email + пароль** — регистрация и вход
- Поля при регистрации: название компании, контактное лицо, телефон

#### 3. Администратор (Admin)
- **Email + пароль** — только вход (создание через seed)
- **HMAC-подпись** — сессия подписывается для защиты от подмены
- **Auto-seed** — при первом запуске создаётся super_admin

### Хранение сессий

```
localStorage:
  ├── cargo_customer_session  → { logged_in, id, name, username, role, login_at }
  ├── cargo_carrier_session   → { logged_in, id, name, email, role, login_at }
  └── cargo_admin_session     → { logged_in, id, email, full_name, role, sig, login_at }
```

- Админская сессия подписывается HMAC (SHA-256)
- Заголовок `x-admin-session` кодируется в Base64 (поддержка кириллицы)
- При каждом tRPC-запросе подпись проверяется на сервере

### REST-эндпоинты авторизации

| Метод | URL | Назначение |
|-------|-----|------------|
| POST | `/api/auth` | Вход/регистрация клиента или перевозчика |
| POST | `/api/admin-auth` | Вход администратора |
| GET | `/api/auth/yandex` | Начало OAuth-потока Яндекс |
| GET | `/api/auth/yandex/callback` | OAuth callback |
| POST | `/api/auth/verify-tg` | Верификация Telegram-авторизации |
| POST | `/api/auth/reset-password` | Сброс пароля |
| POST | `/api/auth/resolve` | Определение роли по email/телефону |

---

## 7. API-слой (tRPC + REST)

### tRPC-роутеры (type-safe API)

#### `requests` — Заявки на перевозку

| Процедура | Тип | Описание |
|-----------|-----|----------|
| `list` | query | Список заявок (пагинация, фильтры) |
| `byId` | query | Заявка по ID |
| `create` | mutation | Создание заявки |
| `update` | mutation | Обновление заявки |
| `delete` | mutation | Удаление заявки |
| `updateStatus` | mutation | Смена статуса (с валидацией переходов) |
| `myRequests` | query | Заявки текущего заказчика |
| `forCarrier` | query | Заявки, доступные перевозчику |

#### `offers` — Коммерческие предложения

| Процедура | Тип | Описание |
|-----------|-----|----------|
| `list` | query | Все офферы (админ) |
| `byId` | query | Оффер по ID |
| `forRequest` | query | Офферы к конкретной заявке |
| `create` | mutation | Создание оффера |
| `update` | mutation | Обновление оффера |
| `delete` | mutation | Удаление оффера |
| `select` | mutation | Выбор оффера заказчиком |
| `myOffers` | query | Офферы текущего перевозчика |

#### `orders` — Заказы

| Процедура | Тип | Описание |
|-----------|-----|----------|
| `list` | query | Все заказы |
| `byId` | query | Заказ по ID |
| `create` | mutation | Создание заказа |
| `updateStatus` | mutation | Обновление статуса |
| `addDocument` | mutation | Прикрепление документа |
| `myOrders` | query | Заказы текущего пользователя |

#### `customers` — Заказчики

| Процедура | Тип | Описание |
|-----------|-----|----------|
| `list` | query | Все клиенты |
| `byId` | query | Клиент по ID |
| `create` | mutation | Создание клиента |
| `update` | mutation | Обновление профиля |
| `delete` | mutation | Удаление |
| `updateStatus` | mutation | Бан/разбан |

#### `carriers` — Перевозчики

| Процедура | Тип | Описание |
|-----------|-----|----------|
| `list` | query | Все перевозчики |
| `byId` | query | Перевозчик по ID |
| `create` | mutation | Создание |
| `update` | mutation | Обновление |
| `delete` | mutation | Удаление |
| `updateStatus` | mutation | Активация/блокировка |

#### `analytics` — Аналитика

| Процедура | Тип | Описание |
|-----------|-----|----------|
| `dashboard` | query | KPI дашборда (заявки, офферы, конверсия, SLA) |
| `recentRequests` | query | Последние 7 заявок |

#### `content` — CMS лендинга

| Процедура | Тип | Описание |
|-----------|-----|----------|
| `getPublished` | query | Опубликованный контент |
| `getDraft` | query | Черновик |
| `update` | mutation | Обновление секции |
| `publish` | mutation | Публикация |

#### `knowledge` — SEO база знаний

| Процедура | Тип | Описание |
|-----------|-----|----------|
| `articles.list` | query | Список статей |
| `articles.bySlug` | query | Статья по slug |
| `articles.create` | mutation | Создание |
| `articles.update` | mutation | Обновление |
| `articles.delete` | mutation | Удаление |
| `categories.*` | CRUD | Категории |
| `tags.*` | CRUD | Теги |
| `redirects.*` | CRUD | 301-редиректы |

#### `settings` — Настройки

| Процедура | Тип | Описание |
|-----------|-----|----------|
| `get` | query | Все настройки |
| `update` | mutation | Обновление (SEO-коды, SLA) |

### REST API эндпоинты

| Метод | URL | Назначение |
|-------|-----|------------|
| GET/POST | `/api/requests` | CRUD заявок (для бота) |
| GET | `/api/requests/[id]` | Детали заявки |
| GET/POST | `/api/offers` | CRUD офферов |
| GET/POST | `/api/orders` | CRUD заказов |
| GET/POST | `/api/customers` | CRUD клиентов |
| GET/POST | `/api/carriers` | CRUD перевозчиков |
| GET/POST | `/api/chats` | Сообщения чатов |
| POST | `/api/upload` | Загрузка файлов |
| GET | `/api/uploads/[...path]` | Отдача файлов |
| POST | `/api/documents` | Документы заказов |
| GET | `/api/events` | SSE-поток событий |
| POST | `/api/notifications/send` | Отправка уведомлений |
| POST | `/api/revalidate` | ISR-ревалидация |
| GET | `/api/analytics-config` | Конфиг Metrika/GA |
| GET | `/api/knowledge-redirect-check` | Проверка редиректов |

---

## 8. Лендинг (публичная часть)

**URL:** `/` (корень сайта)

### Секции (управляются из админки)

| # | Секция | Содержимое |
|---|--------|------------|
| 1 | **Branding** | Логотип, текст логотипа, favicon |
| 2 | **Hero** | Заголовок (3 части), подзаголовок, 2 CTA, 3 чекмарка |
| 3 | **Stats** | 4 метрики (200+ перевозчиков, <2ч ответ, 98% и др.) |
| 4 | **Delivery Types** | 4 карточки транспорта с ценами и сроками |
| 5 | **How It Works** | 4 шага с иконками |
| 6 | **Why Us** | 6 карточек преимуществ |
| 7 | **FAQ** | Раскрывающиеся Q&A |
| 8 | **CTA** | Финальный призыв + 2 кнопки |

### Навигация
- Якоря: Доставка, Как работает, Преимущества, База знаний
- Кнопки входа: для карго и для клиентов
- Футер: ссылки, копирайт

### Технические особенности
- Контент из БД (`trpc.content.getPublished`) с fallback на дефолты
- Framer Motion анимации (fade-up stagger)
- Полностью адаптивный (mobile-first)

---

## 9. Личный кабинет заказчика (/c)

| URL | Страница | Функционал |
|-----|----------|------------|
| `/c/requests` | Мои заявки | Список заявок с офферами и статусами |
| `/c/requests/new` | Новая заявка | Форма: маршрут, вес, объём, тип, бюджет, дата |
| `/c/requests/[id]` | Детали заявки | Информация + офферы + выбор |
| `/c/archive` | Архив | Завершённые/закрытые заявки |
| `/c/chats` | Чаты | Диалоги с перевозчиками |
| `/c/profile` | Профиль | Имя, email, телефон, компания; статистика |

**Навигация:** Desktop — верхнее меню; Mobile — bottom bar (Заявки, Создать, Чаты, Профиль)

---

## 10. Личный кабинет перевозчика (/s)

| URL | Страница | Функционал |
|-----|----------|------------|
| `/s/requests` | Доступные заявки | Заявки по маршрутам и типам доставки |
| `/s/requests/[id]` | Детали заявки | Информация + форма создания оффера |
| `/s/offers` | Мои офферы | Все отправленные предложения |
| `/s/offers/[id]` | Детали оффера | Информация + редактирование |
| `/s/chats` | Чаты | Диалоги с заказчиками |
| `/s/profile` | Профиль | Данные компании |

**Навигация:** Desktop — верхнее меню (Заявки, Офферы, Чаты, Профиль); Mobile — bottom bar

---

## 11. Админ-панель (/admin)

### Вход
- URL: `/auth/admin`, email + пароль (bcrypt)
- Тёмная тема с градиентами
- Auto-seed super_admin при первом запуске

### Боковая навигация

| Иконка | Раздел | URL |
|--------|--------|-----|
| LayoutDashboard | Дашборд | `/admin/dashboard` |
| FileText | Заявки | `/admin/requests` |
| Tag | Офферы | `/admin/offers` |
| Package | Заказы | `/admin/orders` |
| Truck | Перевозчики | `/admin/carriers` |
| Users | Клиенты | `/admin/customers` |
| MessageCircle | Чаты | `/admin/chats` |
| BarChart3 | Аналитика | `/admin/analytics` |
| BookOpen | База знаний | `/admin/knowledgebase` |
| PanelLeft | Контент | `/admin/content` |
| Settings | Настройки | `/admin/settings` |

### Дашборд — KPI

| Метрика | Хорошо | Допустимо | Плохо |
|---------|--------|-----------|-------|
| Среднее время первого ответа | < 60 мин | < 240 мин | > 240 мин |
| Офферов на заявку | > 3 | > 1 | < 1 |
| Конверсия | > 60% | > 30% | < 30% |
| Нарушения SLA (24ч) | 0 | ≤ 3 | > 3 |

- Периоды: сегодня, 7д, 30д, 90д, год
- Виджет последних заявок (7 шт.)
- Быстрые действия (добавить перевозчика, создать заявку и др.)
- Авто-обновление каждые 10 секунд

### Разделы админки

**Заявки** — таблица: ID, клиент, маршрут, вес, дата, статус, кол-во офферов, источник

**Офферы** — CRUD: ID заявки, перевозчик, цена, валюта, сроки, тип доставки

**Заказы** — управление статусами, трекинг, документы, ценообразование (USD/EUR/RUB/CNY)

**Перевозчики** — CRUD + SLA-рейтинг, статистика (офферы/выигрыши), статус

**Клиенты** — CRUD + бан/разбан, Telegram-данные, статистика

**Чаты** — мониторинг переписок (read-only), фильтр по клиенту/перевозчику

**База знаний** — 4 вкладки: Статьи, Категории, Теги, Редиректы. Markdown + FAQ + SEO

**Контент** — визуальный редактор 8 секций лендинга с drag-and-drop загрузкой изображений

**Настройки** — SEO-коды (Metrika, GA4, Search Console, Вебмастер), SLA-пороги, часовой пояс, валюта

### Роли администраторов

| Роль | Описание |
|------|----------|
| `super_admin` | Полный доступ |
| `operator` | Управление заявками, офферами, заказами |
| `analyst` | Просмотр аналитики |
| `content_manager` | Контент и база знаний |

---

## 12. Telegram-бот

### Технология
- **Framework:** grammY (Node.js)
- **Deployment:** отдельный Docker-контейнер (long polling)
- **Связь:** REST API через `INTERNAL_API_URL` (Docker-сеть)

### Функционал для заказчиков
- `/start` → выбор роли
- Пошаговое создание заявки (9 шагов):
  1. Страна отправления (inline-кнопки: CN, TR, DE, IT, RU, KZ, UZ, KG)
  2. Город отправления
  3. Страна назначения
  4. Город назначения
  5. Описание груза
  6. Вес (кг)
  7. Объём (м³)
  8. Тип доставки
  9. Подтверждение
- `/myreqs` — просмотр заявок со статусами
- Ссылка на веб-ЛК (HMAC-подпись)

### Функционал для перевозчиков
- Просмотр новых заявок
- Ссылка на веб-ЛК

---

## 13. База знаний и SEO

### Маршруты

| URL | Страница |
|-----|----------|
| `/knowledge` | Главная: категории + избранные статьи |
| `/knowledge/[slug]` | Статья |
| `/knowledge/category/[slug]` | Статьи категории |
| `/knowledge/tag/[slug]` | Статьи по тегу |
| `/knowledge/faq` | FAQ (из всех статей) |
| `/knowledge/search` | Поиск |

### SEO-оптимизация

**Для статей:** meta title, meta description, canonical URL, OG-теги, FAQ Schema, author/reviewer

**Для категорий/тегов:** meta title, meta description, canonical override

**Инфраструктура:**
- `robots.txt` — Allow: `/`, `/knowledge/`; Disallow: `/admin/`, `/api/`, `/c/`, `/s/`, `/auth/`
- `sitemap.xml` — основные страницы
- `/knowledge/sitemap.xml` — статьи, категории, теги
- 301-редиректы через админку
- Автоматическая вставка Яндекс.Метрики и GA4

### Контент статей
- Markdown + расширенный синтаксис (`:::callout`, `:::steps`, `:::comparison`)
- FAQ-блоки (вопрос-ответ)
- Источники (title + url)
- Статусы: draft / published
- Featured-флаг

---

## 14. Уведомления

### Каналы

| Канал | Статус | Описание |
|-------|--------|----------|
| **Telegram** | Работает | Через Bot API |
| **Email** | Работает | SMTP (nodemailer) |
| **SMS** | Подготовлен | Enum есть, реализация TBD |
| **In-App** | Подготовлен | Enum есть, реализация TBD |

### Типы событий

| Событие | Получатель |
|---------|------------|
| `request_status_changed` | Заказчик |
| `new_offer` | Заказчик |
| `order_status_changed` | Заказчик / Перевозчик |
| `new_message` | Заказчик / Перевозчик |
| `carrier_new_request` | Перевозчик |

---

## 15. Переменные окружения

| Переменная | Обяз. | Описание |
|-----------|-------|----------|
| `DATABASE_URL` | Да | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | Да | Пароль PostgreSQL |
| `JWT_SECRET` | Да | Секрет JWT |
| `JWT_REFRESH_SECRET` | Да | Секрет refresh-токенов |
| `TELEGRAM_BOT_TOKEN` | Да | Токен Telegram-бота |
| `NEXT_PUBLIC_APP_URL` | Да | Публичный URL |
| `TG_AUTH_SECRET` | Нет | HMAC-секрет Telegram auth |
| `YANDEX_CLIENT_ID` | Нет | Yandex OAuth |
| `YANDEX_CLIENT_SECRET` | Нет | Yandex OAuth |
| `YANDEX_REDIRECT_URI` | Нет | Yandex OAuth callback |
| `SMTP_HOST` | Нет | SMTP сервер |
| `SMTP_PORT` | Нет | SMTP порт (587) |
| `SMTP_USER` | Нет | SMTP логин |
| `SMTP_PASS` | Нет | SMTP пароль |
| `SMTP_FROM` | Нет | Адрес отправителя |
| `MINIO_ROOT_USER` | Нет | MinIO логин |
| `MINIO_ROOT_PASSWORD` | Нет | MinIO пароль |
| `REDIS_URL` | Нет | Redis connection |
| `S3_ENDPOINT` | Нет | S3/MinIO endpoint |
| `S3_ACCESS_KEY` | Нет | S3 access key |
| `S3_SECRET_KEY` | Нет | S3 secret key |
| `S3_BUCKET` | Нет | S3 bucket |
| `ADMIN_SESSION_SECRET` | Нет | HMAC-секрет админ-сессии |

---

## 16. Бизнес-процессы и связи

### Жизненный цикл заявки (Request)

```
   ┌─────────┐     ┌──────────┐     ┌─────────────────┐
   │   NEW   │────▶│ MATCHING │────▶│ OFFERS_RECEIVED │
   └────┬────┘     └──────────┘     └────────┬────────┘
        │                                     │
        ├──▶ CANCELLED              ┌─────────▼─────────┐
        ├──▶ DUPLICATE              │  OFFER_SELECTED    │
        │                           └─────────┬─────────┘
        │                                     │
        │   ┌─────────┐             ┌─────────▼─────────┐
        └──▶│ EXPIRED │────▶ RESUBMITTED     CLOSED     │
            └─────────┘             └───────────────────┘
```

### Жизненный цикл заказа (Order)

```
  PAYMENT_PENDING → CONFIRMED → AWAITING_SHIPMENT → IN_TRANSIT
       │                                                │
       ▼                                          ┌─────▼─────┐
   CANCELLED                                      │  CUSTOMS   │
                                                   └─────┬─────┘
                                                         │
                                                   ┌─────▼──────────┐
                                                   │  CUSTOMS_HOLD   │
                                                   └─────┬──────────┘
                                                         │
                                                   ┌─────▼─────┐
                                                   │ DELIVERED  │
                                                   └─────┬─────┘
                                                         │
              ┌─────────┐                          ┌─────▼─────┐
              │ DISPUTE  │◀────────────────────────│ COMPLETED  │
              └────┬────┘                          └───────────┘
                   │
              ┌────▼────┐
              │ RETURN   │
              └─────────┘

  ON_HOLD — можно вернуть в любой предыдущий статус
```

### Матчинг заявки с перевозчиками

```
1. Заказчик создаёт заявку (web / telegram / admin)
2. Админ меняет статус → "matching"
3. Система находит перевозчиков по:
   - carrier_regions (country_from → country_to)
   - carrier_delivery_types (air/sea/rail/road)
4. Создаются записи в request_carrier_matches
5. Перевозчикам отправляются уведомления (Telegram)
6. Перевозчики создают офферы (цена, сроки, условия)
7. Заказчик сравнивает и выбирает оффер
8. Создаётся заказ (order) с трекингом и комиссией
```

### Связи между сущностями

```
Customer ──1:N──▶ Request ──1:N──▶ Offer ──1:1──▶ Order
                      │                              │
                      ▼                    ┌─────────┤
              Request_Carrier_Match   Order_History  Order_Document
                      │
                      ▼
                   Carrier ──1:N──▶ Carrier_Region
                            ──1:N──▶ Carrier_Delivery_Type

Customer ──1:N──▶ Conversation ◀──N:1── Carrier
                      │
                      ▼
                   Message

Admin ──1:N──▶ Audit_Log
       ──1:N──▶ Internal_Comment
       ──1:N──▶ Landing_Content
       ──1:N──▶ Knowledge_Article
```

---

*Документация сгенерирована на основе анализа исходного кода проекта.*
