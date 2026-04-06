import WalletConnect from "./WalletConnect";

export default function Navbar({ account, setAccount, setStatus }) {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid #ccc",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div style={{ fontWeight: "bold" }}>
        Fruit Market DApp
      </div>

      <div>
        <WalletConnect
          account={account}
          setAccount={setAccount}
          setStatus={setStatus}
        />
      </div>
    </nav>
  );
}