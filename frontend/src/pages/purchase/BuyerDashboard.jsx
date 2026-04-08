import { useState, useEffect } from "react";
import { ethers } from "ethers";

import ToastMessage from "../../components/common/ToastMessage";
import FruitList from "../../components/common/FruitList";

import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from "../../config/contract";
import abi from "../../config/abi.json";

export default function BuyerDashboard({
  account,
  setAccount,
  status,
  setStatus,
  isV2,
}) {
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshPurchases = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask is not installed.");
      return;
    }

    if (!account) {
      setStatus("Please connect your wallet.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
        setStatus("Wrong network. Please switch to Sepolia.");
        return;
      }

      setLoading(true); // 🔥 déplacé ici
      setStatus("Loading...");

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

      const count = Number(await contract.getFruitCount());
      let purchased = [];

      for (let i = 1; i <= count; i++) {
        try {
          const fruit = await contract.getFruit(i);
          const quantity = await contract.getPurchaseQuantity(i, account);

          if (Number(quantity) > 0) {
            let sellerRating = 0;
            let alreadyRated = false;

            if (isV2) {
              try {
                sellerRating = Number(await contract.getSellerRating(fruit[4]));
              } catch {
                sellerRating = 0;
              }

              try {
                alreadyRated = await contract.hasRated(account, fruit[4]);
              } catch {
                alreadyRated = false;
              }
            }

            purchased.push({
              id: Number(fruit[0]),
              name: fruit[1],
              price: ethers.formatEther(fruit[2]),
              stock: Number(fruit[3]),
              seller: fruit[4],
              active: fruit[5],
              myPurchase: Number(quantity), // 🔥 correction ici
              sellerRating,
              alreadyRated,
            });
          }
        } catch {
          continue;
        }
      }

      setFruits(purchased);
      setStatus("Purchases loaded.");
    } catch (error) {
      console.error("Full buyer dashboard loading error:", error);
      setStatus("Error loading purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      refreshPurchases(); // 🔥 évite appel inutile
    }
  }, [account]);

  return (
    <div>
       <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 6px 0" }}>Buyer Dashboard</h1>
           <ToastMessage status={status} onClear={() => setStatus(null)} />

          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            View all fruits you have purchased and rate sellers after completed orders.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
          type="button"
          className="button-secondary"
          onClick={refreshPurchases}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
        </div>
      </div>

      <FruitList
        fruits={fruits}
        account={account}
        setStatus={setStatus}
        refreshFruits={refreshPurchases}
        mode="buyer"
        isV2={isV2}
      />
    </div>
  );
}