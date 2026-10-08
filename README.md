# ElectroLab

Calculator ingineresc pentru electrotehnică și energetică. Приложение считает закон Ома, однофазные и трёхфазные цепи, потребление энергии, эквивалентное сопротивление и КПД прямо в браузере. Интерфейс на румынском и русском: переключатель RO/RU в шапке. Автор: Николай Продиус, FEIE, UTM. Сервер, база данных и API-ключи не нужны.

## Локальный запуск

Нужны Node.js 20+ и npm.

```bash
npm install
npm run dev
```

Сайт откроется по адресу, который покажет Vite, обычно `http://localhost:5173`.

Проверка и сборка:

```bash
npm test
npm run build
npm run preview
```

`npm run build` создаёт статическую папку `dist`.

## Публикация на Vercel (бесплатный тариф Hobby)

Параметры проекта:

- Framework Preset: **Vite**
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

Файл `vercel.json` перенаправляет все маршруты на `index.html`, поэтому обновление страницы на `/ohm`, `/circuite` и остальных адресах не даёт ошибку 404.

Достаточно одного из способов ниже.

### Способ A — GitHub + Vercel

1. Создайте пустой репозиторий на GitHub.
2. Загрузите проект в этот репозиторий (`git init`, коммит, `git push`). Не добавляйте `node_modules` и `dist`: они уже указаны в `.gitignore`.
3. На [vercel.com](https://vercel.com) выберите **Add New… → Project** и **Import** репозитория.
4. Framework Preset оставьте **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Нажмите **Deploy**.

После сборки Vercel покажет публичный адрес вида `https://имя-проекта.vercel.app`. Его нужно вставить в `docs/PREDARE_CLASSROOM.md`.

### Способ B — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

`vercel` создаёт предварительный деплой. `vercel --prod` публикует production-версию и выводит публичный URL. Не запускайте обе схемы одновременно для одной и той же публикации: достаточно выбранного способа.

Секреты и переменные окружения не требуются.
