# syl-poto — Deploy Guide

## What changed from your original repo

- `src/App.tsx` — now routes to `/admin` for the admin panel
- `src/components/Gallery.tsx` — now also loads uploaded images from the API (merged with existing static images)
- `src/components/AdminPage.tsx` — NEW: password-protected upload panel at `/admin`
- `server/index.js` — NEW: Express backend (upload / fetch / delete)
- `package.json` — added `express`, `multer`, `cloudinary`, `pg`, `cors` + correct `start` script
- `render.yaml` — NEW: auto-creates a free Postgres DB on Render

Everything else (Sidebar, index.css, index.html, tsconfig.json) is unchanged.

---

## Deploy steps

### 1 — Push to GitHub
Replace your repo files with these, then:
```bash
git add .
git commit -m "Add image upload feature"
git push
```

### 2 — Set Environment Variables on Render
Go to your Web Service → **Environment** tab and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `CLOUDINARY_CLOUD_NAME` | `dsp8qrqiq` |
| `CLOUDINARY_API_KEY` | `626588343341635` |
| `CLOUDINARY_API_SECRET` | *(reveal from Cloudinary dashboard)* |
| `DATABASE_URL` | *(auto-set if using render.yaml, otherwise paste Internal DB URL)* |
| `ADMIN_PASSWORD` | *(choose any password — this is what you type at /admin)* |

### 3 — Add the Postgres database

**Option A (easiest):** Push `render.yaml` to your repo → Render auto-creates the DB.

**Option B (manual):** In Render dashboard → New → PostgreSQL (free) → copy the Internal Database URL → paste as `DATABASE_URL`.

### 4 — Redeploy
Render will pick up the new `start` script (`node server/index.js`) and rebuild automatically.

---

## How to use

- **Portfolio**: `yoursite.com` — shows all photos (static + uploaded), same design as before
- **Admin**: `yoursite.com/admin` — enter your `ADMIN_PASSWORD` to upload/delete photos

In the admin panel:
- Drag & drop or click to select multiple images
- Choose a category (produkt, lys, raportage, potræt, byggninger, Dyr)
- Add an optional description
- Uploaded photos appear at the top of the gallery immediately

---

## Local development

Create a `.env` file (don't commit it!):
```
CLOUDINARY_CLOUD_NAME=dsp8qrqiq
CLOUDINARY_API_KEY=626588343341635
CLOUDINARY_API_SECRET=your_secret_here
DATABASE_URL=postgresql://localhost/sylvia_portfolio
ADMIN_PASSWORD=yourpassword
PORT=3001
```

Then run two terminals:
```bash
# Terminal 1 - backend
node server/index.js

# Terminal 2 - React
npm run dev
```
