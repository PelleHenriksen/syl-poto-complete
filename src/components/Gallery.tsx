import React, { useState, useEffect, useRef, useCallback } from "react";

const categories = [
  "produkt",
  "lys",
  "raportage",
  "potræt",
  "byggninger",
  "Dyr",
];

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  category: string;
  description: string;
}

// Static images already in public/assets
const staticImages: GalleryImage[] = [];

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({
  image,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: {
  image: GalleryImage;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasNext) onNext();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [image, onClose, onNext, onPrev, hasNext, hasPrev]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(255,255,255,0.1)",
          border: "none",
          color: "white",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          transition: "background 0.2s",
          zIndex: 1001,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
        }
      >
        ✕
      </button>

      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          style={{
            position: "absolute",
            left: "16px",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            transition: "background 0.2s",
            zIndex: 1001,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          style={{
            position: "absolute",
            right: "16px",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            transition: "background 0.2s",
            zIndex: 1001,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
        >
          ›
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          animation: "slideIn 0.2s ease-out",
        }}
      >
        {!isLoaded && (
          <div
            style={{
              width: "80vw",
              maxWidth: "900px",
              height: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Loading...
          </div>
        )}
        <img
          src={image.src}
          alt={image.alt}
          onLoad={() => setIsLoaded(true)}
          style={{
            maxWidth: "90vw",
            maxHeight: "85vh",
            objectFit: "contain",
            display: isLoaded ? "block" : "none",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        />
        <div
          style={{
            textAlign: "center",
            marginTop: "16px",
            color: "rgba(255,255,255,0.7)",
            fontSize: "14px",
            letterSpacing: "0.1em",
          }}
        >
          {image.description} • {image.category.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

// ── Lazy Image ────────────────────────────────────────────────────────────────
function LazyImage({
  img,
  onClick,
  marginBottom,
}: {
  img: GalleryImage;
  onClick: () => void;
  marginBottom: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        breakInside: "avoid",
        overflow: "hidden",
        cursor: "pointer",
        marginBottom,
        minHeight: "200px",
        backgroundColor: loaded ? "transparent" : "#1a1a1a",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        {!loaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        )}
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <img
          src={visible ? img.src : ""}
          alt={img.alt}
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "cover",
            display: "block",
            transition: "transform 0.5s, opacity 0.3s",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            opacity: loaded ? 1 : 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: hovered ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0)",
            transition: "background-color 0.3s",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px",
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.8)",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "4px 8px",
            }}
          >
            {img.description}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Gallery ──────────────────────────────────────────────────────────────
export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dbImages, setDbImages] = useState<GalleryImage[]>([]);

  // Fetch uploaded images from the API
  useEffect(() => {
    fetch("/api/images")
      .then((res) => (res.ok ? res.json() : []))
      .then(
        (
          data: {
            id: number;
            url: string;
            alt: string;
            category: string;
            description: string;
          }[],
        ) => {
          const mapped: GalleryImage[] = data.map((img, i) => ({
            id: 10000 + i, // avoid ID collision with static images
            src: img.url,
            alt: img.alt || "Photo",
            category: img.category || "potræt",
            description: img.description || img.alt || "Photo",
          }));
          setDbImages(mapped);
        },
      )
      .catch(() => {}); // silently fail — static images still show
  }, []);

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Merge: DB images (newest first) + static images
  const allImages = [...dbImages, ...staticImages];

  const filtered =
    activeCategory === null
      ? allImages
      : allImages.filter((img) => img.category === activeCategory);

  // Responsive values
  const marginLeft = isMobile ? 0 : isTablet ? "280px" : "370px";
  const titlePadding = isMobile
    ? "80px 16px 0"
    : isTablet
      ? "60px 32px 0"
      : "40px 48px 0";
  const titleSize = isMobile
    ? "clamp(60px, 18vw, 100px)"
    : isTablet
      ? "clamp(80px, 16vw, 150px)"
      : "clamp(100px, 14vw, 200px)";
  const filterPadding = isMobile
    ? "16px"
    : isTablet
      ? "20px 32px"
      : "24px 48px";
  const gridPadding = isMobile ? "16px" : isTablet ? "24px 32px" : "32px 48px";
  const gridColumns = isMobile ? 1 : 2;
  const imageGap = isMobile ? "12px" : isTablet ? "16px" : "24px";

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const goToNext = useCallback(() => {
    if (lightboxIndex !== null && lightboxIndex < filtered.length - 1)
      setLightboxIndex(lightboxIndex + 1);
  }, [lightboxIndex, filtered.length]);
  const goToPrev = useCallback(() => {
    if (lightboxIndex !== null && lightboxIndex > 0)
      setLightboxIndex(lightboxIndex - 1);
  }, [lightboxIndex]);

  return (
    <div
      style={{
        marginLeft,
        minHeight: "100vh",
        backgroundColor: "#0d0d0d",
        color: "white",
        paddingTop: isMobile ? "60px" : 0,
      }}
    >
      {/* Big Title */}
      <div style={{ padding: titlePadding, overflow: "hidden" }}>
        <h1
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "white",
            userSelect: "none",
            margin: 0,
          }}
        >
          SYLVIA
        </h1>
      </div>

      {/* Category Filter */}
      <div
        style={{
          padding: filterPadding,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "12px" : "0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "16px" : "32px",
            overflowX: isMobile ? "auto" : "visible",
            WebkitOverflowScrolling: "touch",
            paddingBottom: isMobile ? "4px" : 0,
            scrollbarWidth: "none",
          }}
          className="hide-scrollbar"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: isMobile ? "14px" : "16px",
                letterSpacing: "0.05em",
                color:
                  activeCategory === cat ? "white" : "rgba(255,255,255,0.6)",
                fontWeight: activeCategory === cat ? 500 : 400,
                transition: "color 0.2s",
                padding: 0,
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: isMobile ? "14px" : "16px",
            letterSpacing: "0.05em",
            color: activeCategory === null ? "white" : "rgba(255,255,255,0.4)",
            fontWeight: activeCategory === null ? 500 : 400,
            transition: "color 0.2s",
            padding: 0,
            whiteSpace: "nowrap",
          }}
        >
          Show all
        </button>
      </div>

      {/* Image Grid */}
      <div style={{ padding: gridPadding }}>
        <div style={{ columnCount: gridColumns, columnGap: imageGap }}>
          {filtered.map((img, index) => (
            <LazyImage
              key={img.id}
              img={img}
              marginBottom={imageGap}
              onClick={() => openLightbox(index)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "256px",
              color: "rgba(255,255,255,0.3)",
              fontSize: "18px",
            }}
          >
            No images in this category
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          image={filtered[lightboxIndex]}
          onClose={closeLightbox}
          onNext={goToNext}
          onPrev={goToPrev}
          hasNext={lightboxIndex < filtered.length - 1}
          hasPrev={lightboxIndex > 0}
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
