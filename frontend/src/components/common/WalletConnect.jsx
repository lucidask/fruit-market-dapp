import { useEffect, useState } from "react";
import { getCurrentChainId } from "../../utils/web3";

export default function WalletConnect({
  account,
  setAccount,
  setStatus,
  children,
}) {
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    if (!window.ethereum) return;

    const init = async () => {
      const currentChainId = await getCurrentChainId();
      setChainId(currentChainId);

      setAccount(null);
    };

    init();

    const handleAccountsChanged = () => {
      setAccount(null);
      setStatus("Account changed. Please reconnect.");
    };

    const handleChainChanged = async (newChainId) => {
      setChainId(newChainId);
      setAccount(null);
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

  return children({
    account,
    shortAccount,
    chainId,
    isSepolia: chainId === "0xaa36a7",
  });
}
