import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ToastMessage from "../components/common/ToastMessage";
import FruitList from "../components/common/FruitList";
import abi from "../config/abi.json";
import { CONTRACT_ADDRESS } from "../config/contract";
import { getBrowserProvider, checkSupportedNetwork } from "../utils/web3";

export default function Marketplace({ account, status, setStatus, isV2 }) {
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshFruits = async () => {
    const provider = await getBrowserProvider(setStatus);
    if (!provider) return;

    if (!account) {
      setFruits([]);
      setStatus("Please connect your wallet.");
      return;
    }

    const isSupported = await checkSupportedNetwork(provider, setStatus);
    if (!isSupported) {
      setFruits([]);
      return;
    }

    try {
      setLoading(true);
      setStatus("Loading...");

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

      const count = await contract.getFruitCount();
      const fruitsData = [];

      for (let i = 1; i <= Number(count); i++) {
        const fruit = await contract.getFruit(i);

        let sellerRating = "N/A";
        let myPurchase = 0;
        let alreadyRated = false;

        if (isV2) {
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

        if (isV2 && account) {
          try {
            alreadyRated = await contract.hasRated(account, fruit[4]);
          } catch {
            alreadyRated = false;
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
          alreadyRated,
        });
      }

      setFruits(fruitsData);
      setStatus("");
    } catch (error) {
      console.error("Full marketplace loading error:", error);
      setStatus("Error loading marketplace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!account) {
      setFruits([]);
      return;
    }

    refreshFruits();
  }, [account]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
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
          <h1 style={{ margin: "0 0 6px 0" }}>Fruit Market DApp</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            Browse available fruits, check seller ratings, and buy directly from
            the marketplace.
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
