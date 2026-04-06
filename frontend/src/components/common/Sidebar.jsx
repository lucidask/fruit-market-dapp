import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Sidebar({ isV2 }) {
  const location = useLocation();

  const isHistoryRoute =
    location.pathname === "/purchase-history" ||
    location.pathname === "/sales-history";

  const [historyOpen, setHistoryOpen] = useState(isHistoryRoute);

  useEffect(() => {
    if (isHistoryRoute) {
      setHistoryOpen(true);
    }
  }, [isHistoryRoute]);

  const linkStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    marginBottom: "8px",
    textDecoration: "none",
    color: location.pathname === path ? "#111827" : "#e5e7eb",
    backgroundColor: location.pathname === path ? "#ffffff" : "transparent",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: location.pathname === path ? "600" : "500",
    lineHeight: "1.2",
    transition: "all 0.2s ease",
  });

  const menuButtonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    marginBottom: historyOpen ? "6px" : "8px",
    backgroundColor: isHistoryRoute ? "#ffffff" : "transparent",
    color: isHistoryRoute ? "#111827" : "#e5e7eb",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: isHistoryRoute ? "600" : "500",
    lineHeight: "1.2",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
  };

  const subLinkStyle = (path) => ({
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 12px 8px 28px",
    marginBottom: "6px",
    textDecoration: "none",
    color: location.pathname === path ? "#111827" : "#d1d5db",
    backgroundColor: location.pathname === path ? "#ffffff" : "transparent",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: location.pathname === path ? "600" : "500",
    lineHeight: "1.2",
    transition: "all 0.2s ease",
  });

  return (
    <aside
      style={{
        width: "230px",
        minHeight: "100vh",
        backgroundColor: "var(--bg-sidebar)",
        color: "white",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      <div>
        <h3
          style={{
            marginTop: 0,
            marginBottom: "20px",
            paddingLeft: "4px",
            fontSize: "18px",
            fontWeight: "700",
            color: "#ffffff",
          }}
        >
          Menu
        </h3>

        <nav style={{ display: "flex", flexDirection: "column" }}>
          <Link to="/" style={linkStyle("/")}>
            <span>Marketplace</span>
          </Link>

          <Link to="/buyer-dashboard" style={linkStyle("/buyer-dashboard")}>
            <span>Buyer Dashboard</span>
          </Link>

          <Link to="/seller" style={linkStyle("/seller")}>
            <span>My Store</span>
          </Link>

          <button
            type="button"
            style={menuButtonStyle}
            onClick={() => setHistoryOpen((prev) => !prev)}
          >
            <span>History</span>
            <span style={{ fontSize: "13px" }}>
              {historyOpen ? "▾" : "▸"}
            </span>
          </button>

          {historyOpen && (
            <div style={{ marginBottom: "4px" }}>
              <Link
                to="/purchase-history"
                style={subLinkStyle("/purchase-history")}
              >
                Purchase History
              </Link>

              <Link
                to="/sales-history"
                style={subLinkStyle("/sales-history")}
              >
                Sales History
              </Link>
            </div>
          )}
        </nav>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.18)",
          paddingTop: "14px",
          fontSize: "13px",
          color: "#d1d5db",
          lineHeight: "1.5",
        }}
      >
        <strong style={{ color: "#f9fafb" }}>Contract version:</strong>{" "}
        <span style={{ color: isV2 ? "#22c55e" : "#9ca3af", fontWeight: "600" }}>
          {isV2 ? "V2" : "V1"}
        </span>
      </div>
    </aside>
  );
}