import WalletConnect from "./WalletConnect";

export default function Navbar({ account, setAccount, setStatus }) {
  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask is not installed.");
      return;
    }

    try {
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (chainId !== "0xaa36a7") {
        setStatus("Please switch to the Sepolia network.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);
      setStatus("Wallet connected successfully.");
    } catch (error) {
      if (error.code === 4001) {
        setStatus("Connection rejected by the user.");
      } else {
        setStatus("Error while connecting wallet.");
      }
    }
  };

  return (
    <WalletConnect
      account={account}
      setAccount={setAccount}
      setStatus={setStatus}
    >
      {({ account, shortAccount, isSepolia }) => (
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
          <div style={{ fontWeight: "bold" }}>Fruit Market DApp</div>

          <div>
            {account && isSepolia ? (
              <span style={{ fontWeight: "bold" }}>
                Connected: {shortAccount}
              </span>
            ) : (
              <button onClick={connectWallet}>Connect MetaMask</button>
            )}
          </div>
        </nav>
      )}
    </WalletConnect>
  );
}
