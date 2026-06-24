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
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [images, setImages] = useState<DbImage[]>([]);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("potræt");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Profile state
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef("");

  const fetchImages = useCallback(async () => {
    const res = await fetch("/api/images");
    if (res.ok) setImages(await res.json());
  }, []);

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      if (data.url) setProfileUrl(data.url);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchImages();
      fetchProfile();
    }
  }, [authed, fetchImages, fetchProfile]);

  const handleAuth = () => {
    passwordRef.current = password;
    setAuthed(true);
  };

  const addFiles = (incoming: File[]) =>
    setFiles((prev) => [
      ...prev,
      ...incoming.filter((f) => f.type.startsWith("image/")),
    ]);

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
      log[i] = `⏳ Uploader ${f.name}…`;
      setProgress([...log]);

      const form = new FormData();
      form.append("image", f);
      form.append("category", category);
      form.append("description", description || f.name.replace(/\.[^.]+$/, ""));
      form.append("alt", f.name.replace(/\.[^.]+$/, ""));

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "x-admin-password": passwordRef.current },
          body: form,
        });

        if (res.status === 401) {
          setError("Forkert adgangskode. Genindlæs siden og prøv igen.");
          setAuthed(false);
          setUploading(false);
          return;
        }
        log[i] = res.ok
          ? `✅ ${f.name} uploadet!`
          : `❌ ${f.name}: ${(await res.json()).error}`;
      } catch {
        log[i] = `❌ ${f.name}: netværksfejl`;
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
    else setError("Sletning fejlede.");
    setDeleteConfirm(null);
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setProfileFile(f);
    setProfilePreview(URL.createObjectURL(f));
    setProfileMsg("");
  };

  const handleProfileUpload = async () => {
    if (!profileFile) return;
    setProfileUploading(true);
    setProfileMsg("");

    const form = new FormData();
    form.append("image", profileFile);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "x-admin-password": passwordRef.current },
        body: form,
      });

      if (res.ok) {
        const data = await res.json();
        setProfileUrl(data.url);
        setProfileFile(null);
        setProfilePreview(null);
        setProfileMsg("✅ Profilbillede opdateret!");
      } else {
        setProfileMsg("❌ Upload fejlede.");
      }
    } catch {
      setProfileMsg("❌ Netværksfejl.");
    }
    setProfileUploading(false);
  };

  const btnBase: React.CSSProperties = {
    background: "none",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "rgba(255,255,255,0.8)",
    borderRadius: "6px",
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "13px",
    letterSpacing: "0.05em",
    transition: "all 0.2s",
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            width: "320px",
            padding: "40px",
          }}
        >
          <h2
            style={{
              color: "white",
              fontWeight: 300,
              fontSize: "28px",
              letterSpacing: "0.05em",
              margin: 0,
            }}
          >
            Admin
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "14px",
              margin: 0,
            }}
          >
            Indtast din adgangskode for at administrere billeder.
          </p>
          <input
            type="password"
            placeholder="Adgangskode"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "6px",
              color: "white",
              padding: "10px 14px",
              fontSize: "15px",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleAuth}
            style={{
              background: "white",
              color: "#0d0d0d",
              border: "none",
              borderRadius: "6px",
              padding: "11px",
              fontSize: "15px",
              cursor: "pointer",
              fontWeight: 500,
              letterSpacing: "0.03em",
            }}
          >
            Log ind
          </button>
        </div>
      </div>
    );
  }

  // ── Admin panel ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d0d0d",
        color: "white",
        padding: "48px 40px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "56px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(36px, 8vw, 72px)",
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            ADMIN
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "13px",
              letterSpacing: "0.15em",
              marginTop: "6px",
            }}
          >
            SYLVIA PHOTOGRAPHY
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="/"
            style={{
              ...btnBase,
              textDecoration: "none",
              display: "inline-block",
              textAlign: "center",
            }}
          >
            ← Portfolio
          </a>
          <button
            style={btnBase}
            onClick={() => {
              setAuthed(false);
              setPassword("");
            }}
          >
            Log ud
          </button>
        </div>
      </div>

      {/* ── Profile section ── */}
      <section style={{ marginBottom: "56px" }}>
        <h3
          style={{
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "20px",
            fontWeight: 400,
            textTransform: "uppercase",
          }}
        >
          Profilbillede
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          {/* Current profile */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.15)",
              flexShrink: 0,
              background: "#1a1a1a",
            }}
          >
            <img
              src={profilePreview || profileUrl || "./assets/profile.jpeg"}
              alt="Profil"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {profileUrl
                ? "Nuværende profilbillede fra Cloudinary"
                : "Bruger standard profilbillede"}
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => profileInputRef.current?.click()}
                style={btnBase}
              >
                Vælg nyt billede
              </button>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileFileChange}
                style={{ display: "none" }}
              />
              {profileFile && (
                <button
                  onClick={handleProfileUpload}
                  disabled={profileUploading}
                  style={{
                    background: "white",
                    color: "#0d0d0d",
                    border: "none",
                    borderRadius: "6px",
                    padding: "7px 16px",
                    fontSize: "13px",
                    cursor: profileUploading ? "not-allowed" : "pointer",
                    fontWeight: 500,
                    opacity: profileUploading ? 0.5 : 1,
                  }}
                >
                  {profileUploading ? "Uploader…" : "Gem profilbillede"}
                </button>
              )}
            </div>
            {profileMsg && (
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: profileMsg.startsWith("✅") ? "#4caf50" : "#ff6b6b",
                }}
              >
                {profileMsg}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Upload section ── */}
      <section style={{ marginBottom: "56px" }}>
        <h3
          style={{
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "20px",
            fontWeight: 400,
            textTransform: "uppercase",
          }}
        >
          Upload nye billeder
        </h3>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragging ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}`,
            borderRadius: "8px",
            padding: "48px 32px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(255,255,255,0.05)" : "transparent",
            transition: "all 0.2s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              e.target.files && addFiles(Array.from(e.target.files))
            }
            style={{ display: "none" }}
          />
          <span style={{ fontSize: "28px" }}>📷</span>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.7)",
              fontSize: "15px",
            }}
          >
            Træk & slip billeder her, eller klik for at vælge
          </p>
          <small style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
            JPG · PNG · WEBP — maks 20 MB per billede
          </small>
        </div>

        {/* Options & queue */}
        {files.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 400,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.05em",
              }}
            >
              {files.length} billede{files.length > 1 ? "r" : ""} klar til
              upload
            </h4>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  color: "white",
                  padding: "8px 12px",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: "#1a1a1a" }}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Beskrivelse (valgfri)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "6px",
                  color: "white",
                  padding: "8px 12px",
                  fontSize: "14px",
                  outline: "none",
                  flex: 1,
                  minWidth: "180px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                  }}
                >
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.7)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.3)",
                      flexShrink: 0,
                    }}
                  >
                    {(f.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      fontSize: "16px",
                      padding: "0 4px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#e00")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                background: "white",
                color: "#0d0d0d",
                border: "none",
                borderRadius: "6px",
                padding: "12px",
                fontSize: "14px",
                cursor: uploading ? "not-allowed" : "pointer",
                fontWeight: 500,
                letterSpacing: "0.03em",
                opacity: uploading ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {uploading
                ? "Uploader…"
                : `Upload ${files.length} billede${files.length > 1 ? "r" : ""}`}
            </button>
          </div>
        )}

        {progress.length > 0 && (
          <div
            style={{
              marginTop: "12px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "6px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {progress.map((msg, i) => (
              <div
                key={i}
                style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)" }}
              >
                {msg}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div
            style={{ marginTop: "12px", color: "#ff6b6b", fontSize: "13px" }}
          >
            {error}
          </div>
        )}
      </section>

      {/* ── Gallery management ── */}
      <section>
        <h3
          style={{
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "20px",
            fontWeight: 400,
            textTransform: "uppercase",
          }}
        >
          Uploadede billeder ({images.length})
        </h3>

        {images.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
            Ingen uploadede billeder endnu.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {images.map((img) => (
              <div
                key={img.id}
                style={{
                  position: "relative",
                  borderRadius: "6px",
                  overflow: "hidden",
                  aspectRatio: "1",
                  background: "#1a1a1a",
                }}
                onMouseEnter={(e) => {
                  const o = e.currentTarget.querySelector(
                    ".adm-ov",
                  ) as HTMLElement;
                  if (o) o.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const o = e.currentTarget.querySelector(
                    ".adm-ov",
                  ) as HTMLElement;
                  if (o) o.style.opacity = "0";
                  if (deleteConfirm === img.id) setDeleteConfirm(null);
                }}
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {/* Delete button always visible bottom-right */}
                <button
                  onClick={() =>
                    setDeleteConfirm(deleteConfirm === img.id ? null : img.id)
                  }
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "white",
                    borderRadius: "6px",
                    padding: "5px 8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    transition: "background 0.2s",
                    zIndex: 2,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(180,0,0,0.85)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(0,0,0,0.7)")
                  }
                >
                  🗑
                </button>

                {/* Overlay with info */}
                <div
                  className="adm-ov"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    pointerEvents: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.9)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    {img.category}
                  </span>
                  {img.description && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                      }}
                    >
                      {img.description}
                    </span>
                  )}
                </div>

                {/* Confirm delete */}
                {deleteConfirm === img.id && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.88)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      zIndex: 3,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "white",
                        textAlign: "center",
                      }}
                    >
                      Slet dette billede?
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleDelete(img.id)}
                        style={{
                          background: "#cc0000",
                          border: "none",
                          color: "white",
                          borderRadius: "5px",
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Ja, slet
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        style={{
                          background: "rgba(255,255,255,0.15)",
                          border: "none",
                          color: "white",
                          borderRadius: "5px",
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Annuller
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
