# Мой гардероб — mobile-first PWA для iPhone

Рабочая MVP-версия личного цифрового гардероба на React + TypeScript + Vite + Supabase. Приложение хранит вещи, фотографии, образы и идеи в Supabase, открывается с домашнего экрана iPhone и работает в standalone-режиме.

## Что реализовано

- вход по email через Supabase Magic Link;
- один заранее созданный владелец без публичной регистрации;
- приватные таблицы и Storage с Row Level Security;
- добавление, просмотр, редактирование и удаление вещей;
- связанные поля категории и подкатегории;
- множественный выбор цветов и сезонов;
- поиск, фильтры и сортировка шкафа;
- кнопка «Надевала сегодня»;
- конструктор образов с перемещением пальцем;
- масштабирование и поворот двумя пальцами, а также слайдерами;
- управление слоями и удаление элементов холста;
- сохранение `canvas_data` и повторное редактирование образа;
- автоматическое создание и загрузка превью образа;
- комментарий, повод, дата и отметка любимого образа;
- Pinterest-подобная сетка идей;
- сжатие изображений перед загрузкой в WebP с fallback на JPEG;
- PWA manifest, service worker, safe area iPhone и нижняя навигация;
- автоматическая публикация на GitHub Pages через GitHub Actions.

> Важно: оболочка приложения кэшируется как PWA, но чтение и изменение данных требуют подключения к интернету, потому что база и фотографии находятся в Supabase.

## 1. Что понадобится

- аккаунт Supabase;
- аккаунт GitHub;
- Node.js 22 LTS или новее;
- Git;
- компьютер для первичной настройки;
- iPhone с Safari для установки приложения.

## 2. Создание проекта Supabase

1. Откройте Supabase Dashboard.
2. Нажмите **New project**.
3. Выберите организацию, задайте название проекта и пароль базы данных.
4. Дождитесь создания проекта.
5. Перейдите в **Project Settings → API**.
6. Скопируйте:
   - Project URL;
   - Publishable key или legacy `anon` key.

`service_role`/secret key в приложение добавлять нельзя.

## 3. Создание таблиц, RLS и Storage

1. В Supabase откройте **SQL Editor**.
2. Создайте новый запрос.
3. Вставьте содержимое файла [`supabase.sql`](./supabase.sql).
4. Нажмите **Run**.

Скрипт создаст:

- `public.clothes`;
- `public.outfits`;
- `public.ideas`;
- индексы и триггеры `updated_at`;
- RLS-политики, ограниченные `auth.uid()`;
- приватный bucket `wardrobe-private`;
- Storage-политики, разрешающие доступ только к папке текущего пользователя.

Структура файлов в bucket:

```text
<user_id>/clothes/...
<user_id>/outfits/...
<user_id>/ideas/...
```

### Если bucket создаётся вручную

SQL уже создаёт bucket автоматически. При ручном создании используйте:

- Name: `wardrobe-private`;
- Public bucket: **выключено**;
- File size limit: до 12 MB;
- Allowed MIME types: `image/jpeg`, `image/webp`.

Storage-политики всё равно возьмите из `supabase.sql`.

## 4. Создание единственного пользователя

Приложение отправляет Magic Link с параметром `shouldCreateUser: false`, поэтому неизвестные адреса не регистрируются автоматически.

1. Перейдите в **Authentication → Users**.
2. Нажмите **Add user** / **Create user** или пригласите пользователя.
3. Укажите свой email.
4. Если интерфейс просит пароль, задайте любой длинный случайный пароль — приложение его не использует.
5. Подтвердите email через интерфейс или письмо, если это требуется.

Не создавайте других Auth-пользователей, если приложение должно оставаться строго личным.

## 5. Настройка Magic Link и redirect URL

В Supabase откройте **Authentication → URL Configuration**.

Для локальной разработки:

```text
Site URL: http://localhost:5173/
Additional Redirect URL: http://localhost:5173/**
```

После публикации замените Site URL или добавьте дополнительный адрес:

```text
https://GITHUB_USERNAME.github.io/REPOSITORY_NAME/
```

И в **Additional Redirect URLs** добавьте:

```text
https://GITHUB_USERNAME.github.io/REPOSITORY_NAME/**
```

Пример:

```text
https://aiman.github.io/my-wardrobe-pwa/
```

Без разрешённого redirect URL Magic Link не сможет вернуть пользователя в приложение.

## 6. Локальный запуск

Скачайте и распакуйте проект, затем выполните:

```bash
npm install
cp .env.example .env
```

Откройте `.env` и заполните:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
VITE_STORAGE_BUCKET=wardrobe-private
VITE_ALLOWED_EMAIL=your@email.com
VITE_BASE_PATH=/
```

`VITE_ALLOWED_EMAIL` — дополнительная проверка интерфейса. Она не заменяет RLS и не является секретом: переменные `VITE_*` попадают в клиентскую сборку. Реальная защита обеспечивается отсутствием публичной регистрации, Supabase Auth, RLS и приватным Storage.

Запустите приложение:

```bash
npm run dev
```

Откройте адрес, который покажет Vite, обычно `http://localhost:5173/`.

Проверка production-сборки:

```bash
npm run build
npm run preview
```

## 7. Загрузка проекта в GitHub

Создайте новый репозиторий, например `my-wardrobe-pwa`, затем в папке проекта выполните:

```bash
git init
git add .
git commit -m "Initial wardrobe PWA"
git branch -M main
git remote add origin https://github.com/GITHUB_USERNAME/my-wardrobe-pwa.git
git push -u origin main
```

Файл `.env` исключён через `.gitignore` и не попадёт в репозиторий.

## 8. Переменные для GitHub Actions

В репозитории GitHub откройте:

**Settings → Secrets and variables → Actions**

В разделе **Repository secrets** добавьте:

- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_ANON_KEY`;
- `VITE_ALLOWED_EMAIL` — необязательно.

В разделе **Repository variables** добавьте:

- `VITE_STORAGE_BUCKET` = `wardrobe-private`.

Workflow автоматически выставляет:

```text
VITE_BASE_PATH=/<имя-репозитория>/
```

Поэтому вручную менять `vite.config.ts` под GitHub Pages не нужно.

## 9. Публикация через GitHub Pages

1. Откройте репозиторий GitHub.
2. Перейдите в **Settings → Pages**.
3. В разделе **Build and deployment** выберите **Source: GitHub Actions**.
4. Откройте вкладку **Actions**.
5. Workflow `Deploy to GitHub Pages` запустится после push в ветку `main`.
6. После успешного завершения сайт будет доступен по адресу:

```text
https://GITHUB_USERNAME.github.io/REPOSITORY_NAME/
```

Не забудьте добавить этот точный адрес в Supabase Auth URL Configuration.

### Обновление приложения

После любых изменений:

```bash
git add .
git commit -m "Update wardrobe app"
git push
```

GitHub Actions пересоберёт и опубликует новую версию. Service worker настроен на автоматическое обновление.

## 10. Установка на главный экран iPhone

1. Откройте опубликованный адрес в **Safari** на iPhone.
2. Войдите через Magic Link.
3. Нажмите кнопку **Поделиться** в Safari.
4. Выберите **На экран «Домой» / Add to Home Screen**.
5. Проверьте название «Гардероб» и нажмите **Добавить**.
6. Запускайте приложение через новую иконку на главном экране.

Приложение откроется без адресной строки в standalone-режиме. Safe area учитывает Dynamic Island, вырез и нижний Home Indicator.

## 11. Проверка после настройки

Пройдите сценарий:

1. Запросить Magic Link и войти.
2. Добавить вещь с фотографией.
3. Закрыть PWA и открыть снова — вещь должна остаться.
4. Проверить поиск и фильтры.
5. Нажать «Надевала сегодня».
6. Создать образ, добавить несколько вещей.
7. Переместить вещь пальцем, изменить размер и поворот.
8. Сохранить образ и повторно открыть его в конструкторе.
9. Добавить идею с фотографией и ссылкой.
10. Удалить тестовые записи и проверить подтверждение.

## 12. Структура проекта

```text
src/
  components/       карточки, навигация, модальные окна, загрузка фото
  context/          Supabase Auth
  hooks/            signed URL для приватных изображений
  lib/              Supabase, Storage, сжатие, типы, константы
  pages/            все страницы приложения
.github/workflows/  публикация GitHub Pages
public/             PWA-иконки
supabase.sql         таблицы, RLS и Storage
.env.example         пример переменных
```

## Безопасность

- Publishable/anon key предназначен для клиентских приложений и безопасен только вместе с корректным RLS.
- Никогда не добавляйте `service_role` или secret key в `.env` Vite, GitHub Pages или клиентский код.
- Bucket остаётся приватным; изображения показываются через временные signed URLs.
- Каждая строка и каждый Storage-файл ограничены текущим `auth.uid()`.
- Для личного режима не включайте публичную регистрацию и не создавайте других Auth-пользователей.
