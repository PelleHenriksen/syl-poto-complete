import React, { useState, useEffect } from "react";

const navLinks = [{ label: "Portfolio" }, { label: "Extra" }];

function FacebookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

export default function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profileSrc, setProfileSrc] = useState("./assets/profile.jpeg");

  useEffect(() => {
    // Load profile image from API (falls back to static if not set)
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.url) setProfileSrc(data.url);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const profileImg = (size: number) => (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      <img
        src={profileSrc}
        alt="Profile"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <>
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            backgroundColor: "#0d0d0d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            zIndex: 100,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {profileImg(40)}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </header>

        {menuOpen && (
          <div
            style={{
              position: "fixed",
              top: "60px",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#0d0d0d",
              zIndex: 99,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "32px",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href="#portfolio"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: "white",
                  textDecoration: "none",
                  fontSize: "28px",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                }}
              >
                {link.label}
              </a>
            ))}
            <div style={{ display: "flex", gap: "32px", marginTop: "24px" }}>
              <a
                href="https://www.facebook.com/sylvia.lykke?locale=da_DK"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.instagram.com/sylle_jensen28/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "280px",
        backgroundColor: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
      }}
    >
      <div
        style={{
          padding: "80px 24px 24px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {profileImg(70)}
      </div>

      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 24px",
          gap: "4px",
          marginTop: "-48px",
        }}
      >
        {navLinks.map((link) => (
          <a
            key={link.label}
            href="#portfolio"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "22px",
              fontWeight: 300,
              letterSpacing: "0.05em",
              padding: "6px 0",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          gap: "16px",
        }}
      >
        <a
          href="https://www.facebook.com/sylvia.lykke?locale=da_DK"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(255,255,255,0.6)", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
          }
        >
          <FacebookIcon />
        </a>
        <a
          href="https://www.instagram.com/sylle_jensen28/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(255,255,255,0.6)", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
          }
        >
          <InstagramIcon />
        </a>
      </div>
    </aside>
  );
}
