import { useState, useEffect } from "react";

import AddFruitForm from "../../components/seller/AddFruitForm";
import FruitList from "../../components/common/FruitList";
import ToastMessage from "../../components/common/ToastMessage";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from "../../config/contract";
import abi from "../../config/abi.json";
import Card from "../../components/common/Card";
import { useLocation } from "react-router-dom";

export default function MyStore({
  account,
  setAccount,
  status,
  setStatus,
  isV2,
}) {
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("highlight");

  const refreshFruits = async () => {
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
      let fruitsData = [];

      for (let i = 1; i <= count; i++) {
        try {
          const fruit = await contract.getFruit(i);

          if (fruit[4].toLowerCase() !== account.toLowerCase()) continue;

          fruitsData.push({
            id: Number(fruit[0]),
            name: fruit[1],
            price: ethers.formatEther(fruit[2]),
            stock: Number(fruit[3]),
            seller: fruit[4],
            active: fruit[5],
          });
        } catch {
          continue;
        }
      }

      setFruits(fruitsData);
      setStatus("Store loaded.");
    } catch (error) {
      console.error("Full store loading error:", error);
      setStatus("Error loading store.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFruits();
  }, [account]);

  const activeFruits = fruits.filter((fruit) => fruit.active).length;
  const inactiveFruits = fruits.filter((fruit) => !fruit.active).length;

  return (
    <div>
      <h1>My Store</h1>

      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>
          Manage your products, update stock, and track the fruits listed in your store.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <Card>
          <h3>Total Fruits</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            {fruits.length}
          </p>
        </Card>

        <Card>
          <h3>Active</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            {activeFruits}
          </p>
        </Card>

        <Card>
          <h3>Inactive</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            {inactiveFruits}
          </p>
        </Card>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <AddFruitForm
          account={account}
          setStatus={setStatus}
          refreshFruits={refreshFruits}
        />
      </div>

      <div>
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
          <div>
            <h2 className="section-title">My Fruits</h2>
            <p className="section-subtitle">
              View, update, or remove the fruits linked to your wallet.
            </p>
          </div>

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
          setStatus={setStatus}
          isV2={isV2}
          refreshFruits={refreshFruits}
          highlightId={highlightId}
          mode="seller"
        />
      </div>

      <ToastMessage status={status} onClear={() => setStatus(null)} />
    </div>
  );
}