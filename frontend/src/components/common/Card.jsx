export default function Card({ children, classname="", style={}, ...props }) {
  return (
    <div
    className={classname}
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "300px",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.06)";
      }}
      {...props}
    >
      {children}
    </div>
  );
}
