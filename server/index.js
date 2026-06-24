const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Pool } = require("pg");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ── Cloudinary ────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Postgres ──────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS images (
      id         SERIAL PRIMARY KEY,
      url        TEXT NOT NULL,
      public_id  TEXT NOT NULL,
      alt        TEXT,
      category   TEXT NOT NULL DEFAULT 'potræt',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  console.log("✅ Database ready");
}
initDb().catch((err) => console.error("DB init error:", err));

// ── Multer ────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ── POST /api/upload ──────────────────────────────────────────────────────────
app.post(
  "/api/upload",
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    try {
      const cloudResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "portfolio", resource_type: "image" },
          (err, result) => (err ? reject(err) : resolve(result)),
        );
        stream.end(req.file.buffer);
      });

      const { rows } = await pool.query(
        `INSERT INTO images (url, public_id, alt, category, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          cloudResult.secure_url,
          cloudResult.public_id,
          req.body.alt || req.file.originalname,
          req.body.category || "potræt",
          req.body.description || null,
        ],
      );
      res.json(rows[0]);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed: " + err.message });
    }
  },
);

// ── GET /api/images ───────────────────────────────────────────────────────────
app.get("/api/images", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, url, alt, category, description, created_at FROM images ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

// ── DELETE /api/images/:id ────────────────────────────────────────────────────
app.delete("/api/images/:id", requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT public_id FROM images WHERE id = $1",
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    await cloudinary.uploader.destroy(rows[0].public_id);
    await pool.query("DELETE FROM images WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed: " + err.message });
  }
});

// ── GET /api/profile ─────────────────────────────────────────────────────────
app.get("/api/profile", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM settings WHERE key = 'profile_url'",
    );
    res.json({ url: rows.length ? rows[0].value : null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ── POST /api/profile ─────────────────────────────────────────────────────────
app.post(
  "/api/profile",
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    try {
      // Delete old profile image from Cloudinary if exists
      const { rows } = await pool.query(
        "SELECT value FROM settings WHERE key = 'profile_public_id'",
      );
      if (rows.length) {
        await cloudinary.uploader.destroy(rows[0].value).catch(() => {});
      }

      const cloudResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "portfolio/profile", resource_type: "image" },
          (err, result) => (err ? reject(err) : resolve(result)),
        );
        stream.end(req.file.buffer);
      });

      // Upsert url and public_id
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ('profile_url', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
        [cloudResult.secure_url],
      );
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ('profile_public_id', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
        [cloudResult.public_id],
      );

      res.json({ url: cloudResult.secure_url });
    } catch (err) {
      console.error("Profile upload error:", err);
      res.status(500).json({ error: "Upload failed: " + err.message });
    }
  },
);

// ── Serve React build ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../build")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../build/index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
