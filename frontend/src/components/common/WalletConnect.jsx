import { useEffect } from "react";

export default function WalletConnect({ account, setAccount, setStatus }) {

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask non installé.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);
      setStatus("Wallet connecté avec succès.");

      // 🔥 Vérifie le réseau
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (chainId !== "0xaa36a7") { // Sepolia = 11155111
        setStatus("Veuillez vous connecter au réseau Sepolia.");
      }

    } catch (error) {
      if (error.code === 4001) {
        setStatus("Connexion refusée par l'utilisateur.");
      } else {
        setStatus("Erreur lors de la connexion du wallet.");
      }
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkConnection();
  }, [setAccount]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setStatus("Compte changé.");
      } else {
        setAccount(null);
        setStatus("Aucun compte connecté.");
      }
    };

    const handleChainChanged = () => {
      window.location.reload(); // 🔥 important pour éviter bugs réseau
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [setAccount, setStatus]);

  const shortAccount = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  return (
    <div>
      {account ? (
        <span style={{ fontWeight: "bold" }}>
          Connected: {shortAccount}
        </span>
      ) : (
        <button onClick={connectWallet}>
          Connecter MetaMask
        </button>
      )}
    </div>
  );
}