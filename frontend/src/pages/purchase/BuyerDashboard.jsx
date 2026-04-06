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
      setLoading(true);
      setStatus("Loading...");

      const provider = new ethers.BrowserProvider(window.ethereum);

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SUPPORTED_CHAIN_ID) {
        setStatus("Wrong network. Please switch to Sepolia.");
        return;
      }

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

            purchased.push({
              id: Number(fruit[0]),
              name: fruit[1],
              price: ethers.formatEther(fruit[2]),
              stock: Number(fruit[3]),
              seller: fruit[4],
              active: fruit[5],
              quantity: Number(quantity),
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
    refreshPurchases();
  }, [account]);

  return (
    <div>
      <h1>Buyer Dashboard</h1>

      <ToastMessage status={status} onClear={() => setStatus(null)} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            View all fruits you have purchased and rate sellers after completed orders.
          </p>
        </div>

        <button
          type="button"
          className="button-secondary"
          onClick={refreshPurchases}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 10px",
            fontSize: "13px",
          }}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
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