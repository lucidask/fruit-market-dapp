import { useEffect, useState } from "react";

export default function ToastMessage({ status, onClear }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!status) return;

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      if (onClear) {
        setTimeout(() => onClear(), 250);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [status, onClear]);

  if (!status) return null;

  const lower = status.toLowerCase();

  let bg = "#eff6ff";
  let color = "#1d4ed8";
  let border = "#bfdbfe";

  if (
    lower.includes("succès") ||
    lower.includes("success") ||
    lower.includes("réussi") ||
    lower.includes("connected")
  ) {
    bg = "#ecfdf5";
    color = "#047857";
    border = "#a7f3d0";
  } else if (
    lower.includes("error") ||
    lower.includes("refused") ||
    lower.includes("invalid") ||
    lower.includes("insufficient") ||
    lower.includes("failed") ||
    lower.includes("échec") ||
    lower.includes("échoué")
  ) {
    bg = "#fef2f2";
    color = "#b91c1c";
    border = "#fecaca";
  } else if (
    lower.includes("waiting") ||
    lower.includes("opening") ||
    lower.includes("transaction sent")
  ) {
    bg = "#fffbeb";
    color = "#b45309";
    border = "#fde68a";
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 3000,
        minWidth: "280px",
        maxWidth: "420px",
        padding: "14px 16px",
        borderRadius: "12px",
        border: `1px solid ${border}`,
        backgroundColor: bg,
        color,
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        transition: "all 0.25s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        fontSize: "14px",
        fontWeight: "500",
      }}
    >
      {status}
    </div>
  );
}
