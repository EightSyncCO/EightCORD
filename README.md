# ShowelGrays

Минималистичный аналог Discord с голосовыми и текстовыми чатами.  
Чёрный космический интерфейс, анимации, частицы, шумоподавление.

При входе на сайт вы автоматически подключаетесь к серверу **MYGREY'S** с:
- 2 текстовых канала: `#общий`, `#мемы`
- 3 голосовых канала: `Лобби`, `Игры`, `Музыка`

---

## Содержание

1. [Быстрый старт (локально)](#1-быстрый-старт-локально)
2. [Настройка Supabase (база данных)](#2-настройка-supabase-база-данных)
3. [Подключение GitHub](#3-подключение-github)
4. [Деплой на Cloudflare Pages](#4-деплой-на-cloudflare-pages)
5. [Настройка голосовых чатов (WebRTC)](#5-настройка-голосовых-чатов-webrtc)
6. [Переменные окружения](#6-переменные-окружения)
7. [Использование приложения](#7-использование-приложения)
8. [Решение проблем](#8-решение-проблем)

---

## 1. Быстрый старт (локально)

### Требования

- **Node.js** 18+ (рекомендуется 20) — [скачать](https://nodejs.org/)
- **Git** — [скачать](https://git-scm.com/)
- Аккаунт **Supabase** (бесплатный) — [supabase.com](https://supabase.com/)
- Аккаунт **GitHub** — [github.com](https://github.com/)
- Аккаунт **Cloudflare** (бесплатный) — [cloudflare.com](https://cloudflare.com/)

### Шаги

```bash
# 1. Перейти в папку проекта
cd GreyCord

# 2. Установить зависимости
npm install

# 3. Создать файл окружения
copy .env.example .env
# На Mac/Linux: cp .env.example .env

# 4. Заполнить .env (см. раздел 2 — Supabase)

# 5. Запустить dev-сервер
npm run dev
```

Откройте в браузере: **http://localhost:5173**

---

## 2. Настройка Supabase (база данных)

Supabase — это облачная PostgreSQL база + Realtime (для мгновенных сообщений и голосового сигналинга).

### 2.1. Создание проекта

1. Зайдите на [supabase.com](https://supabase.com/) и войдите (или зарегистрируйтесь)
2. Нажмите **New Project**
3. Заполните:
   - **Name**: `showelgrays` (или любое имя)
   - **Database Password**: придумайте надёжный пароль (сохраните!)
   - **Region**: выберите ближайший регион (например, Frankfurt для Европы)
4. Нажмите **Create new project** и подождите 1–2 минуты

### 2.2. Получение ключей API

1. В левом меню: **Project Settings** (шестерёнка) → **API**
2. Скопируйте:
   - **Project URL** → это `VITE_SUPABASE_URL`
   - **anon public** key → это `VITE_SUPABASE_ANON_KEY`

3. Откройте файл `.env` в корне проекта и вставьте:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3. Создание таблиц (SQL-схема)

1. В Supabase: **SQL Editor** (левое меню)
2. Нажмите **New query**
3. Откройте файл `supabase/schema.sql` из проекта
4. Скопируйте **весь** SQL-код и вставьте в редактор
5. Нажмите **Run** (или Ctrl+Enter)

Вы должны увидеть `Success. No rows returned`.

Это создаст:
- Таблицы: `servers`, `channels`, `messages`, `voice_participants`, `voice_signals`
- Политики безопасности (RLS) — открытый доступ для чтения/записи
- Realtime подписки для мгновенных обновлений
- Сервер **MYGREY'S** с 5 каналами и приветственным сообщением

### 2.4. Включение Realtime (если не работает)

1. **Database** → **Replication**
2. Убедитесь, что включены таблицы:
   - `messages`
   - `voice_participants`
   - `voice_signals`

Если их нет — добавьте через **SQL Editor**:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_signals;
```

### 2.5. Проверка

1. **Table Editor** → должны быть таблицы с данными
2. В таблице `servers` — запись `MYGREY'S`
3. В таблице `channels` — 5 каналов
4. Перезапустите `npm run dev` и обновите страницу — баннер «Supabase не настроен» должен исчезнуть

---

## 3. Подключение GitHub

### 3.1. Инициализация Git (если ещё не сделано)

```bash
cd GreyCord
git init
git add .
git commit -m "Initial commit: ShowelGrays Discord analog"
```

### 3.2. Создание репозитория на GitHub

1. Зайдите на [github.com](https://github.com/) → **New repository**
2. Имя: `showelgrays` (или `GreyCord`)
3. **Public** или **Private** — на ваш выбор
4. **НЕ** ставьте галочки на README, .gitignore, license (они уже есть)
5. Нажмите **Create repository**

### 3.3. Загрузка кода

```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/showelgrays.git
git branch -M main
git push -u origin main
```

> **Важно:** Файл `.env` в `.gitignore` — ключи Supabase **не попадут** в GitHub.  
> Их нужно будет добавить отдельно в Cloudflare (раздел 4).

---

## 4. Деплой на Cloudflare Pages

Cloudflare Pages — бесплатный хостинг для статических сайтов с автодеплоем из GitHub.

### 4.1. Подключение репозитория

1. Зайдите на [dash.cloudflare.com](https://dash.cloudflare.com/)
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Авторизуйте GitHub и выберите репозиторий `showelgrays`
4. Настройки сборки:

| Параметр | Значение |
|----------|----------|
| **Production branch** | `main` |
| **Framework preset** | `None` (или Vite) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (оставить пустым) |

5. **Environment variables** (переменные окружения) — **ОБЯЗАТЕЛЬНО**:

| Variable name | Value |
|---------------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` (ваш anon key) |
| `NODE_VERSION` | `20` |

6. Нажмите **Save and Deploy**

### 4.2. Ожидание деплоя

- Сборка занимает 1–3 минуты
- После успеха вы получите URL: `https://showelgrays.pages.dev` (или похожий)

### 4.3. Свой домен (опционально)

1. **Pages** → ваш проект → **Custom domains**
2. **Set up a custom domain**
3. Введите домен (например `chat.mygreys.com`)
4. Cloudflare покажет DNS-записи — добавьте их у регистратора домена
5. SSL включится автоматически

### 4.4. Автодеплой

Каждый `git push` в ветку `main` автоматически пересобирает и деплоит сайт.

```bash
git add .
git commit -m "Update feature"
git push
```

### 4.5. SPA-маршрутизация

Файл `public/_redirects` уже настроен — все URL перенаправляются на `index.html` (нужно для SPA).

---

## 5. Настройка голосовых чатов (WebRTC)

Голос работает через **WebRTC** (браузерное P2P-аудио). Supabase используется только для сигналинга (обмен SDP/ICE).

### 5.1. Базовая работа (без TURN)

По умолчанию используются бесплатные Google STUN-серверы. Этого достаточно, если:
- Оба пользователя в одной сети, или
- У обоих «простой» NAT (большинство домашних роутеров)

**Для теста:** откройте сайт в двух разных браузерах (или обычный + инкognito) и зайдите в один голосовой канал.

### 5.2. TURN-сервер (если голос не работает между разными сетями)

Если пользователи не слышат друг друга через интернет — нужен TURN-сервер.

**Варианты:**

| Сервис | Цена | Ссылка |
|--------|------|--------|
| **Metered.ca** | Бесплатный tier | [metered.ca/tools/openrelay](https://www.metered.ca/tools/openrelay/) |
| **Cloudflare Calls** | Платный | [developers.cloudflare.com/calls](https://developers.cloudflare.com/calls/) |
| **Twilio TURN** | Платный | [twilio.com/stun-turn](https://www.twilio.com/stun-turn) |

Добавьте в `.env` и в Cloudflare Environment Variables:

```env
VITE_TURN_URL=turn:global.relay.metered.ca:80
VITE_TURN_USERNAME=ваш_username
VITE_TURN_CREDENTIAL=ваш_credential
```

### 5.3. HTTPS обязателен

Микрофон работает **только** через HTTPS (или localhost).  
Cloudflare Pages даёт HTTPS автоматически.

### 5.4. Разрешение микрофона

При первом входе в голосовой канал браузер запросит доступ к микрофону — нажмите **Разрешить**.

---

## 6. Переменные окружения

| Переменная | Обязательная | Описание |
|------------|:---:|----------|
| `VITE_SUPABASE_URL` | ✅ | URL проекта Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Публичный anon-ключ Supabase |
| `VITE_TURN_URL` | ❌ | TURN-сервер для WebRTC |
| `VITE_TURN_USERNAME` | ❌ | Логин TURN |
| `VITE_TURN_CREDENTIAL` | ❌ | Пароль TURN |
| `NODE_VERSION` | ❌ | Версия Node для Cloudflare (рекомендуется `20`) |

---

## 7. Использование приложения

### При входе на сайт

1. Экран загрузки «Подключение к MYGREY'S...»
2. Автоматическое подключение к серверу MYGREY'S
3. Открывается текстовый канал `#общий`

### Текстовые каналы

- `#общий` — основной чат
- `#мемы` — для мемов и фана
- Пишите сообщения внизу, Enter — отправить, Shift+Enter — новая строка

### Голосовые каналы

- **Лобби** — общий голосовой
- **Игры** — для игровых сессий
- **Музыка** — для музыки

Нажмите на канал → **Присоединиться** → разрешите микрофон.

Управление:
- 🎤 — вкл/выкл микрофон
- 🎧 — вкл/выкл звук (deafen)
- 📞 — отключиться

### Настройки (шестерёнка внизу слева)

| Раздел | Опции |
|--------|-------|
| **Профиль** | Имя пользователя |
| **Голос** | Шумоподавление, эхоподавление, авторегулировка, громкость, выбор микрофона/динамиков |
| **Интерфейс** | Частицы, анимации |

**Шумоподавление** включено по умолчанию — использует WebRTC `noiseSuppression`.

---

## 8. Решение проблем

### «Supabase не настроен»

- Проверьте `.env` — ключи должны быть без пробелов и кавычек
- Перезапустите `npm run dev` после изменения `.env`
- На Cloudflare: проверьте Environment Variables в настройках Pages

### Сообщения не отправляются

1. Supabase → **Table Editor** → `messages` — есть ли записи?
2. **SQL Editor** — выполнили `schema.sql`?
3. Консоль браузера (F12) — есть ли ошибки?
4. **Database** → **Replication** — включён ли Realtime для `messages`?

### Голос не работает

1. Разрешён ли микрофон в браузере?
2. Сайт открыт через **HTTPS** (не HTTP)?
3. Добавьте TURN-сервер (раздел 5.2)
4. Проверьте консоль (F12) на WebRTC ошибки
5. Попробуйте Chrome/Edge (лучшая поддержка WebRTC)

### Realtime не обновляется

```sql
-- Выполните в SQL Editor:
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_signals;
```

### Cloudflare сборка падает

- Убедитесь: Build command = `npm run build`, Output = `dist`
- Добавьте `NODE_VERSION=20`
- Проверьте логи сборки в Cloudflare Dashboard

### CORS ошибки

Supabase anon key работает из любого домена по умолчанию.  
Если ограничивали домены в Supabase → **Authentication** → **URL Configuration** — добавьте ваш Cloudflare URL.

---

## Структура проекта

```
GreyCord/
├── public/              # Статика (favicon, _redirects)
├── src/
│   ├── components/      # UI компоненты
│   ├── hooks/           # React хуки (voice, messages, settings)
│   ├── lib/             # Supabase, audio утилиты
│   ├── types/           # TypeScript типы
│   ├── App.tsx          # Главный компонент
│   └── main.tsx         # Точка входа
├── supabase/
│   └── schema.sql       # SQL-схема базы данных
├── .env.example         # Пример переменных окружения
├── package.json
└── README.md            # Эта инструкция
```

---

## Технологии

| Технология | Назначение |
|------------|------------|
| **React 19** + **TypeScript** | Frontend |
| **Vite** | Сборка |
| **Tailwind CSS** | Стили |
| **Framer Motion** | Анимации |
| **tsParticles** | Интерактивные частицы |
| **Supabase** | База данных + Realtime |
| **WebRTC** | Голосовые чаты P2P |
| **Cloudflare Pages** | Хостинг |

---

## Лицензия

MIT — используйте свободно.

---

**ShowelGrays** — создан для сервера MYGREY'S 🌌
