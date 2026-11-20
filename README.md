# Mindspark — RaysBook.live

A digital book store & secure PDF reader for NEET / IIT-JEE / NCERT study modules.
Browse books, save them to your bookshelf, track reading progress, and read
chapters in an integrated canvas-based PDF reader with page notes and highlights.

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4**
- **Supabase (PostgreSQL)** via `@supabase/supabase-js` — bookshelf, reading
  progress, page annotations and unlocked passes are persisted server-side
- **Cloudflare Pages** deployment via the OpenNext Cloudflare adapter

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file with your Supabase credentials:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> The service-role key is used only inside API routes (server-side). Never
> expose it to the browser.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

The app uses five tables in the `public` schema:

| Table               | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `custom_books`      | User-uploaded custom PDF books           |
| `bookshelf_items`   | Saved / purchased books                  |
| `reading_progress`  | Per-chapter reading position             |
| `page_annotations`  | Page notes & highlights                  |
| `unlocked_passes`   | Activated books passes                   |

## API Routes

| Route              | Description                              |
| ------------------ | ---------------------------------------- |
| `GET /api/books`   | Book catalog, search & book details      |
| `POST /api/books`  | Create a custom uploaded book            |
| `GET /api/user-state`  | Bookshelf, progress, passes, annotations |
| `POST /api/user-state` | Save/toggle/purchase/progress/notes    |
| `GET /api/pdf-page`    | Secure PDF page rendering                |
| `GET /api/health`      | Database health check                    |

## Deployment (Cloudflare Pages)

This project deploys to Cloudflare Pages using the
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) adapter.

```bash
npm run build        # builds the Next.js app
npx opennextjs-cloudflare build   # adapts it for Cloudflare Workers
npx opennextjs-cloudflare deploy  # deploys to Cloudflare Pages
```

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as environment variables
in the Cloudflare Pages project settings.

## Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start development server |
| `npm run build`      | Production build         |
| `npm run start`      | Start production server  |
| `npm run lint`       | Run ESLint               |
| `npm run typecheck`  | Run TypeScript checks    |
