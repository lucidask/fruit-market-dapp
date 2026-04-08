import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ethers } from "ethers";

import ToastMessage from "../components/common/ToastMessage";
import BuyFruitForm from "../components/buyer/BuyFruitForm";
import Card from "../components/common/Card";

import abi from "../config/abi.json";
import { CONTRACT_ADDRESS } from "../config/contract";
import {
  getFruitEmoji,
  renderStars,
  shortenAddress,
} from "../utils/format";

export default function FruitDetails({ account, status, setStatus, isV2 }) {
  const { id } = useParams();

  const [fruit, setFruit] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshFruitDetails = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask is not installed.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      setLoading(true);
      setStatus("Loading...");

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

      const data = await contract.getFruit(id);

      let sellerRating = 0;
      let myPurchase = 0;

      if (isV2) {
        try {
          sellerRating = Number(await contract.getSellerRating(data[4]));
        } catch {
          sellerRating = 0;
        }
      }

      if (account) {
        try {
          myPurchase = Number(await contract.getPurchaseQuantity(id, account));
        } catch {
          myPurchase = 0;
        }
      }

      setFruit({
        id: Number(data[0]),
        name: data[1],
        price: ethers.formatEther(data[2]),
        stock: Number(data[3]),
        seller: data[4],
        active: data[5],
        sellerRating,
        myPurchase,
      });

      setStatus("Fruit details loaded.");
    } catch (error) {
      console.error(error);
      setStatus("Error loading fruit details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFruitDetails();
  }, [id, account]);

  if (loading) {
    return (
      <div>
        <ToastMessage status={status} onClear={() => setStatus(null)} />
        <p>Loading fruit details...</p>
      </div>
    );
  }

  if (!fruit) {
    return (
      <div>
        <ToastMessage status={status} onClear={() => setStatus(null)} />
        <p>Fruit not found.</p>
      </div>
    );
  }

  const isSeller =
    account && fruit.seller.toLowerCase() === account.toLowerCase();

  const isDeleted = !fruit.active;
  const isOutOfStock = fruit.stock <= 0;
  const isUnavailable = isDeleted || isOutOfStock;

  return (
    <div style={{ padding: "20px" }}>
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
          <h1 style={{ margin: "0 0 6px 0" }}>Fruit Details</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            View product information and available actions.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="button-secondary"
            onClick={refreshFruitDetails}
          >
            ↻ Refresh
          </button>

          <Link
            to="/"
            className="button-secondary"
            style={{ textDecoration: "none" }}
          >
            ← Back to Marketplace
          </Link>
        </div>
      </div>

      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "10px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: "32px" }}>{getFruitEmoji(fruit.name)}</span>
              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    margin: 0,
                    wordBreak: "break-word",
                  }}
                >
                  {fruit.name}
                </h2>
                <p
                  style={{
                    margin: "6px 0 0 0",
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    wordBreak: "break-word",
                  }}
                >
                  Fruit ID: #{fruit.id}
                </p>
              </div>
            </div>

            <p
              style={{
                fontSize: "28px",
                fontWeight: "700",
                margin: "0 0 18px 0",
                wordBreak: "break-word",
              }}
            >
              {fruit.price} ETH
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                color: "var(--text-secondary)",
                fontSize: "15px",
                minWidth: 0,
              }}
            >
              <div style={{ wordBreak: "break-word" }}>
                <strong style={{ color: "var(--text-primary)" }}>Seller:</strong>{" "}
                <span title={fruit.seller}>{shortenAddress(fruit.seller)}</span>
              </div>

              <div style={{ wordBreak: "break-word" }}>
                <strong style={{ color: "var(--text-primary)" }}>Status:</strong>{" "}
                {fruit.active ? (
                  <span className="badge badge-success">Active</span>
                ) : (
                  <span className="badge badge-danger">Deleted</span>
                )}
              </div>

              <div style={{ wordBreak: "break-word" }}>
                <strong style={{ color: "var(--text-primary)" }}>Availability:</strong>{" "}
                {isOutOfStock ? (
                  <span className="badge badge-danger">❌ Out of Stock</span>
                ) : fruit.stock <= 5 ? (
                  <span className="badge badge-warning">⚠ Low Stock ({fruit.stock})</span>
                ) : (
                  <span className="badge badge-success">✔ In Stock ({fruit.stock})</span>
                )}
              </div>

              {fruit.myPurchase > 0 && (
                <div style={{ wordBreak: "break-word" }}>
                  <strong style={{ color: "var(--text-primary)" }}>
                    Your total purchases:
                  </strong>{" "}
                  {fruit.myPurchase}
                </div>
              )}

              {fruit.sellerRating > 0 && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 10px",
                    border: "1px solid var(--border)",
                    borderRadius: "999px",
                    backgroundColor: "#fffaf0",
                    width: "fit-content",
                    maxWidth: "100%",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ color: "#f59e0b", letterSpacing: "1px" }}>
                    {renderStars(fruit.sellerRating)}
                  </span>
                  <span style={{ fontSize: "13px", wordBreak: "break-word" }}>
                    {fruit.sellerRating}/5 seller rating
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "18px",
                background: "#fafafa",
                height: "fit-content",
                minWidth: 0,
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "12px" }}>Actions</h3>

              {isSeller ? (
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      marginTop: 0,
                      color: "var(--text-secondary)",
                      wordBreak: "break-word",
                    }}
                  >
                    This fruit belongs to your store.
                  </p>
                  <Link
                    to={`/seller?highlight=${fruit.id}`}
                    className="button-secondary"
                    style={{
                      textDecoration: "none",
                      display: "inline-flex",
                    }}
                  >
                    Go to My Store
                  </Link>
                </div>
              ) : isUnavailable ? (
                <p
                  style={{
                    margin: 0,
                    color: "var(--danger)",
                    fontWeight: "600",
                    wordBreak: "break-word",
                  }}
                >
                  This fruit is currently unavailable for purchase.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    minWidth: 0,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "var(--text-secondary)",
                      wordBreak: "break-word",
                    }}
                  >
                    Choose a quantity and complete your purchase.
                  </p>

                  <BuyFruitForm
                    fruitId={fruit.id}
                    price={fruit.price}
                    stock={fruit.stock}
                    setStatus={setStatus}
                    refreshFruits={refreshFruitDetails}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}