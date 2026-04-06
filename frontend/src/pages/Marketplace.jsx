import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ToastMessage from "../components/common/ToastMessage";
import FruitList from "../components/common/FruitList";
import abi from "../config/abi.json";
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from "../config/contract";

export default function Marketplace({
  account,
  setAccount,
  status,
  setStatus,
  isV2,
}) {
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshFruits = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask is not installed.");
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

      let v2Available = false;
      try {
        await contract.getSellerRating(CONTRACT_ADDRESS);
        v2Available = true;
      } catch {
        v2Available = false;
      }

      const count = await contract.getFruitCount();
      const fruitsData = [];

      for (let i = 1; i <= Number(count); i++) {
        const fruit = await contract.getFruit(i);

        let sellerRating = "N/A";
        let myPurchase = 0;

        if (v2Available) {
          try {
            const rating = await contract.getSellerRating(fruit[4]);
            sellerRating = Number(rating);
          } catch {
            sellerRating = "N/A";
          }
        }

        if (account) {
          try {
            const quantity = await contract.getPurchaseQuantity(i, account);
            myPurchase = Number(quantity);
          } catch {
            myPurchase = 0;
          }
        }

        fruitsData.push({
          id: Number(fruit[0]),
          name: fruit[1],
          price: ethers.formatEther(fruit[2]),
          stock: Number(fruit[3]),
          seller: fruit[4],
          active: fruit[5],
          sellerRating,
          myPurchase,
        });
      }

      setFruits(fruitsData);
      setStatus("Marketplace loaded.");
    } catch (error) {
      console.error("Full marketplace loading error:", error);
      setStatus("Error loading marketplace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      refreshFruits();
    }
  }, [account]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Fruit Market DApp</h1>

      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>
          Browse available fruits, check seller ratings, and buy directly from the marketplace.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          className="button-secondary"
          onClick={refreshFruits}
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
        isV2={isV2}
        setStatus={setStatus}
        refreshFruits={refreshFruits}
        mode="marketplace"
      />

      <ToastMessage status={status} onClear={() => setStatus("")} />
    </div>
  );
}