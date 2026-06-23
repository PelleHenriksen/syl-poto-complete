import React, { useState, useEffect, useRef, useCallback } from "react";

const CATEGORIES = [
  "produkt",
  "lys",
  "raportage",
  "potræt",
  "byggninger",
  "Dyr",
];

interface DbImage {
  id: number;
  url: string;
  alt: string;
  category: string;
  description: string;
  created_at: string;
}

export default function AdminPage() {
  const [password, setPassword]           = useState("");
  const [authed, setAuthed]               = useState(false);
  const [images, setImages]               = useState<DbImage[]>([]);
  const [dragging, setDragging]           = useState(false);
  const [files, setFiles]                 = useState<File[]>([]);
  const [category, setCategory]           = useState("potræt");
  const [description, setDescription]     = useState("");
  const [uploading, setUploading]         = useState(false);
  const [progress, setProgress]           = useState<string[]>([]);
  const [error, setError]                 = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordRef  = useRef("");

  const fetchImages = useCallback(async () => {
    const res = await fetch("/api/images");
    if (res.ok) setImages(await res.json());
  }, []);

  useEffect(() => { if (authed) fetchImages(); }, [authed, fetchImages]);

  const handleAuth = () => {
    passwordRef.current = password;
    setAuthed(true);
  };

  const addFiles = (incoming: File[]) =>
    setFiles((prev) => [...prev, ...incoming.filter((f) => f.type.startsWith("image/"))]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError("");
    const log: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      log[i] = `⏳ Uploading ${f.name}…`;
      setProgress([...log]);

      const form = new FormData();
      form.append("image",       f);
      form.append("category",    category);
      form.append("description", description || f.name.replace(/\.[^.]+$/, ""));
      form.append("alt",         f.name.replace(/\.[^.]+$/, ""));

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "x-admin-password": passwordRef.current },
          body: form,
        });

        if (res.status === 401) {
          setError("Wrong password. Please refresh and try again.");
          setAuthed(false);
          setUploading(false);
          return;
        }
        log[i] = res.ok ? `✅ ${f.name} uploaded!` : `❌ ${f.name}: ${(await res.json()).error}`;
      } catch {
        log[i] = `❌ ${f.name}: network error`;
      }
      setProgress([...log]);
    }

    setUploading(false);
    setFiles([]);
    setDescription("");
    fetchImages();
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/images/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": passwordRef.current },
    });
    if (res.ok) setImages((prev) => prev.filter((img) => img.id !== id));
    else setError("Delete failed.");
    setDeleteConfirm(null);
  };

  // ── Shared button style ───────────────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    background: "none", border: "1px solid rgba(255,255,255,0.3)",
    color: "rgba(255,255,255,0.8)", borderRadius: "6px",
    padding: "6px 14px", cursor: "pointer", fontSize: "13px",
    letterSpacing: "0.05em", transition: "all 0.2s",
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0d0d0d",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px",
          width: "320px", padding: "40px" }}>
          <h2 style={{ color: "white", fontWeight: 300, fontSize: "28px",
            letterSpacing: "0.05em", margin: 0 }}>Admin</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>
            Enter your password to manage photos.
          </p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "6px", color: "white", padding: "10px 14px",
              fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" }}
          />
          <button onClick={handleAuth}
            style={{ background: "white", color: "#0d0d0d", border: "none",
              borderRadius: "6px", padding: "11px", fontSize: "15px",
              cursor: "pointer", fontWeight: 500, letterSpacing: "0.03em" }}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  // ── Admin panel ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0d0d0d", color: "white",
      padding: "48px 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "48px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(36px, 8vw, 72px)", fontWeight: 700,
            lineHeight: 1, letterSpacing: "-0.02em", margin: 0 }}>ADMIN</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px",
            letterSpacing: "0.15em", marginTop: "6px" }}>
            SYLVIA PHOTOGRAPHY
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a href="/" style={{ ...btnBase, textDecoration: "none",
            display: "inline-block", textAlign: "center" }}>
            ← Portfolio
          </a>
          <button style={btnBase}
            onClick={() => { setAuthed(false); setPassword(""); }}>
            Log out
          </button>
        </div>
      </div>

      {/* Upload section */}
      <section style={{ marginBottom: "56px" }}>
        <h3 style={{ fontSize: "11px", letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.4)", marginBottom: "20px",
          fontWeight: 400, textTransform: "uppercase" }}>
          Upload New Photos
        </h3>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ border: `1.5px dashed ${dragging ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}`,
            borderRadius: "8px", padding: "48px 32px", textAlign: "center",
            cursor: "pointer", background: dragging ? "rgba(255,255,255,0.05)" : "transparent",
            transition: "all 0.2s", display: "flex", flexDirection: "column",
            alignItems: "center", gap: "8px" }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple
            onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
            style={{ display: "none" }} />
          <span style={{ fontSize: "28px" }}>📷</span>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>
            Drag & drop images here, or click to select
          </p>
          <small style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
            JPG · PNG · WEBP — max 20 MB each
          </small>
        </div>

        {/* Options & queue */}
        {files.length > 0 && (
          <div style={{ marginTop: "20px", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
            padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 400,
              color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>
              {files.length} image{files.length > 1 ? "s" : ""} ready to upload
            </h4>

            {/* Category & description */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px",
                  color: "white", padding: "8px 12px", fontSize: "14px",
                  outline: "none", cursor: "pointer", flexShrink: 0 }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: "#1a1a1a" }}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px",
                  color: "white", padding: "8px 12px", fontSize: "14px",
                  outline: "none", flex: 1, minWidth: "180px",
                  boxSizing: "border-box" }}
              />
            </div>

            {/* File previews */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center",
                  gap: "12px", background: "rgba(255,255,255,0.04)",
                  borderRadius: "6px", padding: "8px 12px" }}>
                  <img src={URL.createObjectURL(f)} alt={f.name}
                    style={{ width: "40px", height: "40px",
                      objectFit: "cover", borderRadius: "4px", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: "13px",
                    color: "rgba(255,255,255,0.7)", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.name}
                  </span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)",
                    flexShrink: 0 }}>
                    {(f.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                      cursor: "pointer", fontSize: "16px", padding: "0 4px",
                      transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#e00")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                  >✕</button>
                </div>
              ))}
            </div>

            <button onClick={handleUpload} disabled={uploading}
              style={{ background: "white", color: "#0d0d0d", border: "none",
                borderRadius: "6px", padding: "12px", fontSize: "14px",
                cursor: uploading ? "not-allowed" : "pointer",
                fontWeight: 500, letterSpacing: "0.03em",
                opacity: uploading ? 0.5 : 1, transition: "opacity 0.2s" }}>
              {uploading ? "Uploading…" : `Upload ${files.length} image${files.length > 1 ? "s" : ""}`}
            </button>
          </div>
        )}

        {/* Progress log */}
        {progress.length > 0 && (
          <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.04)",
            borderRadius: "6px", padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: "4px" }}>
            {progress.map((msg, i) => (
              <div key={i} style={{ fontSize: "13px",
                color: "rgba(255,255,255,0.65)" }}>{msg}</div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ marginTop: "12px", color: "#ff6b6b",
            fontSize: "13px" }}>{error}</div>
        )}
      </section>

      {/* Gallery management */}
      <section>
        <h3 style={{ fontSize: "11px", letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.4)", marginBottom: "20px",
          fontWeight: 400, textTransform: "uppercase" }}>
          Uploaded Photos ({images.length})
        </h3>

        {images.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
            No uploaded photos yet — use the panel above to add some.
          </p>
        ) : (
          <div style={{ display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "12px" }}>
            {images.map((img) => (
              <div key={img.id}
                style={{ position: "relative", borderRadius: "6px",
                  overflow: "hidden", aspectRatio: "1", background: "#1a1a1a",
                  cursor: "pointer" }}
                onMouseEnter={(e) => {
                  const overlay = e.currentTarget.querySelector(".admin-overlay") as HTMLElement;
                  if (overlay) overlay.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const overlay = e.currentTarget.querySelector(".admin-overlay") as HTMLElement;
                  if (overlay) overlay.style.opacity = "0";
                  setDeleteConfirm(null);
                }}
              >
                <img src={img.url} alt={img.alt}
                  style={{ width: "100%", height: "100%",
                    objectFit: "cover", display: "block" }} />
                <div className="admin-overlay"
                  style={{ position: "absolute", inset: 0,
                    background: "rgba(0,0,0,0.7)", opacity: 0,
                    transition: "opacity 0.2s", display: "flex",
                    flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: "8px", padding: "12px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.8)", textAlign: "center",
                    textTransform: "uppercase" }}>
                    {img.category}
                  </span>
                  {img.description && (
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)",
                      textAlign: "center" }}>
                      {img.description}
                    </span>
                  )}
                  {deleteConfirm === img.id ? (
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button onClick={() => handleDelete(img.id)}
                        style={{ background: "#e00", border: "none", color: "white",
                          borderRadius: "4px", padding: "5px 12px",
                          cursor: "pointer", fontSize: "12px" }}>
                        Delete
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        style={{ background: "rgba(255,255,255,0.15)", border: "none",
                          color: "white", borderRadius: "4px", padding: "5px 12px",
                          cursor: "pointer", fontSize: "12px" }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(img.id)}
                      style={{ background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white", borderRadius: "4px", padding: "5px 12px",
                        cursor: "pointer", fontSize: "12px", marginTop: "4px",
                        transition: "background 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,0,0,0.6)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                    >
                      🗑 Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
