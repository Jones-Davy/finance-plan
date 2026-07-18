# Деплой на GitHub Pages + Supabase

## 1. Supabase (бесплатная база и синхронизация)

1. Создайте проект на [supabase.com](https://supabase.com).
2. **SQL Editor** → выполните скрипт [`supabase/schema.sql`](supabase/schema.sql).
3. **Database → Replication** → включите таблицу `budget_rooms` для Realtime.
4. **Project Settings → API** — скопируйте:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`

### Локальная разработка

```bash
cp .env.example .env
# заполните ключи Supabase
npm install
npm run dev
```

`VITE_BASE_PATH=/` для локального dev.

## 2. GitHub Pages

### Первый раз (на вашем аккаунте)

1. Создайте репозиторий, залейте код (`git push`).
2. **Settings → Pages → Build and deployment**:
   - Source: **GitHub Actions**
3. **Settings → Secrets and variables → Actions** — добавьте:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push в ветку `main` — workflow `.github/workflows/deploy-pages.yml` соберёт и опубликует сайт.

Адрес: `https://<username>.github.io/<repo>/`

### VITE_BASE_PATH

Для project site (обычный репозиторий) в CI уже задано:

```text
VITE_BASE_PATH=/<имя-репозитория>/
```

Если репозиторий называется `finance`, сайт будет `https://user.github.io/finance/`.

Для личного сайта `username.github.io` измените в workflow:

```yaml
VITE_BASE_PATH: /
```

## 3. Общий бюджет с партнёром

1. Откройте сайт → **Поделиться** → **Создать общую комнату**.
2. Ссылка вида `…/#room=uuid` — отправьте партнёру.
3. Оба открывают одну ссылку — изменения синхронизируются через Supabase.

Комната = секретная ссылка. Не публикуйте её в открытый доступ.

## 4. Без Supabase

Если ключи не заданы, приложение работает локально (localStorage) и со старым режимом «план в ссылке».

## 5. Команды

```bash
npm run dev      # разработка
npm test         # тесты
npm run build    # сборка в dist/
npm run preview  # проверка production-сборки
```
