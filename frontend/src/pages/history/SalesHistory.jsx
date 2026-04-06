import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

import { CONTRACT_ADDRESS, SUPPORTED_CHAIN_ID } from "../../config/contract";
import abi from "../../config/abi.json";
import ToastMessage from "../../components/common/ToastMessage";

export default function SalesHistory({ account, status, setStatus }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatAddress = (address) => {
    if (!address) return "-";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(timestamp * 1000).toLocaleString();
  };

  const refreshSalesHistory = async () => {
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

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const count = Number(await contract.getSalesHistoryCount());
      const data = [];

      for (let i = 0; i < count; i++) {
        const item = await contract.getSalesHistoryItem(i);

        data.push({
          fruitId: Number(item[0]),
          fruitName: item[1],
          buyer: item[2],
          seller: item[3],
          quantity: Number(item[4]),
          unitPrice: ethers.formatEther(item[5]),
          totalPrice: ethers.formatEther(item[6]),
          timestamp: Number(item[7]),
        });
      }

      data.reverse();
      setSales(data);
      setStatus("Sales history loaded.");
    } catch (error) {
      console.error("Full sales history loading error:", error);
      setStatus("Error loading sales history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSalesHistory();
  }, [account]);

  const summary = useMemo(() => {
    const totalOrders = sales.length;
    const totalQuantity = sales.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = sales.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    return {
      totalOrders,
      totalQuantity,
      totalRevenue: totalRevenue.toFixed(4),
    };
  }, [sales]);

  return (
    <div>
      <ToastMessage status={status} onClear={() => setStatus(null)} />

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
          <h1 style={{ marginBottom: "6px" }}>Sales History</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            Review all confirmed sales from your store.
          </p>
        </div>

        <button
          type="button"
          className="button-secondary"
          onClick={refreshSalesHistory}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            fontSize: "13px",
            height: "fit-content",
          }}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {!loading && sales.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div className="fruit-card">
            <p style={{ margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
              Total Sales
            </p>
            <h3 style={{ margin: 0 }}>{summary.totalOrders}</h3>
          </div>

          <div className="fruit-card">
            <p style={{ margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
              Total Quantity Sold
            </p>
            <h3 style={{ margin: 0 }}>{summary.totalQuantity}</h3>
          </div>

          <div className="fruit-card">
            <p style={{ margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
              Total Revenue
            </p>
            <h3 style={{ margin: 0 }}>{summary.totalRevenue} ETH</h3>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading sales history...</p>
      ) : sales.length === 0 ? (
        <div className="fruit-card">
          <h3 style={{ marginTop: 0 }}>No sales yet</h3>
          <p style={{ marginBottom: 0, color: "var(--text-secondary)" }}>
            Your completed sales will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {sales.map((item, index) => (
            <div key={index}>
              <div
                className="fruit-card history-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1.3fr",
                  gap: "14px",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 6px 0" }}>{item.fruitName}</h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Fruit ID: #{item.fruitId}
                  </p>
                </div>

                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    Quantity
                  </p>
                  <strong>{item.quantity}</strong>
                </div>

                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    Total Received
                  </p>
                  <strong>{item.totalPrice} ETH</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    Unit: {item.unitPrice} ETH
                  </p>
                </div>

                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    Buyer
                  </p>
                  <strong>{formatAddress(item.buyer)}</strong>
                </div>

                <div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                    Date
                  </p>
                  <strong style={{ fontSize: "14px" }}>
                    {formatDate(item.timestamp)}
                  </strong>
                </div>
              </div>

              {index !== sales.length - 1 && (
                <div
                  style={{
                    height: "1px",
                    background:
                      "linear-gradient(to right, transparent, #d1d5db, transparent)",
                    margin: "14px 0",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}